using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NorthShift.Api.Migrations
{
    /// <inheritdoc />
    public partial class BilingualListings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add new columns first
            migrationBuilder.AddColumn<string>(
                name: "TitleEn",
                table: "Listings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionEn",
                table: "Listings",
                type: "text",
                nullable: true);

            // Copy existing English content into the new columns
            migrationBuilder.Sql("""
                UPDATE "Listings" SET "TitleEn" = "Title", "DescriptionEn" = "Description";
                """);

            // Now safe to drop the old columns
            migrationBuilder.DropColumn(
                name: "Title",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Listings");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Listings_LanguageContentMatch",
                table: "Listings",
                sql: "(\"Language\" = 'English'   AND \"TitleEn\" IS NOT NULL AND \"DescriptionEn\" IS NOT NULL)\nOR (\"Language\" = 'French'    AND \"TitleFr\" IS NOT NULL AND \"DescriptionFr\" IS NOT NULL)\nOR (\"Language\" = 'Bilingual' AND \"TitleEn\" IS NOT NULL AND \"DescriptionEn\" IS NOT NULL\n                             AND \"TitleFr\" IS NOT NULL AND \"DescriptionFr\" IS NOT NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Listings_LanguageContentMatch",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "DescriptionEn",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "TitleEn",
                table: "Listings");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Listings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "Listings",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
