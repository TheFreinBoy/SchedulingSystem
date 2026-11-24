using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchedulingSystem.Data;
using SchedulingSystem.Entities;
using SchedulingSystem.DTOs;
using System.Linq;

namespace SchedulingSystem.Controllers;

[Route("api/[controller]")]
[ApiController]
public class EmployeesController(ApplicationDbContext context) : ControllerBase
{
    private static double CalculateShiftDurationHours(TimeSpan start, TimeSpan end)
    {
        return end >= start
            ? (end - start).TotalHours
            : (TimeSpan.FromHours(24) - start + end).TotalHours;
    }

    private static (DateOnly WeekStart, DateOnly WeekEnd) GetWeekBounds(DateOnly targetDate)
    {
        int diff = (7 + (targetDate.DayOfWeek - DayOfWeek.Monday)) % 7;
        var start = targetDate.AddDays(-diff);
        return (start, start.AddDays(6));
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetEmployees()
    {
        var (weekStart, weekEnd) = GetWeekBounds(DateOnly.FromDateTime(DateTime.Today));

        var rawEmployees = await context.Employees
            .Include(e => e.Position)
            .Include(e => e.ShiftAssignments.Where(sa => sa.Date >= weekStart && sa.Date <= weekEnd))
                .ThenInclude(sa => sa.ShiftType)
            .OrderByDescending(e => e.IsActive)
            .ThenBy(e => e.LastName)
            .ToListAsync();

        var result = rawEmployees.Select(e => new EmployeeDto
        {
            Id = e.Id,
            FirstName = e.FirstName,
            LastName = e.LastName,
            MiddleName = e.MiddleName,
            Email = e.Email,
            CurrentWeekHours = Math.Round(
                e.ShiftAssignments
                    .Where(sa => sa.ShiftType != null)
                    .Sum(sa => CalculateShiftDurationHours(sa.ShiftType!.StartTime, sa.ShiftType.EndTime)),
                1),
            MaxHoursPerWeek = e.MaxHoursPerWeek,
            PositionId = e.PositionId,
            PositionName = e.Position!.Name,
            WorkDaysPattern = e.WorkDaysPattern,
            OffDaysPattern = e.OffDaysPattern,
            IsActive = e.IsActive
        });

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<EmployeeDto>> CreateEmployee(CreateEmployeeDto dto)
    {
        var position = await context.Positions.FindAsync(dto.PositionId);
        if (position == null) return BadRequest("Вказана посада не знайдена.");

        var newEmployee = new Employee
        {
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            MiddleName = string.IsNullOrWhiteSpace(dto.MiddleName) ? null : dto.MiddleName.Trim(),
            Email = dto.Email.Trim(),
            MaxHoursPerWeek = dto.MaxHoursPerWeek,
            PositionId = dto.PositionId,
            WorkDaysPattern = dto.WorkDaysPattern,
            OffDaysPattern = dto.OffDaysPattern,
            IsActive = true
        };

        context.Employees.Add(newEmployee);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetEmployees), new { id = newEmployee.Id }, new EmployeeDto
        {
            Id = newEmployee.Id,
            FirstName = newEmployee.FirstName,
            LastName = newEmployee.LastName,
            MiddleName = newEmployee.MiddleName,
            Email = newEmployee.Email,
            CurrentWeekHours = 0,
            MaxHoursPerWeek = newEmployee.MaxHoursPerWeek,
            PositionId = newEmployee.PositionId,
            PositionName = position.Name,
            WorkDaysPattern = newEmployee.WorkDaysPattern,
            OffDaysPattern = newEmployee.OffDaysPattern,
            IsActive = newEmployee.IsActive
        });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<EmployeeDto>> UpdateEmployee(int id, UpdateEmployeeDto dto)
    {
        var employee = await context.Employees.FindAsync(id);
        if (employee == null) return NotFound("Працівника не знайдено.");

        var position = await context.Positions.FindAsync(dto.PositionId);
        if (position == null) return BadRequest("Вказана посада не знайдена.");

        employee.FirstName = dto.FirstName.Trim();
        employee.LastName = dto.LastName.Trim();
        employee.MiddleName = string.IsNullOrWhiteSpace(dto.MiddleName) ? null : dto.MiddleName.Trim();
        employee.Email = dto.Email.Trim();
        employee.MaxHoursPerWeek = dto.MaxHoursPerWeek;
        employee.PositionId = dto.PositionId;
        employee.WorkDaysPattern = dto.WorkDaysPattern;
        employee.OffDaysPattern = dto.OffDaysPattern;
        employee.IsActive = dto.IsActive;

        await context.SaveChangesAsync();

        return Ok(new EmployeeDto
        {
            Id = employee.Id,
            FirstName = employee.FirstName,
            LastName = employee.LastName,
            MiddleName = employee.MiddleName,
            Email = employee.Email,
            CurrentWeekHours = 0,
            MaxHoursPerWeek = employee.MaxHoursPerWeek,
            PositionId = employee.PositionId,
            PositionName = position.Name,
            WorkDaysPattern = employee.WorkDaysPattern,
            OffDaysPattern = employee.OffDaysPattern,
            IsActive = employee.IsActive
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteEmployee(int id)
    {
        var employee = await context.Employees.FindAsync(id);
        if (employee == null) return NotFound("Працівника не знайдено.");

        var hasAssignments = await context.ShiftAssignments.AnyAsync(sa => sa.EmployeeId == id);
        if (hasAssignments)
        {
            employee.IsActive = false;
            await context.SaveChangesAsync();
            return Ok(new { Message = "Працівника переведено в архів (збережено історію змін)." });
        }

        context.Employees.Remove(employee);
        await context.SaveChangesAsync();
        return NoContent();
    }
}