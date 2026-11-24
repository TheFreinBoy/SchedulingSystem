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

        modelBuilder.Entity<Position>()
            .HasIndex(p => p.Name)
            .IsUnique();

        modelBuilder.Entity<Employee>()
            .HasIndex(e => e.Email)
            .IsUnique();

        modelBuilder.Entity<Employee>()
            .HasOne(e => e.Position)
            .WithMany(p => p.Employees)
            .HasForeignKey(e => e.PositionId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ShiftType>()
            .HasOne(st => st.Position)
            .WithMany()
            .HasForeignKey(st => st.PositionId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ShiftAssignment>()
            .HasIndex(sa => new { sa.EmployeeId, sa.Date })
            .IsUnique()
            .HasFilter("\"EmployeeId\" IS NOT NULL");

        modelBuilder.Entity<ShiftAssignment>()
            .HasOne(sa => sa.Employee)
            .WithMany(e => e.ShiftAssignments)
            .HasForeignKey(sa => sa.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ShiftAssignment>()
            .HasOne(sa => sa.ShiftType)
            .WithMany()
            .HasForeignKey(sa => sa.ShiftTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<EmployeeAvailability>()
            .HasIndex(a => new { a.EmployeeId, a.StartDate, a.EndDate });

        modelBuilder.Entity<EmployeeAvailability>()
            .HasOne(a => a.Employee)
            .WithMany(e => e.Availabilities)
            .HasForeignKey(a => a.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}