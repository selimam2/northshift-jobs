using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NorthShift.Api.Data;
using NorthShift.Api.Models;
using NorthShift.Api.Services;

namespace NorthShift.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController(AppDbContext db, EmailService emailService) : ControllerBase
{
    [HttpGet("listings/pending")]
    public async Task<IActionResult> GetPendingListings()
    {
        var listings = await db.Listings
            .Include(l => l.Org)
            .Include(l => l.PostedBy)
            .Where(l => l.Status == ListingStatus.PendingApproval)
            .OrderBy(l => l.CreatedAt)
            .Select(l => new
            {
                l.Id,
                l.Slug,
                l.Title,
                l.RoleTypes,
                l.Province,
                l.Community,
                l.CreatedAt,
                OrgName = l.Org.Name,
                PostedBy = l.PostedBy.Name
            })
            .ToListAsync();

        return Ok(listings);
    }

    [HttpPost("listings/{id}/approve")]
    public async Task<IActionResult> ApproveListing(Guid id)
    {
        var listing = await db.Listings
            .Include(l => l.Org)
            .Include(l => l.PostedBy)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (listing is null) return NotFound();
        if (listing.Status != ListingStatus.PendingApproval)
            return BadRequest(new { error = "Listing is not pending approval" });

        listing.Status = ListingStatus.Active;
        await db.SaveChangesAsync();

        if (listing.PostedBy is OrgUser poster)
            await emailService.SendListingConfirmationAsync(poster, listing);

        // Dispatch alerts to matching subscribers
        await SendMatchingAlertsAsync(listing);

        return Ok(new { message = "Listing approved" });
    }

    [HttpPost("listings/{id}/reject")]
    public async Task<IActionResult> RejectListing(Guid id, [FromBody] string reason)
    {
        var listing = await db.Listings.FindAsync(id);
        if (listing is null) return NotFound();

        listing.Status = ListingStatus.Closed;
        await db.SaveChangesAsync();

        return Ok(new { message = "Listing rejected" });
    }

    [HttpGet("orgs")]
    public async Task<IActionResult> GetOrgs()
    {
        var orgs = await db.Organizations
            .Select(o => new
            {
                o.Id,
                o.Name,
                o.Tier,
                o.SubscriptionStatus,
                o.IsAnnual,
                o.CreatedAt,
                UserCount = o.Users.Count,
                ActiveListings = o.Listings.Count(l => l.Status == ListingStatus.Active)
            })
            .ToListAsync();

        return Ok(orgs);
    }

    private async Task SendMatchingAlertsAsync(Listing listing)
    {
        var subscribers = await db.AlertSubscriptions.ToListAsync();

        var matching = subscribers.Where(s =>
            (s.Provinces == null || s.Provinces.Contains(listing.Province)) &&
            (s.RoleTypes == null || s.RoleTypes.Any(r => listing.RoleTypes.Contains(r))) &&
            (s.Languages == null || s.Languages.Contains(listing.Language)) &&
            (s.ContractLengths == null || s.ContractLengths.Contains(listing.ContractLength))
        );

        foreach (var subscriber in matching)
            await emailService.SendAlertEmailAsync(subscriber.Email, listing, subscriber.UnsubscribeToken);
    }
}
