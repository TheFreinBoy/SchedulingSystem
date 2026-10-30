using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchedulingSystem.Data;
using SchedulingSystem.DTOs;
using SchedulingSystem.Entities;

namespace SchedulingSystem.Controllers;
[Route("api/[controller]")]
[ApiController]
public class ShiftTypesController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShiftTypeDto>>> GetShiftTypes()
    {
        var shiftTypes = await context.ShiftTypes
            .Include(st => st.Position)
            .Select(st => new ShiftTypeDto
            {
                Id = st.Id,
                Name = st.Name,
                StartTime = st.StartTime,
                EndTime = st.EndTime,
                RequiredStaffCount = st.RequiredStaffCount,
                PositionName = st.Position!.Name
            })
            .ToListAsync();

        return Ok(shiftTypes);
    }

    [HttpPost]
    public async Task<ActionResult<ShiftTypeDto>> CreateShiftType(CreateShiftTypeDto dto)
    {
        var position = await context.Positions.FindAsync(dto.PositionId);
        if (position == null) return BadRequest("Посада не знайдена.");

        var shiftType = new ShiftType
        {
            Name = dto.Name,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            RequiredStaffCount = dto.RequiredStaffCount,
            PositionId = dto.PositionId
        };

        context.ShiftTypes.Add(shiftType);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetShiftTypes), new { id = shiftType.Id }, null); 
    }
}