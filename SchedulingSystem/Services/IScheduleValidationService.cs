using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SchedulingSystem.Entities;

namespace SchedulingSystem.Services;

public record RuleViolation(string Code, string Message);

public record ScheduleConflictDto(
    DateOnly Date,
    string EmployeeName,
    string ShiftName,
    string RuleType,
    string Description
);

public record ScheduleAuditReportDto(
    DateOnly StartDate,
    DateOnly EndDate,
    int TotalRequiredSlots,
    int FilledSlots,
    double CoveragePercent,
    double AverageWorkloadPercent,
    int ViolationsCount,
    List<ScheduleConflictDto> Violations
);

public interface IScheduleValidationService
{
    double CalculateShiftDurationHours(TimeSpan start, TimeSpan end);

    List<RuleViolation> ValidateCandidateAssignment(
        Employee employee,
        DateOnly date,
        ShiftType targetShift,
        IReadOnlyCollection<ShiftAssignment> knownAssignments,
        IReadOnlyDictionary<int, ShiftType> shiftTypesMap,
        int? excludeAssignmentId = null);

    Task<List<RuleViolation>> ValidateSingleAssignmentAsync(
        int employeeId,
        DateOnly date,
        int shiftTypeId,
        int? excludeAssignmentId = null);

    Task<ScheduleAuditReportDto> AuditScheduleAsync(DateOnly startDate, DateOnly endDate, int? positionId = null);
}