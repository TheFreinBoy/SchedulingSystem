using System;

namespace SchedulingSystem.Entities;

public class ShiftType
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string ShortCode { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int RequiredStaffCount { get; set; }

    public int PositionId { get; set; }
    public Position? Position { get; set; }
}