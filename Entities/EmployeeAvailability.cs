namespace SchedulingSystem.Entities;

public class EmployeeAvailability
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }
        
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
        
    public required string Reason { get; set; }
}