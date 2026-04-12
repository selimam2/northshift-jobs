namespace NorthShift.Api.Models;

public enum ApplicationStatus { New, Reviewed, Shortlisted, Hired, Rejected }

public class Application
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ListingId { get; set; }
    public Guid? AssignedToUserId { get; set; }

    public string ApplicantName { get; set; } = string.Empty;
    public string ApplicantEmail { get; set; } = string.Empty;
    public string CoverMessage { get; set; } = string.Empty;
    public string ResumeS3Key { get; set; } = string.Empty;
    public DateTime AvailabilityDate { get; set; }

    public ApplicationStatus Status { get; set; } = ApplicationStatus.New;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Listing Listing { get; set; } = null!;
    public AppUser? AssignedTo { get; set; }
    public ICollection<Licence> Licences { get; set; } = new List<Licence>();
    public ICollection<ApplicationNote> Notes { get; set; } = new List<ApplicationNote>();
    public ICollection<ApplicationStatusLog> StatusLogs { get; set; } = new List<ApplicationStatusLog>();
}
