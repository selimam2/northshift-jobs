using System.ComponentModel.DataAnnotations;

namespace NorthShift.Api.DTOs.Auth;

public class AcceptInviteRequest
{
    [Required]
    public string InviteToken { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;
}
