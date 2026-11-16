using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
                ShortCode = st.ShortCode,
                StartTime = st.StartTime,
                EndTime = st.EndTime,
                RequiredStaffCount = st.RequiredStaffCount,
                PositionId = st.PositionId,
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
            Name = dto.Name.Trim(),
            ShortCode = dto.ShortCode.Trim().ToUpper(),
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            RequiredStaffCount = dto.RequiredStaffCount,
            PositionId = dto.PositionId
        };

        context.ShiftTypes.Add(shiftType);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetShiftTypes), new { id = shiftType.Id }, new ShiftTypeDto
        {
            Id = shiftType.Id,
            Name = shiftType.Name,
            ShortCode = shiftType.ShortCode,
            StartTime = shiftType.StartTime,
            EndTime = shiftType.EndTime,
            RequiredStaffCount = shiftType.RequiredStaffCount,
            PositionId = shiftType.PositionId,
            PositionName = position.Name
        });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ShiftTypeDto>> UpdateShiftType(int id, UpdateShiftTypeDto dto)
    {
        var shiftType = await context.ShiftTypes.FindAsync(id);
        if (shiftType == null) return NotFound("Тип зміни не знайдено.");

        var position = await context.Positions.FindAsync(dto.PositionId);
        if (position == null) return BadRequest("Посада не знайдена.");

        shiftType.Name = dto.Name.Trim();
        shiftType.ShortCode = dto.ShortCode.Trim().ToUpper();
        shiftType.StartTime = dto.StartTime;
        shiftType.EndTime = dto.EndTime;
        shiftType.RequiredStaffCount = dto.RequiredStaffCount;
        shiftType.PositionId = dto.PositionId;

        await context.SaveChangesAsync();

        return Ok(new ShiftTypeDto
        {
            Id = shiftType.Id,
            Name = shiftType.Name,
            ShortCode = shiftType.ShortCode,
            StartTime = shiftType.StartTime,
            EndTime = shiftType.EndTime,
            RequiredStaffCount = shiftType.RequiredStaffCount,
            PositionId = shiftType.PositionId,
            PositionName = position.Name
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteShiftType(int id)
    {
        var shiftType = await context.ShiftTypes.FindAsync(id);
        if (shiftType == null) return NotFound("Тип зміни не знайдено.");

        var isUsed = await context.ShiftAssignments.AnyAsync(sa => sa.ShiftTypeId == id);
        if (isUsed)
            return BadRequest("Неможливо видалити тип зміни, оскільки він вже використовується в розкладі.");

        context.ShiftTypes.Remove(shiftType);
        await context.SaveChangesAsync();

        return NoContent();
    }
}