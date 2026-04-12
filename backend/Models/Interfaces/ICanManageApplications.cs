namespace NorthShift.Api.Models.Interfaces;

public interface ICanManageApplications
{
    ICollection<Application> AssignedApplications { get; set; }
}
