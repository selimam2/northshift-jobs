using NorthShift.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace NorthShift.Api.DTOs.Listings;

public class CreateListingRequest
{
    public string? TitleEn { get; set; }
    public string? TitleFr { get; set; }

    public string? DescriptionEn { get; set; }
    public string? DescriptionFr { get; set; }

    [Required]
    public ListingLanguage Language { get; set; }

    [Required, MinLength(1)]
    public List<RoleType> RoleTypes { get; set; } = new();

    [Required]
    public Province Province { get; set; }

    [Required]
    public string Community { get; set; } = string.Empty;

    [Required]
    public string ContractLength { get; set; } = string.Empty;

    public DateTime? StartDate { get; set; }
    public decimal? PayMin { get; set; }
    public decimal? PayMax { get; set; }
    public bool HousingProvided { get; set; }
    public bool TravelCovered { get; set; }
}
