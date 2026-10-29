namespace SchedulingSystem.Entities;

public class Employee
{
    public int Id { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Email { get; set; }
        
    public int MaxHoursPerWeek { get; set; } = 40; 
        
    public int PositionId { get; set; }
    public Position? Position { get; set; }

    public ICollection<EmployeeAvailability> Availabilities { get; set; } = new List<EmployeeAvailability>();
    public ICollection<ShiftAssignment> ShiftAssignments { get; set; } = new List<ShiftAssignment>();
}