using NorthShift.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace NorthShift.Api.DTOs.Auth;

public class InviteRecruiterRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    public RecruiterPermissions Permissions { get; set; } = RecruiterPermissions.None;
}
