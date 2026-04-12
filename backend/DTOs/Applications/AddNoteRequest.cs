using System.ComponentModel.DataAnnotations;

namespace NorthShift.Api.DTOs.Applications;

public class AddNoteRequest
{
    [Required]
    public string Body { get; set; } = string.Empty;
}
