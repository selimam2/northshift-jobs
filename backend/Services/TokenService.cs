using Microsoft.IdentityModel.Tokens;
using NorthShift.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace NorthShift.Api.Services;

public class TokenService(IConfiguration config)
{
    public string GenerateToken(Employer employer, bool isAdmin = false)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddHours(int.Parse(config["Jwt:ExpiryHours"] ?? "24"));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, employer.Id.ToString()),
            new Claim(ClaimTypes.Email, employer.Email),
            new Claim("organization", employer.Organization),
            new Claim(ClaimTypes.Role, isAdmin ? "Admin" : "Employer")
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: expiry,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
