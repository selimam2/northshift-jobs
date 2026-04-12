namespace NorthShift.Api.Models;

public class ApplicationStatusLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ApplicationId { get; set; }
    public Guid ChangedByUserId { get; set; }
    public ApplicationStatus FromStatus { get; set; }
    public ApplicationStatus ToStatus { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    public Application Application { get; set; } = null!;
    public AppUser ChangedBy { get; set; } = null!;
}
