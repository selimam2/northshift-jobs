using System.ComponentModel.DataAnnotations;

namespace NorthShift.Api.DTOs.Applications;

public class AssignApplicationRequest
{
    [Required]
    public Guid AssignToUserId { get; set; }
}
