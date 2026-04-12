using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NorthShift.Api.Data;
using NorthShift.Api.DTOs.Alerts;
using NorthShift.Api.Models;

namespace NorthShift.Api.Controllers;

[ApiController]
[Route("api/alerts")]
public class AlertsController(AppDbContext db) : ControllerBase
{
    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe(SubscribeRequest req)
    {
        if (await db.AlertSubscriptions.AnyAsync(a => a.Email == req.Email))
            return Conflict(new { error = "This email is already subscribed" });

        var subscription = new AlertSubscription
        {
            Email = req.Email,
            Provinces = req.Preferences.Provinces,
            RoleTypes = req.Preferences.RoleTypes,
            Languages = req.Preferences.Languages,
            ContractLengths = req.Preferences.ContractLengths,
            LanguagePref = req.LanguagePref
        };

        db.AlertSubscriptions.Add(subscription);
        await db.SaveChangesAsync();

        return Ok(new { message = "Subscribed successfully" });
    }

    [HttpDelete("unsubscribe")]
    public async Task<IActionResult> Unsubscribe([FromQuery] string token)
    {
        var subscription = await db.AlertSubscriptions
            .FirstOrDefaultAsync(a => a.UnsubscribeToken == token);

        if (subscription is null) return NotFound();

        db.AlertSubscriptions.Remove(subscription);
        await db.SaveChangesAsync();

        return Ok(new { message = "Unsubscribed successfully" });
    }
}
