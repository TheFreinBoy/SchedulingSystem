namespace SchedulingSystem.Entities;

public class Employee
{
    public int Id { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? MiddleName { get; set; }
    public required string Email { get; set; }
    public int MaxHoursPerWeek { get; set; }
    public int WorkDaysPattern { get; set; } = 5;
    public int OffDaysPattern { get; set; } = 2;

    public bool IsActive { get; set; } = true;
    public string Role { get; set; } = "Employee";
    public string? PasswordHash { get; set; }

    public int PositionId { get; set; }
    public Position? Position { get; set; }

    public ICollection<ShiftAssignment> ShiftAssignments { get; set; } = [];
    public ICollection<EmployeeAvailability> Availabilities { get; set; } = [];
}