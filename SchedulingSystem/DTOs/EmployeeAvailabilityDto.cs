namespace SchedulingSystem.DTOs;

public class EmployeeAvailabilityDto
{
    public int Id { get; set; }
    public required string EmployeeFullName { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public required string Reason { get; set; } 
}

public class CreateEmployeeAvailabilityDto
{
    public int EmployeeId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public required string Reason { get; set; }
}