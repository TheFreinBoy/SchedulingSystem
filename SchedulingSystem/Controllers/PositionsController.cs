using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchedulingSystem.Data;
using SchedulingSystem.Entities;
using SchedulingSystem.DTOs;

namespace SchedulingSystem.Controllers;
[Route("api/[controller]")]
[ApiController]
public class PositionsController(ApplicationDbContext context) : ControllerBase
{
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PositionDto>>> GetPositions()
    {
        var positions = await context.Positions
            .Select(p => new PositionDto
            {
                Id = p.Id,
                Name = p.Name
            })
            .ToListAsync();

        return Ok(positions);
    }

    [HttpPost]
    public async Task<ActionResult<PositionDto>> CreatePosition(CreatePositionDto dto)
    {
        var newPosition = new Position
        {
            Name = dto.Name
        };

        context.Positions.Add(newPosition);
        await context.SaveChangesAsync();

        var responseDto = new PositionDto
        {
            Id = newPosition.Id,
            Name = newPosition.Name
        };

        return CreatedAtAction(nameof(GetPositions), new { id = newPosition.Id }, responseDto);
    }
}