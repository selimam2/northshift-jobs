using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NorthShift.Api.Data;
using NorthShift.Api.DTOs.Auth;
using NorthShift.Api.Models;
using NorthShift.Api.Services;
using System.Security.Claims;

namespace NorthShift.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, TokenService tokenService, EmailService emailService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterOrgRequest req)
    {
        if (await db.Users.AnyAsync(u => u.Email == req.Email))
            return Conflict(new { error = "Email already registered" });

        var org = new Organization { Name = req.OrgName };
        db.Organizations.Add(org);

        var manager = new AccountManager
        {
            OrgId = org.Id,
            Name = req.Name,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            BillingEmail = req.BillingEmail,
            BillingName = req.BillingName
        };
        db.Users.Add(manager);
        await db.SaveChangesAsync();

        return Ok(BuildAuthResponse(manager, tokenService));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { error = "Invalid credentials" });

        if (user is OrgUser orgUser && !orgUser.IsActive)
            return Unauthorized(new { error = "Account is inactive" });

        user.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(BuildAuthResponse(user, tokenService));
    }

    [HttpPost("invite"), Authorize(Roles = "AccountManager")]
    public async Task<IActionResult> InviteRecruiter(InviteRecruiterRequest req)
    {
        var orgId = Guid.Parse(User.FindFirstValue("org_id")!);
        var org = await db.Organizations.FindAsync(orgId);

        if (org!.SubscriptionStatus is not (SubscriptionStatus.Active or SubscriptionStatus.Trialing))
            return StatusCode(402, new { error = "An active subscription is required to invite team members." });

        var recruiterCount = await db.Users
            .OfType<Recruiter>()
            .CountAsync(r => r.OrgId == orgId && r.IsActive);

        if (recruiterCount >= org.RecruiterQuota)
            return BadRequest(new { error = $"Recruiter limit reached for your {org.Tier} plan. Upgrade to add more." });

        if (await db.Users.AnyAsync(u => u.Email == req.Email))
            return Conflict(new { error = "Email already registered" });

        var recruiter = new Recruiter
        {
            OrgId = orgId,
            Name = req.Name,
            Email = req.Email,
            PasswordHash = string.Empty,
            Permissions = req.Permissions,
            IsActive = false,
            InviteToken = Guid.NewGuid().ToString("N")
        };
        db.Users.Add(recruiter);
        await db.SaveChangesAsync();

        await emailService.SendInviteEmailAsync(recruiter, org);
        return Ok(new { message = "Invite sent" });
    }

    [HttpPost("accept-invite")]
    public async Task<IActionResult> AcceptInvite(AcceptInviteRequest req)
    {
        var recruiter = await db.Users
            .OfType<Recruiter>()
            .FirstOrDefaultAsync(r => r.InviteToken == req.InviteToken);

        if (recruiter is null)
            return NotFound(new { error = "Invalid or expired invite token" });

        recruiter.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);
        recruiter.IsActive = true;
        recruiter.InviteToken = null;
        await db.SaveChangesAsync();

        return Ok(BuildAuthResponse(recruiter, tokenService));
    }

    private static AuthResponse BuildAuthResponse(AppUser user, TokenService tokenService)
    {
        return new AuthResponse
        {
            Token = tokenService.GenerateToken(user),
            Role = user.GetType().Name,
            Name = user.Name,
            Email = user.Email,
            OrgId = user is OrgUser o ? o.OrgId : null
        };
    }
}
