using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SchedulingSystem.Data;
using SchedulingSystem.Entities;

namespace SchedulingSystem.Services;

public class ScheduleGeneratorService(
    ApplicationDbContext context,
    IScheduleValidationService validationService) : IScheduleGeneratorService
{
    public async Task<int> GenerateScheduleAsync(DateOnly startDate, DateOnly endDate, int? positionId = null)
    {
        var allShiftTypes = await context.ShiftTypes.ToListAsync();
        var shiftTypesMap = allShiftTypes.ToDictionary(st => st.Id);

        var targetShiftTypes = positionId.HasValue
            ? allShiftTypes.Where(st => st.PositionId == positionId.Value).ToList()
            : allShiftTypes;

        var activeEmployees = await context.Employees
            .Where(e => e.IsActive)
            .Include(e => e.Availabilities)
            .ToListAsync();

        var contextStart = startDate.AddDays(-14);
        var contextEnd = endDate.AddDays(14);

        var knownAssignments = await context.ShiftAssignments
            .Where(sa => sa.Date >= contextStart && sa.Date <= contextEnd)
            .ToListAsync();

        var newAssignments = new List<ShiftAssignment>();
        var assignmentsToRemove = new List<ShiftAssignment>();
        int generatedAssignedCount = 0;

        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            int diffToMonday = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
            var weekStart = date.AddDays(-diffToMonday);
            var weekEnd = weekStart.AddDays(6);

            foreach (var shift in targetShiftTypes)
            {
                int requiredStaff = Math.Max(1, shift.RequiredStaffCount);

                int alreadyAssigned = knownAssignments.Count(sa =>
                    sa.Date == date &&
                    sa.ShiftTypeId == shift.Id &&
                    sa.EmployeeId.HasValue);

                var existingUnassigned = knownAssignments
                    .Where(sa => sa.Date == date && sa.ShiftTypeId == shift.Id && !sa.EmployeeId.HasValue)
                    .ToList();

                int needed = Math.Max(0, requiredStaff - alreadyAssigned);
                int assignedNow = 0;

                if (needed > 0)
                {
                    var rankedCandidates = activeEmployees
                        .Where(e => e.PositionId == shift.PositionId)
                        .Select(emp =>
                        {
                            double weekHours = knownAssignments
                                .Where(sa => sa.EmployeeId == emp.Id && sa.Date >= weekStart && sa.Date <= weekEnd && shiftTypesMap.ContainsKey(sa.ShiftTypeId))
                                .Sum(sa =>
                                {
                                    var st = shiftTypesMap[sa.ShiftTypeId];
                                    return validationService.CalculateShiftDurationHours(st.StartTime, st.EndTime);
                                });

                            double maxHours = emp.MaxHoursPerWeek > 0 ? emp.MaxHoursPerWeek : 40;
                            double loadRatio = weekHours / maxHours;
                            return new { Employee = emp, LoadRatio = loadRatio, WeekHours = weekHours };
                        })
                        .OrderBy(x => x.LoadRatio)
                        .ThenBy(x => x.WeekHours)
                        .ThenBy(x => x.Employee.Id)
                        .Select(x => x.Employee)
                        .ToList();

                    foreach (var emp in rankedCandidates)
                    {
                        if (assignedNow >= needed) break;

                        var violations = validationService.ValidateCandidateAssignment(
                            emp,
                            date,
                            shift,
                            knownAssignments,
                            shiftTypesMap);

                        if (violations.Count == 0)
                        {
                            var assignment = new ShiftAssignment
                            {
                                Date = date,
                                EmployeeId = emp.Id,
                                ShiftTypeId = shift.Id,
                                Status = "Generated Auto"
                            };

                            knownAssignments.Add(assignment);
                            newAssignments.Add(assignment);
                            assignedNow++;
                            generatedAssignedCount++;
                        }
                    }
                }

                int stillMissing = Math.Max(0, needed - assignedNow);

                if (existingUnassigned.Count > stillMissing)
                {
                    var excess = existingUnassigned.Take(existingUnassigned.Count - stillMissing).ToList();
                    foreach (var item in excess)
                    {
                        knownAssignments.Remove(item);
                        if (item.Id != 0)
                        {
                            assignmentsToRemove.Add(item);
                        }
                    }
                }
                else if (existingUnassigned.Count < stillMissing)
                {
                    int toCreate = stillMissing - existingUnassigned.Count;
                    for (int i = 0; i < toCreate; i++)
                    {
                        var placeholder = new ShiftAssignment
                        {
                            Date = date,
                            EmployeeId = null,
                            ShiftTypeId = shift.Id,
                            Status = "Unassigned"
                        };

                        knownAssignments.Add(placeholder);
                        newAssignments.Add(placeholder);
                    }
                }
            }
        }

        if (assignmentsToRemove.Count > 0)
        {
            context.ShiftAssignments.RemoveRange(assignmentsToRemove);
        }

        if (newAssignments.Count > 0)
        {
            context.ShiftAssignments.AddRange(newAssignments);
        }

        if (assignmentsToRemove.Count > 0 || newAssignments.Count > 0)
        {
            await context.SaveChangesAsync();
        }

        return generatedAssignedCount;
    }
}