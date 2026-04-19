using NorthShift.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace NorthShift.Api.DTOs.Applications;

public class SubmitApplicationRequest
{
    [Required]
    public string ApplicantName { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string ApplicantEmail { get; set; } = string.Empty;

    public string? CoverMessage { get; set; }

    [Required]
    public DateTime AvailabilityDate { get; set; }

    [Required, MinLength(1)]
    public List<LicenceRequest> Licences { get; set; } = new();

    public bool ConsentToAlerts { get; set; }

    /// <summary>S3 key returned by the presigned-upload endpoint after the file is uploaded.</summary>
    [Required]
    public string ResumeS3Key { get; set; } = string.Empty;
}

public class LicenceRequest
{
    [Required]
    public Province Province { get; set; }

    public string? LicenceNumber { get; set; }
    public DateTime? Expiry { get; set; }
}
