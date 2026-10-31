namespace SchedulingSystem.Entities;

public class Position
{
    public int Id { get; set; }
    public required string Name { get; set; }
        
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}