using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NorthShift.Api.Data;
using NorthShift.Api.DTOs.Team;
using NorthShift.Api.Models;
using System.Security.Claims;

namespace NorthShift.Api.Controllers;

[ApiController]
[Route("api/team")]
[Authorize(Roles = "AccountManager")]
public class TeamController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetTeam()
    {
        var orgId = Guid.Parse(User.FindFirstValue("org_id")!);
        var org = await db.Organizations.FindAsync(orgId);

        var members = await db.Users
            .OfType<Recruiter>()
            .Where(r => r.OrgId == orgId)
            .OrderBy(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.Name,
                r.Email,
                Permissions = (int)r.Permissions,
                r.IsActive,
                r.CreatedAt,
                PendingInvite = r.InviteToken != null,
            })
            .ToListAsync();

        return Ok(new
        {
            members,
            quota = org!.RecruiterQuota == int.MaxValue ? (int?)null : org.RecruiterQuota,
            activeCount = members.Count(m => m.IsActive),
        });
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdatePermissions(Guid id, [FromBody] UpdatePermissionsRequest req)
    {
        var orgId = Guid.Parse(User.FindFirstValue("org_id")!);
        var recruiter = await db.Users
            .OfType<Recruiter>()
            .FirstOrDefaultAsync(r => r.Id == id && r.OrgId == orgId);

        if (recruiter is null) return NotFound();

        recruiter.Permissions = (RecruiterPermissions)req.Permissions;
        await db.SaveChangesAsync();
        return Ok(new { message = "Permissions updated" });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> RemoveMember(Guid id)
    {
        var orgId = Guid.Parse(User.FindFirstValue("org_id")!);
        var recruiter = await db.Users
            .OfType<Recruiter>()
            .FirstOrDefaultAsync(r => r.Id == id && r.OrgId == orgId);

        if (recruiter is null) return NotFound();

        db.Users.Remove(recruiter);
        await db.SaveChangesAsync();
        return Ok(new { message = "Member removed" });
    }
}
