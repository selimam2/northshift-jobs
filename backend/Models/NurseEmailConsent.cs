namespace NorthShift.Api.Models;

public class NurseEmailConsent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public Guid SourceListingId { get; set; }
    public string ConsentIp { get; set; } = string.Empty;
    public DateTime ConsentedAt { get; set; } = DateTime.UtcNow;
    public string UnsubscribeToken { get; set; } = Guid.NewGuid().ToString("N");
}
