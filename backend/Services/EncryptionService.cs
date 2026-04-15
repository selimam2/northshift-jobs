using Microsoft.AspNetCore.DataProtection;

namespace NorthShift.Api.Services;

public class EncryptionService
{
    private readonly IDataProtector _protector;

    public EncryptionService(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("NorthShift.LicenceNumbers");
    }

    public string Encrypt(string plaintext) => _protector.Protect(plaintext);

    public string Decrypt(string ciphertext)
    {
        try { return _protector.Unprotect(ciphertext); }
        catch { return "[decryption error]"; }
    }
}
