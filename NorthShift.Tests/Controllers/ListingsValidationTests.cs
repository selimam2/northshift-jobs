using NorthShift.Api.Controllers;
using NorthShift.Api.Models;
using Xunit;

namespace NorthShift.Tests.Controllers;

public class ListingsValidationTests
{
    // ── ValidateLanguageContent ───────────────────────────────────────────────

    [Fact]
    public void ValidateLanguageContent_English_WithEnglishContent_ReturnsNull()
    {
        var error = ListingsController.ValidateLanguageContent(
            ListingLanguage.English, "RN Position", null, "We are hiring RNs.", null);

        Assert.Null(error);
    }

    [Fact]
    public void ValidateLanguageContent_English_MissingTitleEn_ReturnsError()
    {
        var error = ListingsController.ValidateLanguageContent(
            ListingLanguage.English, null, "Titre FR", "Desc EN", null);

        Assert.NotNull(error);
        Assert.Contains("English", error);
    }

    [Fact]
    public void ValidateLanguageContent_English_MissingDescriptionEn_ReturnsError()
    {
        var error = ListingsController.ValidateLanguageContent(
            ListingLanguage.English, "RN Position", null, null, null);

        Assert.NotNull(error);
        Assert.Contains("English", error);
    }

    [Fact]
    public void ValidateLanguageContent_English_WhitespaceOnlyTitle_ReturnsError()
    {
        var error = ListingsController.ValidateLanguageContent(
            ListingLanguage.English, "   ", null, "Desc EN", null);

        Assert.NotNull(error);
    }

    [Fact]
    public void ValidateLanguageContent_French_WithFrenchContent_ReturnsNull()
    {
        var error = ListingsController.ValidateLanguageContent(
            ListingLanguage.French, null, "Poste infirmier", null, "Nous embauchons des infirmiers.");

        Assert.Null(error);
    }

    [Fact]
    public void ValidateLanguageContent_French_MissingTitleFr_ReturnsError()
    {
        var error = ListingsController.ValidateLanguageContent(
            ListingLanguage.French, "EN title", null, null, "Desc FR");

        Assert.NotNull(error);
        Assert.Contains("French", error);
    }

    [Fact]
    public void ValidateLanguageContent_French_MissingDescriptionFr_ReturnsError()
    {
        var error = ListingsController.ValidateLanguageContent(
            ListingLanguage.French, null, "Titre FR", null, null);

        Assert.NotNull(error);
        Assert.Contains("French", error);
    }

    [Fact]
    public void ValidateLanguageContent_Bilingual_WithAllContent_ReturnsNull()
    {
        var error = ListingsController.ValidateLanguageContent(
            ListingLanguage.Bilingual, "RN Position", "Poste infirmier", "We are hiring.", "Nous embauchons.");

        Assert.Null(error);
    }

    [Theory]
    [InlineData(null, "Titre FR", "Desc EN", "Desc FR")]  // missing TitleEn
    [InlineData("Title EN", null, "Desc EN", "Desc FR")]  // missing TitleFr
    [InlineData("Title EN", "Titre FR", null, "Desc FR")] // missing DescEn
    [InlineData("Title EN", "Titre FR", "Desc EN", null)] // missing DescFr
    public void ValidateLanguageContent_Bilingual_MissingAnyField_ReturnsError(
        string? titleEn, string? titleFr, string? descEn, string? descFr)
    {
        var error = ListingsController.ValidateLanguageContent(
            ListingLanguage.Bilingual, titleEn, titleFr, descEn, descFr);

        Assert.NotNull(error);
        Assert.Contains("Bilingual", error);
    }

    // ── GenerateSlug ──────────────────────────────────────────────────────────

    [Fact]
    public void GenerateSlug_IsLowercase()
    {
        var slug = ListingsController.GenerateSlug("Senior RN Position", "Thompson");

        Assert.Equal(slug.ToLowerInvariant(), slug);
    }

    [Fact]
    public void GenerateSlug_ContainsCommunitySegment()
    {
        var slug = ListingsController.GenerateSlug("RN Needed", "Yellowknife");

        Assert.Contains("yellowknife", slug);
    }

    [Fact]
    public void GenerateSlug_ContainsTitleSegment()
    {
        var slug = ListingsController.GenerateSlug("Senior RN", "Timmins");

        Assert.Contains("senior", slug);
        Assert.Contains("rn", slug);
    }

    [Fact]
    public void GenerateSlug_NonAlphanumericCharactersReplacedWithDash()
    {
        var slug = ListingsController.GenerateSlug("RN (Specialty Care)", "Timmins, ON");

        Assert.Matches("^[a-z0-9-]+$", slug);
    }

    [Fact]
    public void GenerateSlug_EndsWithSixCharSuffix()
    {
        // Suffix is Guid.NewGuid().ToString("N")[..6] — 6 lowercase hex chars
        var slug = ListingsController.GenerateSlug("RN", "Thompson");
        var segments = slug.Split('-');

        // Last segment is the 6-char hex suffix
        Assert.Matches("^[a-f0-9]{6}$", segments[^1]);
    }

    [Fact]
    public void GenerateSlug_TwoCallsForSameInput_ProduceDifferentSlugs()
    {
        var slug1 = ListingsController.GenerateSlug("RN Position", "Thompson");
        var slug2 = ListingsController.GenerateSlug("RN Position", "Thompson");

        Assert.NotEqual(slug1, slug2);
    }
}
