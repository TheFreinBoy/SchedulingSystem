using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchedulingSystem.Data;
using SchedulingSystem.Entities;
using SchedulingSystem.DTOs;

namespace SchedulingSystem.Controllers;

[Route("api/[controller]")]
[ApiController]
public class EmployeesController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
        public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetEmployees()
        {
            var employees = await context.Employees
                .Include(e => e.Position)
                .Select(e => new EmployeeDto
                {
                    Id = e.Id,
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    Email = e.Email,
                    MaxHoursPerWeek = e.MaxHoursPerWeek,
                    PositionName = e.Position!.Name 
                })
                .ToListAsync();

            return Ok(employees);
        }

        [HttpPost]
        public async Task<ActionResult<EmployeeDto>> CreateEmployee(CreateEmployeeDto dto)
        {
            var position = await context.Positions.FindAsync(dto.PositionId);
            if (position == null)
            {
                return BadRequest("Вказана посада не знайдена в базі даних.");
            }

            var newEmployee = new Employee
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                MaxHoursPerWeek = dto.MaxHoursPerWeek,
                PositionId = dto.PositionId
            };

            context.Employees.Add(newEmployee);
            await context.SaveChangesAsync();

            var responseDto = new EmployeeDto
            {
                Id = newEmployee.Id,
                FirstName = newEmployee.FirstName,
                LastName = newEmployee.LastName,
                Email = newEmployee.Email,
                MaxHoursPerWeek = newEmployee.MaxHoursPerWeek,
                PositionName = position.Name
            };

            return CreatedAtAction(nameof(GetEmployees), new { id = newEmployee.Id }, responseDto);
        }
}