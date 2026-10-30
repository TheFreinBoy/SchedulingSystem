using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchedulingSystem.Data;
using SchedulingSystem.Entities;
using SchedulingSystem.DTOs;

namespace SchedulingSystem.Controllers;
[Route("api/[controller]")]
[ApiController]
public class EmployeeAvailabilitiesController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmployeeAvailabilityDto>>> GetAvailabilities()
    {
        var availabilities = await context.EmployeeAvailabilities
            .Include(ea => ea.Employee)
            .Select(ea => new EmployeeAvailabilityDto
            {
                Id = ea.Id,
                EmployeeFullName = ea.Employee!.FirstName + " " + ea.Employee.LastName,
                StartDate = ea.StartDate,
                EndDate = ea.EndDate,
                Reason = ea.Reason
            })
            .ToListAsync();

        return Ok(availabilities);
    }

    [HttpPost]
    public async Task<ActionResult> CreateAvailability(CreateEmployeeAvailabilityDto dto)
    {
        var employeeExists = await context.Employees.AnyAsync(e => e.Id == dto.EmployeeId);
        if (!employeeExists)
        {
            return BadRequest("Працівник не знайдений.");
        }

        if (dto.StartDate > dto.EndDate)
        {
            return BadRequest("Дата початку не може бути пізнішою за дату завершення.");
        }

        var hasOverlap = await context.EmployeeAvailabilities
            .AnyAsync(ea => ea.EmployeeId == dto.EmployeeId &&
                            dto.StartDate <= ea.EndDate &&
                            dto.EndDate >= ea.StartDate);

        if (hasOverlap)
        {
            return BadRequest("У цього працівника вже є створений відгул або відпустка, що перетинається з обраним періодом.");
        }

        var availability = new EmployeeAvailability
        {
            EmployeeId = dto.EmployeeId,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Reason = dto.Reason
        };

        context.EmployeeAvailabilities.Add(availability);
        await context.SaveChangesAsync();

        return Ok();
    }
}