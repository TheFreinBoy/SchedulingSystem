namespace SchedulingSystem.DTOs;

public class PositionDto
{
    public int Id { get; set; }
    public required string Name { get; set; }
}

public class CreatePositionDto
{
    public required string Name { get; set; }
}