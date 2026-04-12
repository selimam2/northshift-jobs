namespace NorthShift.Api.Models;

public class ApplicationNote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ApplicationId { get; set; }
    public Guid WrittenByUserId { get; set; }
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Application Application { get; set; } = null!;
    public OrgUser WrittenBy { get; set; } = null!;
}
