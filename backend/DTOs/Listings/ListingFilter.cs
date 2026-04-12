using NorthShift.Api.Models;

namespace NorthShift.Api.DTOs.Listings;

public class ListingFilter
{
    // null = no filter applied (all match)
    // multiple values = OR within the list
    // across filters = AND
    public List<Province>? Provinces { get; set; }
    public List<RoleType>? RoleTypes { get; set; }
    public List<ListingLanguage>? Languages { get; set; }
    public List<string>? ContractLengths { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
