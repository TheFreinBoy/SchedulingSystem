using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SchedulingSystem.Data;
using SchedulingSystem.Entities;

namespace SchedulingSystem.Services;

public class ScheduleValidationService(ApplicationDbContext context) : IScheduleValidationService
{
    public const double MinRestHoursBetweenShifts = 12.0;

    public double CalculateShiftDurationHours(TimeSpan start, TimeSpan end)
    {
        return end >= start
            ? (end - start).TotalHours
            : (TimeSpan.FromHours(24) - start + end).TotalHours;
    }

    private (DateTime Start, DateTime End) GetShiftWindow(DateOnly date, ShiftType shift)
    {
        var start = date.ToDateTime(TimeOnly.FromTimeSpan(shift.StartTime));
        var duration = CalculateShiftDurationHours(shift.StartTime, shift.EndTime);
        return (start, start.AddHours(duration));
    }

    public List<RuleViolation> ValidateCandidateAssignment(
        Employee employee,
        DateOnly date,
        ShiftType targetShift,
        IReadOnlyCollection<ShiftAssignment> knownAssignments,
        IReadOnlyDictionary<int, ShiftType> shiftTypesMap,
        int? excludeAssignmentId = null)
    {
        var violations = new List<RuleViolation>();

        if (!employee.IsActive)
        {
            violations.Add(new RuleViolation("INACTIVE", "Працівник перебуває в архіві."));
        }

        if (employee.PositionId != targetShift.PositionId)
        {
            violations.Add(new RuleViolation("POSITION_MISMATCH", "Посада працівника не відповідає вимогам зміни."));
        }

        var availabilityConflict = employee.Availabilities
            .FirstOrDefault(a => a.StartDate <= date && a.EndDate >= date);
        if (availabilityConflict != null)
        {
            violations.Add(new RuleViolation(
                "UNAVAILABLE",
                $"Працівник недоступний у цю дату ({availabilityConflict.Reason})."));
        }

        var empAssignments = knownAssignments
            .Where(sa => sa.EmployeeId == employee.Id && (!excludeAssignmentId.HasValue || sa.Id != excludeAssignmentId.Value))
            .ToList();

        if (empAssignments.Any(sa => sa.Date == date))
        {
            violations.Add(new RuleViolation("DOUBLE_BOOKING", "Працівник вже має зміну на цю дату."));
        }

        // Перевірка міжзмінного відпочинку (мінімум 12 годин до і після зміни)
        var (currStart, currEnd) = GetShiftWindow(date, targetShift);

        var yesterdayAssignment = empAssignments.FirstOrDefault(sa => sa.Date == date.AddDays(-1));
        if (yesterdayAssignment != null && shiftTypesMap.TryGetValue(yesterdayAssignment.ShiftTypeId, out var prevShift))
        {
            var (_, prevEnd) = GetShiftWindow(yesterdayAssignment.Date, prevShift);
            double restHours = Math.Round((currStart - prevEnd).TotalHours, 1);
            if (restHours < MinRestHoursBetweenShifts)
            {
                violations.Add(new RuleViolation(
                    "REST_VIOLATION",
                    $"Недостатній відпочинок після попередньої зміни: {restHours} год (мін. {MinRestHoursBetweenShifts} год)."));
            }
        }

        var tomorrowAssignment = empAssignments.FirstOrDefault(sa => sa.Date == date.AddDays(1));
        if (tomorrowAssignment != null && shiftTypesMap.TryGetValue(tomorrowAssignment.ShiftTypeId, out var nextShift))
        {
            var (nextStart, _) = GetShiftWindow(tomorrowAssignment.Date, nextShift);
            double restHours = Math.Round((nextStart - currEnd).TotalHours, 1);
            if (restHours < MinRestHoursBetweenShifts)
            {
                violations.Add(new RuleViolation(
                    "REST_VIOLATION",
                    $"Недостатній відпочинок перед наступною зміною: {restHours} год (мін. {MinRestHoursBetweenShifts} год)."));
            }
        }

        // Перевірка шаблону змінності (WorkDaysPattern / OffDaysPattern)
        int maxWorkDays = employee.WorkDaysPattern > 0 ? employee.WorkDaysPattern : 5;
        int minOffDays = employee.OffDaysPattern > 0 ? employee.OffDaysPattern : 2;
        var workedDates = empAssignments.Select(sa => sa.Date).ToHashSet();

        int streakBefore = 0;
        var cursor = date.AddDays(-1);
        while (workedDates.Contains(cursor))
        {
            streakBefore++;
            cursor = cursor.AddDays(-1);
        }

        int streakAfter = 0;
        cursor = date.AddDays(1);
        while (workedDates.Contains(cursor))
        {
            streakAfter++;
            cursor = cursor.AddDays(1);
        }

        if (streakBefore + 1 + streakAfter > maxWorkDays)
        {
            violations.Add(new RuleViolation(
                "PATTERN_WORK_LIMIT",
                $"Перевищено серію робочих днів ({streakBefore + 1 + streakAfter} з {maxWorkDays} за графіком {maxWorkDays}/{minOffDays})."));
        }
        else if (streakBefore == 0)
        {
            int gapDays = 0;
            var gapCursor = date.AddDays(-1);
            while (!workedDates.Contains(gapCursor) && gapDays <= 14)
            {
                gapDays++;
                gapCursor = gapCursor.AddDays(-1);
            }

            if (gapDays > 0 && gapDays < minOffDays)
            {
                int prevBlock = 0;
                while (workedDates.Contains(gapCursor))
                {
                    prevBlock++;
                    gapCursor = gapCursor.AddDays(-1);
                }

                if (prevBlock >= maxWorkDays)
                {
                    violations.Add(new RuleViolation(
                        "PATTERN_OFF_LIMIT",
                        $"Не завершено обов'язкові вихідні дні ({gapDays} з {minOffDays} за графіком {maxWorkDays}/{minOffDays})."));
                }
            }
        }

        // Перевірка тижневого ліміту годин (Пн–Нд)
        int diffToMonday = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        var weekStart = date.AddDays(-diffToMonday);
        var weekEnd = weekStart.AddDays(6);

        double existingWeekHours = empAssignments
            .Where(sa => sa.Date >= weekStart && sa.Date <= weekEnd && shiftTypesMap.ContainsKey(sa.ShiftTypeId))
            .Sum(sa =>
            {
                var st = shiftTypesMap[sa.ShiftTypeId];
                return CalculateShiftDurationHours(st.StartTime, st.EndTime);
            });

        double newDuration = CalculateShiftDurationHours(targetShift.StartTime, targetShift.EndTime);
        double totalWeekHours = Math.Round(existingWeekHours + newDuration, 1);
        double maxWeeklyHours = employee.MaxHoursPerWeek > 0 ? employee.MaxHoursPerWeek : 40;

        if (totalWeekHours > maxWeeklyHours)
        {
            violations.Add(new RuleViolation(
                "WEEKLY_OVERTIME",
                $"Перевищено норму годин за тиждень ({totalWeekHours} / {maxWeeklyHours} год)."));
        }

        return violations;
    }

    public async Task<List<RuleViolation>> ValidateSingleAssignmentAsync(
        int employeeId,
        DateOnly date,
        int shiftTypeId,
        int? excludeAssignmentId = null)
    {
        var employee = await context.Employees
            .Include(e => e.Availabilities)
            .FirstOrDefaultAsync(e => e.Id == employeeId);

        var shiftTypesMap = await context.ShiftTypes.ToDictionaryAsync(st => st.Id);

        if (employee == null || !shiftTypesMap.TryGetValue(shiftTypeId, out var targetShift))
            return [];

        var rangeStart = date.AddDays(-14);
        var rangeEnd = date.AddDays(14);

        var nearbyAssignments = await context.ShiftAssignments
            .Where(sa => sa.EmployeeId == employeeId && sa.Date >= rangeStart && sa.Date <= rangeEnd)
            .ToListAsync();

        return ValidateCandidateAssignment(employee, date, targetShift, nearbyAssignments, shiftTypesMap, excludeAssignmentId);
    }

    public async Task<ScheduleAuditReportDto> AuditScheduleAsync(DateOnly startDate, DateOnly endDate, int? positionId = null)
    {
        var allShiftTypes = await context.ShiftTypes.ToListAsync();
        var shiftTypesMap = allShiftTypes.ToDictionary(st => st.Id);

        var targetShiftTypes = positionId.HasValue
            ? allShiftTypes.Where(st => st.PositionId == positionId.Value).ToList()
            : allShiftTypes;

        var employees = await context.Employees
            .Include(e => e.Availabilities)
            .ToListAsync();
        var employeesMap = employees.ToDictionary(e => e.Id);

        var targetActiveEmployees = employees
            .Where(e => e.IsActive && (!positionId.HasValue || e.PositionId == positionId.Value))
            .ToList();

        var extendedStart = startDate.AddDays(-14);
        var extendedEnd = endDate.AddDays(14);

        var allAssignments = await context.ShiftAssignments
            .Where(sa => sa.Date >= extendedStart && sa.Date <= extendedEnd)
            .ToListAsync();

        var periodAssignments = allAssignments
            .Where(sa => sa.Date >= startDate && sa.Date <= endDate)
            .ToList();

        var conflicts = new List<ScheduleConflictDto>();

        int daysCount = endDate.DayNumber - startDate.DayNumber + 1;
        int totalRequiredSlots = targetShiftTypes.Sum(st => Math.Max(1, st.RequiredStaffCount)) * daysCount;
        int filledSlots = 0;

        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            foreach (var shift in targetShiftTypes)
            {
                int required = Math.Max(1, shift.RequiredStaffCount);
                int assigned = periodAssignments.Count(sa => sa.Date == date && sa.ShiftTypeId == shift.Id && sa.EmployeeId.HasValue);
                filledSlots += Math.Min(assigned, required);

                if (assigned < required)
                {
                    conflicts.Add(new ScheduleConflictDto(
                        date,
                        "Непризначено",
                        shift.Name,
                        "Недоукомплектованість",
                        $"Призначено {assigned} з {required} працівників."));
                }
            }
        }

        foreach (var assignment in periodAssignments.Where(sa => sa.EmployeeId.HasValue))
        {
            if (!employeesMap.TryGetValue(assignment.EmployeeId!.Value, out var emp) ||
                !shiftTypesMap.TryGetValue(assignment.ShiftTypeId, out var shift))
            {
                continue;
            }

            if (positionId.HasValue && shift.PositionId != positionId.Value && emp.PositionId != positionId.Value)
                continue;

            var itemViolations = ValidateCandidateAssignment(
                emp,
                assignment.Date,
                shift,
                allAssignments,
                shiftTypesMap,
                excludeAssignmentId: assignment.Id);

            string fullName = $"{emp.LastName} {emp.FirstName}";
            foreach (var v in itemViolations.Where(v => v.Code != "WEEKLY_OVERTIME"))
            {
                conflicts.Add(new ScheduleConflictDto(
                    assignment.Date,
                    fullName,
                    shift.Name,
                    v.Code,
                    v.Message));
            }
        }

        int diffStart = (7 + (startDate.DayOfWeek - DayOfWeek.Monday)) % 7;
        var firstWeekMonday = startDate.AddDays(-diffStart);

        for (var weekStart = firstWeekMonday; weekStart <= endDate; weekStart = weekStart.AddDays(7))
        {
            var weekEnd = weekStart.AddDays(6);
            foreach (var emp in targetActiveEmployees)
            {
                double weekHours = allAssignments
                    .Where(sa => sa.EmployeeId == emp.Id && sa.Date >= weekStart && sa.Date <= weekEnd && shiftTypesMap.ContainsKey(sa.ShiftTypeId))
                    .Sum(sa =>
                    {
                        var st = shiftTypesMap[sa.ShiftTypeId];
                        return CalculateShiftDurationHours(st.StartTime, st.EndTime);
                    });

                double maxHours = emp.MaxHoursPerWeek > 0 ? emp.MaxHoursPerWeek : 40;
                if (weekHours > maxHours)
                {
                    conflicts.Add(new ScheduleConflictDto(
                        weekStart < startDate ? startDate : weekStart,
                        $"{emp.LastName} {emp.FirstName}",
                        "Тижневий ліміт",
                        "WEEKLY_OVERTIME",
                        $"Відпрацьовано {Math.Round(weekHours, 1)} год при нормі {maxHours} год/тиждень."));
                }
            }
        }

        double weeksFactor = Math.Max(1.0, daysCount / 7.0);
        double avgWorkload = 0;

        if (targetActiveEmployees.Count > 0)
        {
            avgWorkload = targetActiveEmployees.Average(emp =>
            {
                double worked = periodAssignments
                    .Where(sa => sa.EmployeeId == emp.Id && shiftTypesMap.ContainsKey(sa.ShiftTypeId))
                    .Sum(sa =>
                    {
                        var st = shiftTypesMap[sa.ShiftTypeId];
                        return CalculateShiftDurationHours(st.StartTime, st.EndTime);
                    });
                double expected = (emp.MaxHoursPerWeek > 0 ? emp.MaxHoursPerWeek : 40) * weeksFactor;
                return Math.Min(100.0, (worked / expected) * 100.0);
            });
        }

        double coveragePercent = totalRequiredSlots > 0
            ? Math.Round((double)filledSlots / totalRequiredSlots * 100.0, 1)
            : 100.0;

        return new ScheduleAuditReportDto(
            startDate,
            endDate,
            totalRequiredSlots,
            filledSlots,
            coveragePercent,
            Math.Round(avgWorkload, 1),
            conflicts.Count,
            conflicts
        );
    }
}