namespace SchedulingSystem.Entities;

public class ShiftAssignment
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
        
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }
        
    public int ShiftTypeId { get; set; }
    public ShiftType? ShiftType { get; set; }
        
    public required string Status { get; set; } = "Generated";
}