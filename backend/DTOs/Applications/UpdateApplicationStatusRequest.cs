using NorthShift.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace NorthShift.Api.DTOs.Applications;

public class UpdateApplicationStatusRequest
{
    [Required]
    public ApplicationStatus Status { get; set; }
}
