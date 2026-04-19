using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NorthShift.Api.Data;
using NorthShift.Api.DTOs.Listings;
using NorthShift.Api.Models;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace NorthShift.Api.Controllers;

[ApiController]
[Route("api/listings")]
public class ListingsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] ListingFilter filter)
    {
        var query = db.Listings
            .Where(l => l.Status == ListingStatus.Active)
            .AsQueryable();

        if (filter.Provinces?.Count > 0)
            query = query.Where(l => filter.Provinces.Contains(l.Province));

        if (filter.RoleTypes?.Count > 0)
            query = query.Where(l => l.RoleTypes.Any(r => filter.RoleTypes.Contains(r)));

        if (filter.Languages?.Count > 0)
            query = query.Where(l => filter.Languages.Contains(l.Language));

        if (filter.ContractLengths?.Count > 0)
            query = query.Where(l => filter.ContractLengths.Contains(l.ContractLength));

        var total = await query.CountAsync();
        var listings = await query
            .OrderByDescending(l => l.Featured)
            .ThenByDescending(l => l.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(l => new
            {
                l.Id,
                l.Slug,
                l.TitleEn,
                l.TitleFr,
                l.RoleTypes,
                l.Province,
                l.Community,
                l.ContractLength,
                l.StartDate,
                l.PayMin,
                l.PayMax,
                l.HousingProvided,
                l.TravelCovered,
                l.Featured,
                l.Language,
                l.CreatedAt,
                OrgName = l.Org.Name
            })
            .ToListAsync();

        return Ok(new { total, page = filter.Page, pageSize = filter.PageSize, listings });
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var listing = await db.Listings
            .Where(l => l.Slug == slug && l.Status == ListingStatus.Active)
            .Select(l => new
            {
                l.Id,
                l.Slug,
                l.TitleEn,
                l.TitleFr,
                l.DescriptionEn,
                l.DescriptionFr,
                l.RoleTypes,
                l.Province,
                l.Community,
                l.ContractLength,
                l.StartDate,
                l.PayMin,
                l.PayMax,
                l.HousingProvided,
                l.TravelCovered,
                l.Featured,
                l.Language,
                l.CreatedAt,
                OrgName = l.Org.Name
            })
            .FirstOrDefaultAsync();

        if (listing is null) return NotFound();
        return Ok(listing);
    }

    [HttpPost, Authorize(Roles = "AccountManager,Recruiter")]
    public async Task<IActionResult> Create(CreateListingRequest req)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var orgId = Guid.Parse(User.FindFirstValue("org_id")!);
        var org = await db.Organizations.FindAsync(orgId);

        if (org!.SubscriptionStatus is not (SubscriptionStatus.Active or SubscriptionStatus.Trialing))
            return StatusCode(402, new { error = "An active subscription is required to post listings." });

        var activeCount = await db.Listings
            .CountAsync(l => l.OrgId == orgId && l.Status == ListingStatus.Active);

        if (activeCount >= org.ListingQuota)
            return BadRequest(new { error = $"Active listing limit reached for your {org.Tier} plan. Upgrade to post more." });

        var validationError = ValidateLanguageContent(req.Language, req.TitleEn, req.TitleFr, req.DescriptionEn, req.DescriptionFr);
        if (validationError is not null) return BadRequest(new { error = validationError });

        var listing = new Listing
        {
            OrgId = orgId,
            PostedByUserId = userId,
            TitleEn = req.TitleEn,
            TitleFr = req.TitleFr,
            DescriptionEn = req.DescriptionEn,
            DescriptionFr = req.DescriptionFr,
            Language = req.Language,
            RoleTypes = req.RoleTypes,
            Province = req.Province,
            Community = req.Community,
            ContractLength = req.ContractLength,
            StartDate = req.StartDate,
            PayMin = req.PayMin,
            PayMax = req.PayMax,
            HousingProvided = req.HousingProvided,
            TravelCovered = req.TravelCovered,
            Status = ListingStatus.PendingApproval,
            Slug = GenerateSlug(req.TitleEn ?? req.TitleFr!, req.Community)
        };

        db.Listings.Add(listing);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBySlug), new { slug = listing.Slug }, new { listing.Id, listing.Slug });
    }

    [HttpPut("{id}"), Authorize(Roles = "AccountManager,Recruiter")]
    public async Task<IActionResult> Update(Guid id, UpdateListingRequest req)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var orgId = Guid.Parse(User.FindFirstValue("org_id")!);

        var listing = await db.Listings.FindAsync(id);
        if (listing is null || listing.OrgId != orgId) return NotFound();

        if (User.IsInRole("Recruiter") && listing.PostedByUserId != userId)
        {
            var recruiter = await db.Users.OfType<Recruiter>().FirstOrDefaultAsync(r => r.Id == userId);
            if (recruiter is null || !recruiter.Permissions.HasFlag(RecruiterPermissions.ManageAllListings))
                return Forbid();
        }

        // Apply field updates first, then validate the resulting state
        if (req.TitleEn is not null) listing.TitleEn = req.TitleEn;
        if (req.TitleFr is not null) listing.TitleFr = req.TitleFr;
        if (req.DescriptionEn is not null) listing.DescriptionEn = req.DescriptionEn;
        if (req.DescriptionFr is not null) listing.DescriptionFr = req.DescriptionFr;
        if (req.Language.HasValue) listing.Language = req.Language.Value;

        var validationError = ValidateLanguageContent(listing.Language, listing.TitleEn, listing.TitleFr, listing.DescriptionEn, listing.DescriptionFr);
        if (validationError is not null) return BadRequest(new { error = validationError });

        if (req.Province.HasValue) listing.Province = req.Province.Value;
        if (req.Community is not null) listing.Community = req.Community;
        if (req.ContractLength is not null) listing.ContractLength = req.ContractLength;
        if (req.StartDate.HasValue) listing.StartDate = req.StartDate;
        if (req.PayMin.HasValue) listing.PayMin = req.PayMin;
        if (req.PayMax.HasValue) listing.PayMax = req.PayMax;
        if (req.HousingProvided.HasValue) listing.HousingProvided = req.HousingProvided.Value;
        if (req.TravelCovered.HasValue) listing.TravelCovered = req.TravelCovered.Value;

        await db.SaveChangesAsync();
        return Ok(listing);
    }

    [HttpDelete("{id}"), Authorize(Roles = "AccountManager,Recruiter")]
    public async Task<IActionResult> Close(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var orgId = Guid.Parse(User.FindFirstValue("org_id")!);

        var listing = await db.Listings.FindAsync(id);
        if (listing is null || listing.OrgId != orgId) return NotFound();

        if (User.IsInRole("Recruiter") && listing.PostedByUserId != userId)
        {
            var recruiter = await db.Users.OfType<Recruiter>().FirstOrDefaultAsync(r => r.Id == userId);
            if (recruiter is null || !recruiter.Permissions.HasFlag(RecruiterPermissions.ManageAllListings))
                return Forbid();
        }

        listing.Status = ListingStatus.Closed;
        await db.SaveChangesAsync();
        return NoContent();
    }

    internal static string? ValidateLanguageContent(
        ListingLanguage language, string? titleEn, string? titleFr, string? descEn, string? descFr) =>
        language switch
        {
            ListingLanguage.English when string.IsNullOrWhiteSpace(titleEn) || string.IsNullOrWhiteSpace(descEn)
                => "English title and description are required for English listings.",
            ListingLanguage.French when string.IsNullOrWhiteSpace(titleFr) || string.IsNullOrWhiteSpace(descFr)
                => "French title and description are required for French listings.",
            ListingLanguage.Bilingual when (string.IsNullOrWhiteSpace(titleEn) || string.IsNullOrWhiteSpace(descEn)
                                        || string.IsNullOrWhiteSpace(titleFr) || string.IsNullOrWhiteSpace(descFr))
                => "Both English and French title and description are required for Bilingual listings.",
            _ => null
        };

    internal static string GenerateSlug(string title, string community)
    {
        var raw = $"{title}-{community}-{Guid.NewGuid().ToString("N")[..6]}".ToLowerInvariant();
        return Regex.Replace(raw, @"[^a-z0-9\-]", "-").Trim('-');
    }
}
