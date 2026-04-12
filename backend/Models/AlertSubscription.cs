namespace NorthShift.Api.Models;

public enum LanguagePreference { EN, FR }

public class AlertSubscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;

    // Mirrors ListingFilter — null means no filter on that dimension
    public List<Province>? Provinces { get; set; }
    public List<RoleType>? RoleTypes { get; set; }
    public List<ListingLanguage>? Languages { get; set; }
    public List<string>? ContractLengths { get; set; }

    // Language the alert email itself is sent in
    public LanguagePreference LanguagePref { get; set; } = LanguagePreference.EN;

    public string UnsubscribeToken { get; set; } = Guid.NewGuid().ToString("N");
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
