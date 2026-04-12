using System.ComponentModel.DataAnnotations;

namespace NorthShift.Api.DTOs.Auth;

public class RegisterOrgRequest
{
    [Required]
    public string OrgName { get; set; } = string.Empty;

    [Required]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;

    public string? BillingEmail { get; set; }
    public string? BillingName { get; set; }
}
