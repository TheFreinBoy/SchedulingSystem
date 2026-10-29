namespace SchedulingSystem.DTOs;

public class EmployeeDto
{
    public int Id { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Email { get; set; }
    public int MaxHoursPerWeek { get; set; }
    public required string PositionName { get; set; } 
}

public class CreateEmployeeDto
{
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Email { get; set; }
    public int MaxHoursPerWeek { get; set; }
    public int PositionId { get; set; }
}