namespace SchedulingSystem.DTOs;

public class ShiftTypeDto
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int RequiredStaffCount { get; set; }
    public required string PositionName { get; set; }
}

public class CreateShiftTypeDto
{
    public required string Name { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int RequiredStaffCount { get; set; }
    public int PositionId { get; set; }
}

public class ShiftAssignmentDto
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public required string EmployeeFullName { get; set; } 
    public required string ShiftTypeName { get; set; }
    public required string Status { get; set; }
}

public class CreateShiftAssignmentDto
{
    public DateOnly Date { get; set; }
    public int EmployeeId { get; set; }
    public int ShiftTypeId { get; set; }
}
public class GenerateScheduleRequestDto
{
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
}