namespace NorthShift.Api.Models;

[Flags]
public enum RecruiterPermissions
{
    None                = 0,
    ViewAllApplications = 1 << 0,
    AssignApplications  = 1 << 1,
    ExportApplications  = 1 << 2,
    ManageAllListings   = 1 << 3,
}
