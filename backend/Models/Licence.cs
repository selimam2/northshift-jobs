namespace NorthShift.Api.Models;

public class Licence
{
    public Guid ApplicationId { get; set; }
    public Province Province { get; set; }
    public string? LicenceNumber { get; set; }
    public DateTime? Expiry { get; set; }
}
