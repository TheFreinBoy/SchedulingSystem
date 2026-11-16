using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchedulingSystem.Data;
using SchedulingSystem.Entities;

namespace SchedulingSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PositionsController(ApplicationDbContext context) : ControllerBase
{
    public record PositionUpsertDto(string Name);

    [HttpGet]
    public async Task<IActionResult> GetPositions()
    {
        var positions = await context.Positions
            .OrderBy(p => p.Id)
            .Select(p => new
            {
                p.Id,
                p.Name,
                EmployeesCount = context.Employees.Count(e => e.PositionId == p.Id),
                ShiftTypesCount = context.ShiftTypes.Count(st => st.PositionId == p.Id)
            })
            .ToListAsync();

        return Ok(positions);
    }

    [HttpPost]
    public async Task<IActionResult> CreatePosition([FromBody] PositionUpsertDto dto)
    {
        var name = dto.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest("Назва посади не може бути порожньою.");

        var exists = await context.Positions
            .AnyAsync(p => p.Name.ToLower() == name.ToLower());
        if (exists)
            return BadRequest("Посада з такою назвою вже існує.");

        var position = new Position { Name = name };
        context.Positions.Add(position);
        await context.SaveChangesAsync();

        return Ok(new
        {
            position.Id,
            position.Name,
            EmployeesCount = 0,
            ShiftTypesCount = 0
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdatePosition(int id, [FromBody] PositionUpsertDto dto)
    {
        var position = await context.Positions.FindAsync(id);
        if (position == null)
            return NotFound("Посаду не знайдено.");

        var name = dto.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest("Назва посади не може бути порожньою.");

        var duplicate = await context.Positions
            .AnyAsync(p => p.Id != id && p.Name.ToLower() == name.ToLower());
        if (duplicate)
            return BadRequest("Інша посада з такою назвою вже існує.");

        position.Name = name;
        await context.SaveChangesAsync();

        return Ok(new { position.Id, position.Name });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletePosition(int id)
    {
        var position = await context.Positions.FindAsync(id);
        if (position == null)
            return NotFound("Посаду не знайдено.");

        var hasEmployees = await context.Employees.AnyAsync(e => e.PositionId == id);
        if (hasEmployees)
            return BadRequest("Неможливо видалити посаду, оскільки на ній закріплені працівники.");

        var hasShiftTypes = await context.ShiftTypes.AnyAsync(st => st.PositionId == id);
        if (hasShiftTypes)
            return BadRequest("Неможливо видалити посаду, оскільки до неї прив'язані типи змін.");

        context.Positions.Remove(position);
        await context.SaveChangesAsync();

        return Ok(new { message = "Посаду видалено." });
    }
}