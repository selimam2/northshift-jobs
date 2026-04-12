using NorthShift.Api.DTOs.Listings;
using NorthShift.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace NorthShift.Api.DTOs.Alerts;

public class SubscribeRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    // Null fields in Preferences mean "match all" for that dimension
    [Required]
    public ListingFilter Preferences { get; set; } = new();

    // Language the alert email is sent in
    public LanguagePreference LanguagePref { get; set; } = LanguagePreference.English;
}
