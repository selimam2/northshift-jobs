using NorthShift.Api.Models.Interfaces;

namespace NorthShift.Api.Models;

public class AccountManager : OrgUser, ICanPostJobs, ICanManageApplications
{
    public string? BillingEmail { get; set; }
    public string? BillingName { get; set; }

    public ICollection<Listing> Listings { get; set; } = new List<Listing>();
    public ICollection<Application> AssignedApplications { get; set; } = new List<Application>();
}
