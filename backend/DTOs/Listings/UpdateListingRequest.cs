using NorthShift.Api.Models;

namespace NorthShift.Api.DTOs.Listings;

public class UpdateListingRequest
{
    public string? Title { get; set; }
    public string? TitleFr { get; set; }
    public string? Description { get; set; }
    public string? DescriptionFr { get; set; }
    public ListingLanguage? Language { get; set; }
    public RoleType? RoleType { get; set; }
    public Province? Province { get; set; }
    public string? Community { get; set; }
    public string? ContractLength { get; set; }
    public DateTime? StartDate { get; set; }
    public decimal? PayMin { get; set; }
    public decimal? PayMax { get; set; }
    public bool? HousingProvided { get; set; }
    public bool? TravelCovered { get; set; }
}
