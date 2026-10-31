using SchedulingSystem.Entities;
namespace SchedulingSystem.Services;

public interface IScheduleGeneratorService
{
    Task<int> GenerateScheduleAsync(DateOnly startDate, DateOnly endDate);
}