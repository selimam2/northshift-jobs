using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.DependencyInjection;
using NorthShift.Api.Services;
using Xunit;

namespace NorthShift.Tests.Services;

public class EncryptionServiceTests
{
    private readonly EncryptionService _service;

    public EncryptionServiceTests()
    {
        var services = new ServiceCollection();
        services.AddDataProtection();
        var sp = services.BuildServiceProvider();
        _service = new EncryptionService(sp.GetRequiredService<IDataProtectionProvider>());
    }

    [Fact]
    public void Encrypt_Decrypt_RoundTrip_ReturnsOriginalPlaintext()
    {
        var plaintext = "ON-RN-1234567";

        var encrypted = _service.Encrypt(plaintext);
        var decrypted = _service.Decrypt(encrypted);

        Assert.Equal(plaintext, decrypted);
    }

    [Fact]
    public void Encrypt_ProducesCiphertextDifferentFromPlaintext()
    {
        var plaintext = "ON-RN-1234567";

        var encrypted = _service.Encrypt(plaintext);

        Assert.NotEqual(plaintext, encrypted);
    }

    [Fact]
    public void Encrypt_SamePlaintext_ProducesDifferentCiphertextEachTime()
    {
        var plaintext = "ON-RN-1234567";

        var first = _service.Encrypt(plaintext);
        var second = _service.Encrypt(plaintext);

        // Data Protection includes a random nonce so output differs
        Assert.NotEqual(first, second);
    }

    [Fact]
    public void Decrypt_CorruptedCiphertext_ReturnsDecryptionError()
    {
        var result = _service.Decrypt("this-is-not-valid-ciphertext");

        Assert.Equal("[decryption error]", result);
    }

    [Fact]
    public void Decrypt_EmptyString_ReturnsDecryptionError()
    {
        var result = _service.Decrypt(string.Empty);

        Assert.Equal("[decryption error]", result);
    }

    [Theory]
    [InlineData("ABC-123")]
    [InlineData("QC-LPN-9876543")]
    [InlineData("BC-RN-0001122")]
    public void Encrypt_Decrypt_WorksForVariousLicenceFormats(string licenceNumber)
    {
        var decrypted = _service.Decrypt(_service.Encrypt(licenceNumber));

        Assert.Equal(licenceNumber, decrypted);
    }
}
