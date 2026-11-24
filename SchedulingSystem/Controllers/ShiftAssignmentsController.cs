using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchedulingSystem.Data;
using SchedulingSystem.Entities;
using SchedulingSystem.DTOs;
using SchedulingSystem.Services;

namespace SchedulingSystem.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ShiftAssignmentsController(
    ApplicationDbContext context,
    IScheduleGeneratorService generatorService,
    IScheduleValidationService validationService)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShiftAssignmentDto>>> GetSchedule()
    {
        var schedule = await context.ShiftAssignments
            .Include(sa => sa.Employee)
            .Include(sa => sa.ShiftType)
            .Select(sa => new ShiftAssignmentDto
            {
                Id = sa.Id,
                Date = sa.Date,
                EmployeeId = sa.EmployeeId,
                EmployeeFullName = sa.Employee != null
                    ? sa.Employee.LastName + " " + sa.Employee.FirstName
                    : "Непризначено",
                ShiftTypeId = sa.ShiftTypeId,
                ShiftTypeName = sa.ShiftType!.Name,
                ShiftTypeShortCode = sa.ShiftType.ShortCode,
                Status = sa.Status
            })
            .ToListAsync();

        return Ok(schedule);
    }

    [HttpGet("Validate")]
    public async Task<ActionResult<ScheduleAuditReportDto>> ValidateSchedule(
        [FromQuery] DateOnly startDate,
        [FromQuery] DateOnly endDate,
        [FromQuery] int? positionId)
    {
        if (startDate > endDate)
            return BadRequest("Початкова дата не може бути пізнішою за кінцеву.");

        var report = await validationService.AuditScheduleAsync(startDate, endDate, positionId);
        return Ok(report);
    }

    [HttpPost("Assign")]
    public async Task<ActionResult> AssignShift(CreateShiftAssignmentDto dto)
    {
        var shiftType = await context.ShiftTypes.FindAsync(dto.ShiftTypeId);
        if (shiftType == null)
            return BadRequest("Тип зміни не знайдено.");

        string? warning = null;

        if (dto.EmployeeId.HasValue)
        {
            var employeeExists = await context.Employees.AnyAsync(e => e.Id == dto.EmployeeId.Value);
            if (!employeeExists)
                return BadRequest("Працівника не знайдено.");

            var violations = await validationService.ValidateSingleAssignmentAsync(
                dto.EmployeeId.Value,
                dto.Date,
                dto.ShiftTypeId);

            if (violations.Any(v => v.Code == "DOUBLE_BOOKING"))
                return BadRequest("Працівник вже має призначену зміну на цю дату.");

            if (violations.Count > 0)
            {
                warning = "Зміну збережено з попередженням: " + string.Join(" ", violations.Select(v => v.Message));
            }
        }

        var assignment = new ShiftAssignment
        {
            Date = dto.Date,
            EmployeeId = dto.EmployeeId,
            ShiftTypeId = dto.ShiftTypeId,
            Status = dto.EmployeeId.HasValue ? "Manual" : "Unassigned"
        };

        context.ShiftAssignments.Add(assignment);
        await context.SaveChangesAsync();

        return Ok(new { Warning = warning });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateAssignment(int id, UpdateShiftAssignmentDto dto)
    {
        var assignment = await context.ShiftAssignments.FindAsync(id);
        if (assignment == null) return NotFound("Призначення не знайдено.");

        var shiftType = await context.ShiftTypes.FindAsync(dto.ShiftTypeId);
        if (shiftType == null)
            return BadRequest("Тип зміни не знайдено.");

        string? warning = null;

        if (dto.EmployeeId.HasValue)
        {
            var employeeExists = await context.Employees.AnyAsync(e => e.Id == dto.EmployeeId.Value);
            if (!employeeExists)
                return BadRequest("Працівника не знайдено.");

            var violations = await validationService.ValidateSingleAssignmentAsync(
                dto.EmployeeId.Value,
                dto.Date,
                dto.ShiftTypeId,
                excludeAssignmentId: id);

            if (violations.Any(v => v.Code == "DOUBLE_BOOKING"))
                return BadRequest("Працівник вже має іншу зміну на цю дату.");

            if (violations.Count > 0)
            {
                warning = "Зміну оновлено з попередженням: " + string.Join(" ", violations.Select(v => v.Message));
            }
        }

        assignment.Date = dto.Date;
        assignment.EmployeeId = dto.EmployeeId;
        assignment.ShiftTypeId = dto.ShiftTypeId;
        assignment.Status = dto.EmployeeId.HasValue ? "Manual" : "Unassigned";

        await context.SaveChangesAsync();
        return Ok(new { Warning = warning });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAssignment(int id)
    {
        var assignment = await context.ShiftAssignments.FindAsync(id);
        if (assignment == null) return NotFound("Призначення не знайдено.");

        context.ShiftAssignments.Remove(assignment);
        await context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("Range")]
    public async Task<IActionResult> DeleteShiftsInRange(
        [FromQuery] DateOnly startDate,
        [FromQuery] DateOnly endDate,
        [FromQuery] int? positionId)
    {
        if (startDate > endDate)
            return BadRequest("Початкова дата не може бути пізнішою за кінцеву.");

        var query = context.ShiftAssignments
            .Include(sa => sa.ShiftType)
            .Where(sa => sa.Date >= startDate && sa.Date <= endDate);

        if (positionId.HasValue)
        {
            query = query.Where(sa => sa.ShiftType != null && sa.ShiftType.PositionId == positionId.Value);
        }

        var shiftsToDelete = await query.ToListAsync();

        if (shiftsToDelete.Count == 0)
            return Ok(new { Message = "Змін за вказаний період не знайдено." });

        context.ShiftAssignments.RemoveRange(shiftsToDelete);
        await context.SaveChangesAsync();

        return Ok(new { Message = $"Видалено {shiftsToDelete.Count} змін." });
    }

    [HttpPost("Generate")]
    public async Task<ActionResult> GenerateSchedule(GenerateScheduleRequestDto request)
    {
        if (request.StartDate > request.EndDate)
            return BadRequest("Початкова дата не може бути пізнішою за кінцеву.");

        int generatedCount = await generatorService.GenerateScheduleAsync(
            request.StartDate,
            request.EndDate,
            request.PositionId);

        string scopeLabel = string.Empty;
        if (request.PositionId.HasValue)
        {
            var positionName = await context.Positions
                .Where(p => p.Id == request.PositionId.Value)
                .Select(p => p.Name)
                .FirstOrDefaultAsync();

            if (!string.IsNullOrWhiteSpace(positionName))
            {
                scopeLabel = $" ({positionName})";
            }
        }

        return Ok(new { Message = $"Генерація завершена{scopeLabel}. Призначено {generatedCount} нових змін." });
    }
}