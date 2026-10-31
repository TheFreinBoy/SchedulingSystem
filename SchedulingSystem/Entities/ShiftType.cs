namespace SchedulingSystem.Entities;

public class ShiftType
{
    public int Id { get; set; }
    public required string Name { get; set; } 
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
        
    public int RequiredStaffCount { get; set; } = 1;

    public int PositionId { get; set; }
    public Position? Position { get; set; }
}