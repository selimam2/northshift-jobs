namespace NorthShift.Api.Models;

public enum LanguagePreference { EN, FR }

public class AlertSubscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public Province[] Provinces { get; set; } = Array.Empty<Province>();
    public RoleType[] RoleTypes { get; set; } = Array.Empty<RoleType>();
    public LanguagePreference LanguagePref { get; set; } = LanguagePreference.EN;
    public string UnsubscribeToken { get; set; } = Guid.NewGuid().ToString("N");
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
