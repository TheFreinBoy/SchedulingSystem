using Microsoft.EntityFrameworkCore;
using SchedulingSystem.Entities;
namespace SchedulingSystem.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Position> Positions { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<ShiftType> ShiftTypes { get; set; }
    public DbSet<EmployeeAvailability> EmployeeAvailabilities { get; set; }
    public DbSet<ShiftAssignment> ShiftAssignments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Employee>()
            .HasIndex(e => e.Email)
            .IsUnique();

        modelBuilder.Entity<Employee>()
            .HasOne(e => e.Position)
            .WithMany(p => p.Employees)
            .HasForeignKey(e => e.PositionId)
            .OnDelete(DeleteBehavior.Restrict); 

        modelBuilder.Entity<ShiftAssignment>()
            .HasIndex(sa => new { sa.EmployeeId, sa.Date })
            .IsUnique();

    }
}