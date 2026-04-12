using NorthShift.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace NorthShift.Api.DTOs.Applications;

public class SubmitApplicationRequest
{
    [Required]
    public string ApplicantName { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string ApplicantEmail { get; set; } = string.Empty;

    [Required]
    public string CoverMessage { get; set; } = string.Empty;

    [Required]
    public DateTime AvailabilityDate { get; set; }

    [Required, MinLength(1)]
    public List<LicenceRequest> Licences { get; set; } = new();

    public bool ConsentToAlerts { get; set; }
}

public class LicenceRequest
{
    [Required]
    public Province Province { get; set; }

    public string? LicenceNumber { get; set; }
    public DateTime? Expiry { get; set; }
}
