namespace NorthShift.Api.Models;

public abstract class OrgUser : AppUser
{
    public Guid OrgId { get; set; }
    public bool IsActive { get; set; } = true;
    public string? InviteToken { get; set; }

    public Organization Org { get; set; } = null!;
}
