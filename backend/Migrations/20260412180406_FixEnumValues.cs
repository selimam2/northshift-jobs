using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NorthShift.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixEnumValues : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ListingLanguage: EN→English, FR→French, Both→Bilingual
            migrationBuilder.Sql("""
                UPDATE "Listings"
                SET "Language" = CASE "Language"
                    WHEN 'EN'   THEN 'English'
                    WHEN 'FR'   THEN 'French'
                    WHEN 'Both' THEN 'Bilingual'
                    ELSE "Language"
                END
                WHERE "Language" IN ('EN','FR','Both');
                """);

            // LanguagePreference on AlertSubscriptions: EN→English, FR→French
            migrationBuilder.Sql("""
                UPDATE "AlertSubscriptions"
                SET "LanguagePref" = CASE "LanguagePref"
                    WHEN 'EN' THEN 'English'
                    WHEN 'FR' THEN 'French'
                    ELSE "LanguagePref"
                END
                WHERE "LanguagePref" IN ('EN','FR');
                """);

            // Languages filter column (comma-separated): replace each value in-place
            migrationBuilder.Sql("""
                UPDATE "AlertSubscriptions"
                SET "Languages" = replace(replace(replace("Languages", 'Both', 'Bilingual'), 'EN', 'English'), 'FR', 'French')
                WHERE "Languages" IS NOT NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "Listings"
                SET "Language" = CASE "Language"
                    WHEN 'English'  THEN 'EN'
                    WHEN 'French'   THEN 'FR'
                    WHEN 'Bilingual' THEN 'Both'
                    ELSE "Language"
                END
                WHERE "Language" IN ('English','French','Bilingual');
                """);

            migrationBuilder.Sql("""
                UPDATE "AlertSubscriptions"
                SET "LanguagePref" = CASE "LanguagePref"
                    WHEN 'English' THEN 'EN'
                    WHEN 'French'  THEN 'FR'
                    ELSE "LanguagePref"
                END
                WHERE "LanguagePref" IN ('English','French');
                """);

            migrationBuilder.Sql("""
                UPDATE "AlertSubscriptions"
                SET "Languages" = replace(replace(replace("Languages", 'Bilingual', 'Both'), 'English', 'EN'), 'French', 'FR')
                WHERE "Languages" IS NOT NULL;
                """);
        }
    }
}
