using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchedulingSystem.Migrations
{
    /// <inheritdoc />
    public partial class MakeShiftAssignmentEmployeeNullableAndConfigureRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ShiftAssignments_Employees_EmployeeId",
                table: "ShiftAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_ShiftAssignments_ShiftTypes_ShiftTypeId",
                table: "ShiftAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_ShiftTypes_Positions_PositionId",
                table: "ShiftTypes");

            migrationBuilder.DropIndex(
                name: "IX_ShiftAssignments_EmployeeId_Date",
                table: "ShiftAssignments");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeAvailabilities_EmployeeId",
                table: "EmployeeAvailabilities");

            migrationBuilder.AlterColumn<int>(
                name: "EmployeeId",
                table: "ShiftAssignments",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftAssignments_EmployeeId_Date",
                table: "ShiftAssignments",
                columns: new[] { "EmployeeId", "Date" },
                unique: true,
                filter: "\"EmployeeId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Positions_Name",
                table: "Positions",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeAvailabilities_EmployeeId_StartDate_EndDate",
                table: "EmployeeAvailabilities",
                columns: new[] { "EmployeeId", "StartDate", "EndDate" });

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftAssignments_Employees_EmployeeId",
                table: "ShiftAssignments",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftAssignments_ShiftTypes_ShiftTypeId",
                table: "ShiftAssignments",
                column: "ShiftTypeId",
                principalTable: "ShiftTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftTypes_Positions_PositionId",
                table: "ShiftTypes",
                column: "PositionId",
                principalTable: "Positions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ShiftAssignments_Employees_EmployeeId",
                table: "ShiftAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_ShiftAssignments_ShiftTypes_ShiftTypeId",
                table: "ShiftAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_ShiftTypes_Positions_PositionId",
                table: "ShiftTypes");

            migrationBuilder.DropIndex(
                name: "IX_ShiftAssignments_EmployeeId_Date",
                table: "ShiftAssignments");

            migrationBuilder.DropIndex(
                name: "IX_Positions_Name",
                table: "Positions");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeAvailabilities_EmployeeId_StartDate_EndDate",
                table: "EmployeeAvailabilities");

            migrationBuilder.AlterColumn<int>(
                name: "EmployeeId",
                table: "ShiftAssignments",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShiftAssignments_EmployeeId_Date",
                table: "ShiftAssignments",
                columns: new[] { "EmployeeId", "Date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeAvailabilities_EmployeeId",
                table: "EmployeeAvailabilities",
                column: "EmployeeId");

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftAssignments_Employees_EmployeeId",
                table: "ShiftAssignments",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftAssignments_ShiftTypes_ShiftTypeId",
                table: "ShiftAssignments",
                column: "ShiftTypeId",
                principalTable: "ShiftTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftTypes_Positions_PositionId",
                table: "ShiftTypes",
                column: "PositionId",
                principalTable: "Positions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
