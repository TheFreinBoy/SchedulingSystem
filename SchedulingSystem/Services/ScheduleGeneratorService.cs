using Microsoft.EntityFrameworkCore;
using SchedulingSystem.Data;
using SchedulingSystem.Entities;

namespace SchedulingSystem.Services;

public class ScheduleGeneratorService(ApplicationDbContext context) : IScheduleGeneratorService
{
    public async Task<int> GenerateScheduleAsync(DateOnly startDate, DateOnly endDate)
        {
            var shiftTypes = await context.ShiftTypes.ToListAsync();
            
            var employees = await context.Employees
                .Include(e => e.Availabilities)
                .Include(e => e.ShiftAssignments)
                .ThenInclude(sa => sa.ShiftType)
                .ToListAsync();

            var newAssignments = new List<ShiftAssignment>();
            int generatedCount = 0;

            for (var date = startDate; date <= endDate; date = date.AddDays(1))
            {
                foreach (var shift in shiftTypes)
                {
                    int assignedStaff = 0;
                    var eligibleEmployees = employees.Where(e => e.PositionId == shift.PositionId).ToList();

                    foreach (var emp in eligibleEmployees)
                    {
                        if (assignedStaff >= shift.RequiredStaffCount) break;

                        if (CanAssign(emp, date, shift, newAssignments, shiftTypes))
                        {
                            var assignment = new ShiftAssignment
                            {
                                Date = date,
                                EmployeeId = emp.Id,
                                ShiftTypeId = shift.Id,
                                Status = "Generated Auto"
                            };

                            newAssignments.Add(assignment);
                            assignedStaff++;
                            generatedCount++;
                        }
                    }
                }
            }

            context.ShiftAssignments.AddRange(newAssignments);
            await context.SaveChangesAsync();

            return generatedCount;
        }

        private bool CanAssign(Employee emp, DateOnly date, ShiftType newShift, List<ShiftAssignment> newlyGenerated, List<ShiftType> allShifts)
        {
            bool isUnavailable = emp.Availabilities.Any(a => a.StartDate <= date && a.EndDate >= date);
            if (isUnavailable) return false;
            
            bool worksTodayDb = emp.ShiftAssignments.Any(sa => sa.Date == date);
            bool worksTodayNew = newlyGenerated.Any(sa => sa.EmployeeId == emp.Id && sa.Date == date);
            if (worksTodayDb || worksTodayNew) return false;

            var yesterdayDate = date.AddDays(-1);
            var yesterdayShiftId = emp.ShiftAssignments.FirstOrDefault(sa => sa.Date == yesterdayDate)?.ShiftTypeId 
                                ?? newlyGenerated.FirstOrDefault(sa => sa.EmployeeId == emp.Id && sa.Date == yesterdayDate)?.ShiftTypeId;

            if (yesterdayShiftId.HasValue)
            {
                var yesterdayShift = allShifts.FirstOrDefault(st => st.Id == yesterdayShiftId.Value);
                if (yesterdayShift != null)
                {
                    double yesterdayEnd = yesterdayShift.EndTime.TotalHours;
                    double todayStart = newShift.StartTime.TotalHours;
                    if (yesterdayEnd < yesterdayShift.StartTime.TotalHours) yesterdayEnd += 24; 
                    
                    double hoursOfRest = (24 - yesterdayEnd) + todayStart;
                    if (hoursOfRest < 12) return false; 
                }
            }


            double blockHours = 0;
            int recentOffDays = 0;
            int internalOffDays = 0;
            bool countingRecentOffs = true;
            
            for (int i = 1; i <= 30; i++) 
            {
                var checkDate = date.AddDays(-i);
                
                var dbShift = emp.ShiftAssignments.FirstOrDefault(sa => sa.Date == checkDate);
                var newShiftMem = newlyGenerated.FirstOrDefault(sa => sa.EmployeeId == emp.Id && sa.Date == checkDate);
                bool worked = dbShift != null || newShiftMem != null;

                if (worked)
                {
                    countingRecentOffs = false;
                    internalOffDays = 0; 
                    
                    int shiftId = dbShift?.ShiftTypeId ?? newShiftMem!.ShiftTypeId;
                    var shiftDetails = allShifts.First(st => st.Id == shiftId);
                    double duration = (shiftDetails.EndTime - shiftDetails.StartTime).TotalHours;
                    if (duration < 0) duration += 24; 
                    
                    blockHours += duration;
                }
                else
                {
                    if (countingRecentOffs)
                    {

                        recentOffDays++;
                        if (recentOffDays >= 2) break; 
                    }
                    else
                    {
                        internalOffDays++;
                        if (internalOffDays >= 2) break; 
                    }
                }
            }
            
            double newShiftDuration = (newShift.EndTime - newShift.StartTime).TotalHours;
            if (newShiftDuration < 0) newShiftDuration += 24;

            if (blockHours + newShiftDuration > emp.MaxHoursPerWeek)
            {
                return false;
            }

            return true; 
        }
}