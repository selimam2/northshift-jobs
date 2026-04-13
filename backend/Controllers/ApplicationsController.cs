using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NorthShift.Api.Data;
using NorthShift.Api.DTOs.Applications;
using NorthShift.Api.Models;
using NorthShift.Api.Services;
using System.Security.Claims;

namespace NorthShift.Api.Controllers;

[ApiController]
[Route("api/applications")]
public class ApplicationsController(AppDbContext db, EmailService emailService, S3Service s3) : ControllerBase
{
    // Public — get a presigned S3 upload URL (call before submitting application)
    [HttpGet("presigned-upload")]
    public IActionResult GetUploadUrl([FromQuery] string filename)
    {
        if (string.IsNullOrWhiteSpace(filename))
            return BadRequest(new { error = "filename is required" });

        var ext = Path.GetExtension(filename).ToLowerInvariant();
        if (ext is not (".pdf" or ".doc" or ".docx"))
            return BadRequest(new { error = "Only PDF, DOC, and DOCX files are accepted" });

        var s3Key = $"resumes/{Guid.NewGuid()}{ext}";
        var uploadUrl = s3.GenerateUploadUrl(s3Key, TimeSpan.FromMinutes(10));

        return Ok(new { uploadUrl, s3Key });
    }

    // Public — nurse submits application (no account required)
    [HttpPost("{listingId}")]
    public async Task<IActionResult> Submit(Guid listingId, SubmitApplicationRequest req)
    {
        var listing = await db.Listings
            .Include(l => l.Org)
            .FirstOrDefaultAsync(l => l.Id == listingId && l.Status == ListingStatus.Active);

        if (listing is null) return NotFound();

        var application = new Application
        {
            ListingId = listingId,
            ApplicantName = req.ApplicantName,
            ApplicantEmail = req.ApplicantEmail,
            CoverMessage = req.CoverMessage,
            AvailabilityDate = DateTime.SpecifyKind(req.AvailabilityDate, DateTimeKind.Utc),
            ResumeS3Key = req.ResumeS3Key,
            Licences = req.Licences.Select(l => new Licence
            {
                Province = l.Province,
                LicenceNumber = l.LicenceNumber,
                Expiry = l.Expiry.HasValue ? DateTime.SpecifyKind(l.Expiry.Value, DateTimeKind.Utc) : null
            }).ToList()
        };

        db.Applications.Add(application);

        // PIPEDA-compliant email consent
        if (req.ConsentToAlerts)
        {
            db.NurseEmailConsents.Add(new NurseEmailConsent
            {
                Email = req.ApplicantEmail,
                SourceListingId = listingId,
                ConsentIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty,
            });
        }

        await db.SaveChangesAsync();

        // Notify applicant and the org's account manager
        await emailService.SendApplicationConfirmationAsync(application, listing);

        var accountManager = await db.Users
            .OfType<AccountManager>()
            .FirstOrDefaultAsync(u => u.OrgId == listing.OrgId);

        if (accountManager is not null)
            await emailService.SendNewApplicationNotificationAsync(accountManager, application, listing);

        return Ok(new { application.Id });
    }

    // Org members — view applications
    [HttpGet, Authorize(Roles = "AccountManager,Recruiter")]
    public async Task<IActionResult> GetAll([FromQuery] Guid? listingId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var orgId = Guid.Parse(User.FindFirstValue("org_id")!);

        var query = db.Applications
            .Include(a => a.Listing)
            .Where(a => a.Listing.OrgId == orgId)
            .AsQueryable();

        if (listingId.HasValue)
            query = query.Where(a => a.ListingId == listingId);

        // Recruiters only see assigned applications unless they have ViewAllApplications
        if (User.IsInRole("Recruiter"))
        {
            var recruiter = await db.Users.OfType<Recruiter>().FirstOrDefaultAsync(r => r.Id == userId);
            if (recruiter is null || !recruiter.Permissions.HasFlag(RecruiterPermissions.ViewAllApplications))
                query = query.Where(a => a.AssignedToUserId == userId);
        }

        var applications = await query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id,
                a.ApplicantName,
                a.ApplicantEmail,
                a.Status,
                a.AvailabilityDate,
                a.CreatedAt,
                AssignedTo = a.AssignedTo != null ? a.AssignedTo.Name : null,
                ListingTitleEn = a.Listing.TitleEn, ListingTitleFr = a.Listing.TitleFr,
                a.ListingId
            })
            .ToListAsync();

        return Ok(applications);
    }

    [HttpGet("{id}"), Authorize(Roles = "AccountManager,Recruiter")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var orgId = Guid.Parse(User.FindFirstValue("org_id")!);

        var application = await db.Applications
            .Include(a => a.Listing)
            .Include(a => a.Licences)
            .Include(a => a.Notes).ThenInclude(n => n.WrittenBy)
            .Include(a => a.StatusLogs).ThenInclude(l => l.ChangedBy)
            .Include(a => a.AssignedTo)
            .FirstOrDefaultAsync(a => a.Id == id && a.Listing.OrgId == orgId);

        if (application is null) return NotFound();

        // Recruiters without ViewAllApplications can only see assigned
        if (User.IsInRole("Recruiter") && application.AssignedToUserId != userId)
        {
            var recruiter = await db.Users.OfType<Recruiter>().FirstOrDefaultAsync(r => r.Id == userId);
            if (recruiter is null || !recruiter.Permissions.HasFlag(RecruiterPermissions.ViewAllApplications))
                return Forbid();
        }

        return Ok(application);
    }

    // Org members — get a short-lived download URL for the applicant's resume
    [HttpGet("{id}/resume"), Authorize(Roles = "AccountManager,Recruiter")]
    public async Task<IActionResult> GetResumeUrl(Guid id)
    {
        var orgId = Guid.Parse(User.FindFirstValue("org_id")!);

        var application = await db.Applications
            .Include(a => a.Listing)
            .FirstOrDefaultAsync(a => a.Id == id && a.Listing.OrgId == orgId);

        if (application is null) return NotFound();
        if (string.IsNullOrEmpty(application.ResumeS3Key))
            return NotFound(new { error = "No resume on file" });

        var url = s3.GenerateDownloadUrl(application.ResumeS3Key, TimeSpan.FromMinutes(15));
        return Ok(new { url });
    }

    [HttpPatch("{id}/status"), Authorize(Roles = "AccountManager,Recruiter")]
    public async Task<IActionResult> UpdateStatus(Guid id, UpdateApplicationStatusRequest req)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var orgId = Guid.Parse(User.FindFirstValue("org_id")!);

        var application = await db.Applications
            .Include(a => a.Listing)
            .FirstOrDefaultAsync(a => a.Id == id && a.Listing.OrgId == orgId);

        if (application is null) return NotFound();

        if (User.IsInRole("Recruiter") && application.AssignedToUserId != userId)
        {
            var recruiter = await db.Users.OfType<Recruiter>().FirstOrDefaultAsync(r => r.Id == userId);
            if (recruiter is null || !recruiter.Permissions.HasFlag(RecruiterPermissions.ViewAllApplications))
                return Forbid();
        }

        db.ApplicationStatusLogs.Add(new ApplicationStatusLog
        {
            ApplicationId = application.Id,
            ChangedByUserId = userId,
            FromStatus = application.Status,
            ToStatus = req.Status,
        });

        application.Status = req.Status;
        application.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new { application.Id, application.Status });
    }

    [HttpPost("{id}/assign"), Authorize(Roles = "AccountManager")]
    public async Task<IActionResult> Assign(Guid id, AssignApplicationRequest req)
    {
        var orgId = Guid.Parse(User.FindFirstValue("org_id")!);

        var application = await db.Applications
            .Include(a => a.Listing)
            .FirstOrDefaultAsync(a => a.Id == id && a.Listing.OrgId == orgId);

        if (application is null) return NotFound();

        // Ensure target user belongs to the same org
        var targetUser = await db.Users
            .OfType<OrgUser>()
            .FirstOrDefaultAsync(u => u.Id == req.AssignToUserId && u.OrgId == orgId);

        if (targetUser is null)
            return BadRequest(new { error = "User not found in your organisation" });

        application.AssignedToUserId = req.AssignToUserId;
        application.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new { application.Id, AssignedTo = targetUser.Name });
    }

    [HttpPost("{id}/notes"), Authorize(Roles = "AccountManager,Recruiter")]
    public async Task<IActionResult> AddNote(Guid id, AddNoteRequest req)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var orgId = Guid.Parse(User.FindFirstValue("org_id")!);

        var application = await db.Applications
            .Include(a => a.Listing)
            .FirstOrDefaultAsync(a => a.Id == id && a.Listing.OrgId == orgId);

        if (application is null) return NotFound();

        db.ApplicationNotes.Add(new ApplicationNote
        {
            ApplicationId = id,
            WrittenByUserId = userId,
            Body = req.Body
        });

        await db.SaveChangesAsync();
        return Ok(new { message = "Note added" });
    }
}
