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
    IScheduleGeneratorService generatorService)
    : ControllerBase
{
    private static double CalculateShiftDurationHours(TimeSpan start, TimeSpan end)
    {
        return end >= start
            ? (end - start).TotalHours
            : (TimeSpan.FromHours(24) - start + end).TotalHours;
    }

    private async Task<string?> CheckWeeklyOvertimeWarningAsync(int employeeId, DateOnly date, ShiftType targetShift, int? excludeAssignmentId = null)
    {
        var employee = await context.Employees.FindAsync(employeeId);
        if (employee == null) return null;

        int diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        var weekStart = date.AddDays(-diff);
        var weekEnd = weekStart.AddDays(6);

        var weekShifts = await context.ShiftAssignments
            .Include(sa => sa.ShiftType)
            .Where(sa => sa.EmployeeId == employeeId
                         && sa.Date >= weekStart
                         && sa.Date <= weekEnd
                         && (!excludeAssignmentId.HasValue || sa.Id != excludeAssignmentId.Value))
            .ToListAsync();

        double existingHours = weekShifts
            .Where(sa => sa.ShiftType != null)
            .Sum(sa => CalculateShiftDurationHours(sa.ShiftType!.StartTime, sa.ShiftType.EndTime));

        double newTotal = Math.Round(existingHours + CalculateShiftDurationHours(targetShift.StartTime, targetShift.EndTime), 1);

        if (newTotal > employee.MaxHoursPerWeek)
        {
            return $"Зміну збережено, але перевищено норму годин за тиждень ({newTotal} / {employee.MaxHoursPerWeek} год).";
        }

        return null;
    }

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

    [HttpPost("Assign")]
    public async Task<ActionResult> AssignShift(CreateShiftAssignmentDto dto)
    {
        var employeeExists = await context.Employees.AnyAsync(e => e.Id == dto.EmployeeId);
        var shiftType = await context.ShiftTypes.FindAsync(dto.ShiftTypeId);

        if (!employeeExists || shiftType == null)
            return BadRequest("Працівник або тип зміни не знайдені.");

        var existingAssignment = await context.ShiftAssignments
            .FirstOrDefaultAsync(sa => sa.EmployeeId == dto.EmployeeId && sa.Date == dto.Date);

        if (existingAssignment != null)
            return BadRequest("Працівник вже має призначену зміну на цю дату.");

        var warning = await CheckWeeklyOvertimeWarningAsync(dto.EmployeeId, dto.Date, shiftType);

        var assignment = new ShiftAssignment
        {
            Date = dto.Date,
            EmployeeId = dto.EmployeeId,
            ShiftTypeId = dto.ShiftTypeId,
            Status = "Manual"
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

        var employeeExists = await context.Employees.AnyAsync(e => e.Id == dto.EmployeeId);
        var shiftType = await context.ShiftTypes.FindAsync(dto.ShiftTypeId);

        if (!employeeExists || shiftType == null)
            return BadRequest("Працівник або тип зміни не знайдені.");

        var conflict = await context.ShiftAssignments
            .AnyAsync(sa => sa.Id != id && sa.EmployeeId == dto.EmployeeId && sa.Date == dto.Date);

        if (conflict)
            return BadRequest("Працівник вже має іншу зміну на цю дату.");

        var warning = await CheckWeeklyOvertimeWarningAsync(dto.EmployeeId, dto.Date, shiftType, id);

        assignment.Date = dto.Date;
        assignment.EmployeeId = dto.EmployeeId;
        assignment.ShiftTypeId = dto.ShiftTypeId;
        assignment.Status = "Manual";

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
    public async Task<IActionResult> DeleteShiftsInRange([FromQuery] DateOnly startDate, [FromQuery] DateOnly endDate)
    {
        if (startDate > endDate)
            return BadRequest("Початкова дата не може бути пізнішою за кінцеву.");

        var shiftsToDelete = await context.ShiftAssignments
            .Where(sa => sa.Date >= startDate && sa.Date <= endDate)
            .ToListAsync();

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

        int generatedCount = await generatorService.GenerateScheduleAsync(request.StartDate, request.EndDate);

        return Ok(new { Message = $"Генерація завершена. Створено {generatedCount} нових змін." });
    }
}