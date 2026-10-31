using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchedulingSystem.Migrations
{
    /// <inheritdoc />
    public partial class AddSchedulePatterns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OffDaysPattern",
                table: "Employees",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WorkDaysPattern",
                table: "Employees",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OffDaysPattern",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "WorkDaysPattern",
                table: "Employees");
        }
    }
}
