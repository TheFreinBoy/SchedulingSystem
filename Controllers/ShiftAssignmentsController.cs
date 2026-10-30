using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchedulingSystem.Data;
using SchedulingSystem.Entities;
using SchedulingSystem.DTOs;

namespace SchedulingSystem.Controllers;
[Route("api/[controller]")]
[ApiController]
public class ShiftAssignmentsController(ApplicationDbContext context) : ControllerBase
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
                    EmployeeFullName = sa.Employee!.FirstName + " " + sa.Employee.LastName,
                    ShiftTypeName = sa.ShiftType!.Name,
                    Status = sa.Status
                })
                .ToListAsync();

            return Ok(schedule);
        }

        [HttpPost]
        public async Task<ActionResult> AssignShift(CreateShiftAssignmentDto dto)
        {
            var employeeExists = await context.Employees.AnyAsync(e => e.Id == dto.EmployeeId);
            var shiftExists = await context.ShiftTypes.AnyAsync(s => s.Id == dto.ShiftTypeId);

            if (!employeeExists || !shiftExists)
                return BadRequest("Працівник або тип зміни не знайдені.");

            var existingAssignment = await context.ShiftAssignments
                .FirstOrDefaultAsync(sa => sa.EmployeeId == dto.EmployeeId && sa.Date == dto.Date);
            
            if (existingAssignment != null)
                return BadRequest("Працівник вже має призначену зміну на цю дату.");

            var assignment = new ShiftAssignment
            {
                Date = dto.Date,
                EmployeeId = dto.EmployeeId,
                ShiftTypeId = dto.ShiftTypeId,
                Status = "Manual"
            };

            context.ShiftAssignments.Add(assignment);
            await context.SaveChangesAsync();

            return Ok();
        }
}