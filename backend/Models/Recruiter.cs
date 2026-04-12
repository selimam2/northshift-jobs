using NorthShift.Api.Models.Interfaces;

namespace NorthShift.Api.Models;

public class Recruiter : OrgUser, ICanPostJobs, ICanManageApplications
{
    public RecruiterPermissions Permissions { get; set; } = RecruiterPermissions.None;

    public ICollection<Listing> Listings { get; set; } = new List<Listing>();
    public ICollection<Application> AssignedApplications { get; set; } = new List<Application>();
}
