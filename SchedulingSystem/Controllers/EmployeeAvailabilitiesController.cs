using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchedulingSystem.Data;
using SchedulingSystem.Entities;

namespace SchedulingSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeeAvailabilitiesController(ApplicationDbContext context) : ControllerBase
{
    public record AvailabilityUpsertDto(
        int EmployeeId,
        DateOnly StartDate,
        DateOnly EndDate,
        string Reason
    );

    [HttpGet]
    public async Task<IActionResult> GetAvailabilities([FromQuery] int? employeeId)
    {
        var query = context.EmployeeAvailabilities
            .Include(a => a.Employee)
            .ThenInclude(e => e!.Position)
            .AsQueryable();

        if (employeeId.HasValue)
        {
            query = query.Where(a => a.EmployeeId == employeeId.Value);
        }

        var items = await query
            .OrderByDescending(a => a.StartDate)
            .ThenBy(a => a.Employee!.LastName)
            .Select(a => new
            {
                a.Id,
                a.EmployeeId,
                EmployeeFullName = a.Employee != null
                    ? string.Join(" ", new[] { a.Employee.LastName, a.Employee.FirstName, a.Employee.MiddleName }
                        .Where(s => !string.IsNullOrWhiteSpace(s)))
                    : "Невідомий працівник",
                PositionName = a.Employee != null && a.Employee.Position != null
                    ? a.Employee.Position.Name
                    : "",
                a.StartDate,
                a.EndDate,
                DaysCount = a.EndDate.DayNumber - a.StartDate.DayNumber + 1,
                a.Reason
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAvailability([FromBody] AvailabilityUpsertDto dto)
    {
        var employee = await context.Employees.FindAsync(dto.EmployeeId);
        if (employee == null)
            return NotFound("Працівника не знайдено.");

        if (dto.EndDate < dto.StartDate)
            return BadRequest("Кінцева дата не може бути ранішою за початкову.");

        var reason = dto.Reason?.Trim();
        if (string.IsNullOrWhiteSpace(reason))
            return BadRequest("Вкажіть причину відсутності.");

        var hasOverlap = await context.EmployeeAvailabilities.AnyAsync(a =>
            a.EmployeeId == dto.EmployeeId &&
            a.StartDate <= dto.EndDate &&
            a.EndDate >= dto.StartDate);

        if (hasOverlap)
            return BadRequest("Для цього працівника вже існує запис відсутності, що перетинається з обраними датами.");

        var availability = new EmployeeAvailability
        {
            EmployeeId = dto.EmployeeId,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Reason = reason
        };

        context.EmployeeAvailabilities.Add(availability);
        await context.SaveChangesAsync();

        var conflictingShiftsCount = await context.ShiftAssignments
            .CountAsync(s => s.EmployeeId == dto.EmployeeId && s.Date >= dto.StartDate && s.Date <= dto.EndDate);

        string? warning = conflictingShiftsCount > 0
            ? $"Запис збережено, але у працівника вже є призначені зміни ({conflictingShiftsCount} шт.) у цей період."
            : null;

        return Ok(new
        {
            message = "Період відсутності збережено.",
            warning
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateAvailability(int id, [FromBody] AvailabilityUpsertDto dto)
    {
        var availability = await context.EmployeeAvailabilities.FindAsync(id);
        if (availability == null)
            return NotFound("Запис не знайдено.");

        if (dto.EndDate < dto.StartDate)
            return BadRequest("Кінцева дата не може бути ранішою за початкову.");

        var reason = dto.Reason?.Trim();
        if (string.IsNullOrWhiteSpace(reason))
            return BadRequest("Вкажіть причину відсутності.");

        var hasOverlap = await context.EmployeeAvailabilities.AnyAsync(a =>
            a.Id != id &&
            a.EmployeeId == dto.EmployeeId &&
            a.StartDate <= dto.EndDate &&
            a.EndDate >= dto.StartDate);

        if (hasOverlap)
            return BadRequest("Для цього працівника вже існує інший запис, що перетинається з цими датами.");

        availability.EmployeeId = dto.EmployeeId;
        availability.StartDate = dto.StartDate;
        availability.EndDate = dto.EndDate;
        availability.Reason = reason;

        await context.SaveChangesAsync();

        var conflictingShiftsCount = await context.ShiftAssignments
            .CountAsync(s => s.EmployeeId == dto.EmployeeId && s.Date >= dto.StartDate && s.Date <= dto.EndDate);

        string? warning = conflictingShiftsCount > 0
            ? $"Запис оновлено, але у працівника вже є призначені зміни ({conflictingShiftsCount} шт.) у цей період."
            : null;

        return Ok(new
        {
            message = "Запис відсутності оновлено.",
            warning
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAvailability(int id)
    {
        var availability = await context.EmployeeAvailabilities.FindAsync(id);
        if (availability == null)
            return NotFound("Запис не знайдено.");

        context.EmployeeAvailabilities.Remove(availability);
        await context.SaveChangesAsync();

        return Ok(new { message = "Запис видалено." });
    }
}