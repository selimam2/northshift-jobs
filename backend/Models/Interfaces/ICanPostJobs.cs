namespace NorthShift.Api.Models.Interfaces;

public interface ICanPostJobs
{
    ICollection<Listing> Listings { get; set; }
}
