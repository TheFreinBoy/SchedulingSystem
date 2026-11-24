import { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
    Typography,
    Paper,
    Box,
    CircularProgress,
    Button,
    IconButton,
    Alert,
    Snackbar,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/apiClient';
import { buildPositionColorMap } from '../constants/uiStyles';
import PositionFilterBar from '../components/common/PositionFilterBar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ScheduleToolbar from '../components/schedule/ScheduleToolbar';
import ScheduleAuditDialog from '../components/schedule/ScheduleAuditDialog';
import ShiftFormDialog from '../components/schedule/ShiftFormDialog';

const getTodayStr = () => new Date().toISOString().split('T')[0];

const getPlusDaysStr = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

export default function Schedule() {
    const { isAdmin } = useAuth();

    const [rawAssignments, setRawAssignments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [shiftTypes, setShiftTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedPositionId, setSelectedPositionId] = useState('all');
    const [expandAllInOverview, setExpandAllInOverview] = useState(false);

    const [genRange, setGenRange] = useState({
        startDate: getTodayStr(),
        endDate: getPlusDaysStr(7),
    });
    const [generating, setGenerating] = useState(false);
    const [clearingRange, setClearingRange] = useState(false);
    const [confirmClearDialog, setConfirmClearDialog] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    const [validating, setValidating] = useState(false);
    const [auditDialogOpen, setAuditDialogOpen] = useState(false);
    const [auditReport, setAuditReport] = useState(null);

    const [quickDeleteTarget, setQuickDeleteTarget] = useState(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingShift, setEditingShift] = useState(null);
    const [formData, setFormData] = useState({ date: '', employeeId: '', shiftTypeId: '' });
    const [errorMsg, setErrorMsg] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchAllData = async () => {
        try {
            const requests = [
                apiFetch('/ShiftAssignments'),
                apiFetch('/Positions'),
                apiFetch('/ShiftTypes'),
            ];
            if (isAdmin) {
                requests.push(apiFetch('/Employees'));
            }

            const [schedRes, posRes, typesRes, empRes] = await Promise.all(requests);

            if (schedRes?.ok) setRawAssignments(await schedRes.json());
            if (posRes?.ok) setPositions(await posRes.json());
            if (typesRes?.ok) setShiftTypes(await typesRes.json());
            if (isAdmin && empRes?.ok) setEmployees(await empRes.json());
        } catch (error) {
            console.error('Помилка завантаження даних:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [isAdmin]);

    const positionColorMap = useMemo(() => buildPositionColorMap(positions), [positions]);

    const shiftTypeMap = useMemo(() => {
        const map = {};
        shiftTypes.forEach((st) => {
            map[st.id] = st;
        });
        return map;
    }, [shiftTypes]);

    const enrichedEvents = useMemo(() => {
        return rawAssignments.map((shift) => {
            const isUnassigned = shift.status === 'Unassigned' || !shift.employeeId;
            const stInfo = shiftTypeMap[shift.shiftTypeId];
            return {
                id: String(shift.id),
                title: isUnassigned ? 'Непризначено' : shift.employeeFullName,
                start: shift.date,
                allDay: true,
                extendedProps: {
                    shiftType: shift.shiftTypeName,
                    shiftTypeShortCode: shift.shiftTypeShortCode,
                    isUnassigned,
                    employeeId: shift.employeeId ?? '',
                    shiftTypeId: shift.shiftTypeId,
                    rawDate: shift.date,
                    positionId: stInfo?.positionId ?? null,
                    positionName: stInfo?.positionName ?? '',
                },
            };
        });
    }, [rawAssignments, shiftTypeMap]);

    const filteredEvents = useMemo(() => {
        if (selectedPositionId === 'all') return enrichedEvents;
        return enrichedEvents.filter(
            (ev) => ev.extendedProps.positionId === Number(selectedPositionId)
        );
    }, [enrichedEvents, selectedPositionId]);

    const positionCounts = useMemo(() => {
        const counts = { all: enrichedEvents.length };
        positions.forEach((p) => {
            counts[p.id] = 0;
        });
        enrichedEvents.forEach((ev) => {
            const pid = ev.extendedProps.positionId;
            if (pid != null && counts[pid] !== undefined) counts[pid] += 1;
        });
        return counts;
    }, [enrichedEvents, positions]);

    const selectedPosition = useMemo(() => {
        if (selectedPositionId === 'all') return null;
        return positions.find((p) => p.id === Number(selectedPositionId)) || null;
    }, [positions, selectedPositionId]);

    const validateRange = () => {
        if (!genRange.startDate || !genRange.endDate || genRange.startDate > genRange.endDate) {
            setToast({ open: true, message: 'Вкажіть коректний діапазон дат.', severity: 'error' });
            return false;
        }
        return true;
    };

    const handleGenerateSchedule = async () => {
        if (!validateRange()) return;
        setGenerating(true);
        try {
            const response = await apiFetch('/ShiftAssignments/Generate', {
                method: 'POST',
                body: JSON.stringify({
                    startDate: genRange.startDate,
                    endDate: genRange.endDate,
                    positionId: selectedPosition ? selectedPosition.id : null,
                }),
            });

            if (!response.ok) throw new Error((await response.text()) || 'Помилка генерації розкладу');

            const data = await response.json();
            await fetchAllData();
            setToast({
                open: true,
                message: data.message || data.Message || 'Розклад успішно згенеровано!',
                severity: 'success',
            });
        } catch (err) {
            setToast({ open: true, message: err.message, severity: 'error' });
        } finally {
            setGenerating(false);
        }
    };

    const handleValidateSchedule = async () => {
        if (!validateRange()) return;
        setValidating(true);
        try {
            const posParam = selectedPosition ? `&positionId=${selectedPosition.id}` : '';
            const response = await apiFetch(
                `/ShiftAssignments/Validate?startDate=${genRange.startDate}&endDate=${genRange.endDate}${posParam}`
            );

            if (!response.ok) throw new Error((await response.text()) || 'Не вдалося перевірити графік');

            setAuditReport(await response.json());
            setAuditDialogOpen(true);
        } catch (err) {
            setToast({ open: true, message: err.message, severity: 'error' });
        } finally {
            setValidating(false);
        }
    };

    const handleClearRange = async () => {
        setConfirmClearDialog(false);
        if (!validateRange()) return;
        setClearingRange(true);
        try {
            const posParam = selectedPosition ? `&positionId=${selectedPosition.id}` : '';
            const response = await apiFetch(
                `/ShiftAssignments/Range?startDate=${genRange.startDate}&endDate=${genRange.endDate}${posParam}`,
                { method: 'DELETE' }
            );

            if (!response.ok) throw new Error((await response.text()) || 'Помилка очищення періоду');

            const data = await response.json();
            await fetchAllData();
            setToast({
                open: true,
                message: data.message || data.Message || 'Зміни за період видалено.',
                severity: 'success',
            });
        } catch (err) {
            setToast({ open: true, message: err.message, severity: 'error' });
        } finally {
            setClearingRange(false);
        }
    };

    const handleEventDrop = async (dropInfo) => {
        if (!isAdmin) {
            dropInfo.revert();
            return;
        }

        const { id, extendedProps } = dropInfo.event;
        const newDate = dropInfo.event.startStr.slice(0, 10);
        if (!newDate || newDate === extendedProps.rawDate) return;

        try {
            const response = await apiFetch(`/ShiftAssignments/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    date: newDate,
                    employeeId: extendedProps.employeeId ? Number(extendedProps.employeeId) : null,
                    shiftTypeId: Number(extendedProps.shiftTypeId),
                }),
            });

            if (!response.ok) {
                dropInfo.revert();
                setToast({
                    open: true,
                    message: (await response.text()) || 'Не вдалося перенести зміну на цю дату.',
                    severity: 'error',
                });
                return;
            }

            const data = await response.json().catch(() => ({}));
            await fetchAllData();

            const warningMsg = data.warning || data.Warning;
            setToast({
                open: true,
                message: warningMsg || `Зміну перенесено на ${newDate}.`,
                severity: warningMsg ? 'warning' : 'success',
            });
        } catch (err) {
            dropInfo.revert();
            setToast({ open: true, message: err.message || 'Помилка перенесення зміни.', severity: 'error' });
        }
    };

    const handleQuickDeleteConfirm = async () => {
        if (!quickDeleteTarget) return;
        setSaving(true);
        try {
            const response = await apiFetch(`/ShiftAssignments/${quickDeleteTarget.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Помилка видалення зміни');
            await fetchAllData();
            setToast({ open: true, message: 'Зміну видалено.', severity: 'success' });
        } catch (err) {
            setToast({ open: true, message: err.message, severity: 'error' });
        } finally {
            setSaving(false);
            setQuickDeleteTarget(null);
        }
    };

    const handleDateClick = (arg) => {
        if (!isAdmin) return;
        const activeEmployees = employees.filter((e) => e.isActive !== false);
        const preferredEmployees = selectedPosition
            ? activeEmployees.filter((e) => e.positionId === selectedPosition.id)
            : activeEmployees;
        const preferredShifts = selectedPosition
            ? shiftTypes.filter((st) => st.positionId === selectedPosition.id)
            : shiftTypes;

        setEditingShift(null);
        setErrorMsg('');
        setFormData({
            date: arg.dateStr || getTodayStr(),
            employeeId: (preferredEmployees[0] ?? activeEmployees[0])?.id ?? '',
            shiftTypeId: (preferredShifts[0] ?? shiftTypes[0])?.id ?? '',
        });
        setDialogOpen(true);
    };

    const handleEventClick = (clickInfo) => {
        if (!isAdmin) return;
        const { id, extendedProps } = clickInfo.event;
        setEditingShift({ id });
        setErrorMsg('');
        setFormData({
            date: extendedProps.rawDate,
            employeeId: extendedProps.employeeId || '',
            shiftTypeId: extendedProps.shiftTypeId || (shiftTypes[0]?.id ?? ''),
        });
        setDialogOpen(true);
    };

    const handleSaveShift = async () => {
        if (!formData.date || !formData.shiftTypeId) {
            setErrorMsg('Оберіть дату та тип зміни.');
            return;
        }

        setSaving(true);
        setErrorMsg('');
        try {
            const response = await apiFetch(
                editingShift ? `/ShiftAssignments/${editingShift.id}` : '/ShiftAssignments/Assign',
                {
                    method: editingShift ? 'PUT' : 'POST',
                    body: JSON.stringify({
                        date: formData.date,
                        employeeId: formData.employeeId ? Number(formData.employeeId) : null,
                        shiftTypeId: Number(formData.shiftTypeId),
                    }),
                }
            );

            if (!response.ok) throw new Error((await response.text()) || 'Не вдалося зберегти зміну');

            const data = await response.json().catch(() => ({}));
            await fetchAllData();
            setDialogOpen(false);

            const warningMsg = data.warning || data.Warning;
            if (warningMsg) {
                setToast({ open: true, message: warningMsg, severity: 'warning' });
            }
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteShift = async () => {
        if (!editingShift) return;
        setSaving(true);
        try {
            const response = await apiFetch(`/ShiftAssignments/${editingShift.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Помилка видалення зміни');
            await fetchAllData();
            setDialogOpen(false);
            setToast({ open: true, message: 'Зміну видалено.', severity: 'success' });
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    const renderEventContent = (eventInfo) => {
        const {
            shiftType,
            shiftTypeShortCode,
            isUnassigned,
            rawDate,
            positionId,
            positionName,
        } = eventInfo.event.extendedProps;

        const palette = positionId ? positionColorMap[positionId] : null;
        const accentColor = isUnassigned ? '#F87171' : palette?.accent || '#38BDF8';
        const bgColor = isUnassigned ? 'rgba(248, 113, 113, 0.14)' : palette?.bg || 'rgba(56, 189, 248, 0.14)';
        const shortShiftType = shiftTypeShortCode || (shiftType ? shiftType.charAt(0).toUpperCase() : '');

        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 0.5,
                    bgcolor: bgColor,
                    borderLeft: `3.5px solid ${accentColor}`,
                    borderRadius: '4px',
                    px: 0.9,
                    py: 0.35,
                    overflow: 'hidden',
                    cursor: isAdmin ? 'grab' : 'default',
                    transition: '0.15s',
                    '&:hover .quick-delete-btn': { opacity: 1 },
                    ...(isAdmin && { '&:hover': { filter: 'brightness(1.2)' } }),
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, overflow: 'hidden', minWidth: 0 }}>
                    <Typography
                        component="span"
                        sx={{ fontSize: '0.76rem', fontWeight: 800, color: accentColor, whiteSpace: 'nowrap' }}
                    >
                        {shortShiftType}
                    </Typography>
                    <Typography
                        component="span"
                        sx={{
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            color: '#F3F3F3',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {eventInfo.event.title}
                    </Typography>
                    {selectedPositionId === 'all' && positionName && (
                        <Typography
                            component="span"
                            sx={{
                                fontSize: '0.66rem',
                                fontWeight: 600,
                                color: '#989898',
                                whiteSpace: 'nowrap',
                                display: { xs: 'none', xl: 'inline' },
                            }}
                        >
                            · {positionName}
                        </Typography>
                    )}
                </Box>

                {isAdmin && (
                    <IconButton
                        className="quick-delete-btn"
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.currentTarget.blur();
                            setQuickDeleteTarget({
                                id: eventInfo.event.id,
                                title: eventInfo.event.title,
                                date: rawDate,
                                shiftType,
                            });
                        }}
                        sx={{
                            p: 0.15,
                            opacity: 0,
                            color: '#989898',
                            transition: 'opacity 0.15s, color 0.15s',
                            '&:hover': { color: '#F87171', bgcolor: 'rgba(248, 113, 113, 0.15)' },
                        }}
                    >
                        <CloseRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                )}
            </Box>
        );
    };

    const selectableEmployees = employees.filter((emp) => {
        if (emp.id === Number(formData.employeeId)) return true;
        if (emp.isActive === false) return false;
        return selectedPosition ? emp.positionId === selectedPosition.id : true;
    });

    const selectableShiftTypes = shiftTypes.filter((st) => {
        if (st.id === Number(formData.shiftTypeId)) return true;
        return selectedPosition ? st.positionId === selectedPosition.id : true;
    });

    const effectiveDayMaxEvents = selectedPositionId !== 'all' ? false : expandAllInOverview ? false : 4;

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{ mb: 2.5 }}>
                <Typography variant="h4" sx={{ color: 'text.primary', mb: 0.5 }}>
                    Графік роботи
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {isAdmin
                        ? 'Натисніть на день для призначення, перетягніть зміну для переносу або натисніть на неї для редагування'
                        : 'Перегляд актуального розкладу змін за підрозділами'}
                </Typography>
            </Box>

            {isAdmin && (
                <ScheduleToolbar
                    genRange={genRange}
                    onChangeRange={(field, value) => setGenRange((prev) => ({ ...prev, [field]: value }))}
                    selectedPosition={selectedPosition}
                    generating={generating}
                    validating={validating}
                    clearingRange={clearingRange}
                    onGenerate={handleGenerateSchedule}
                    onValidate={handleValidateSchedule}
                    onOpenClearConfirm={() => setConfirmClearDialog(true)}
                />
            )}

            <PositionFilterBar
                positions={positions}
                counts={positionCounts}
                selectedPositionId={selectedPositionId}
                onSelectPosition={setSelectedPositionId}
                positionColorMap={positionColorMap}
                rightContent={
                    selectedPositionId === 'all' && (
                        <Button
                            size="small"
                            startIcon={expandAllInOverview ? <UnfoldLessRoundedIcon /> : <UnfoldMoreRoundedIcon />}
                            onClick={() => setExpandAllInOverview((prev) => !prev)}
                            sx={{
                                color: expandAllInOverview ? '#B4F82C' : '#989898',
                                bgcolor: '#1D1A1A',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '8px',
                                px: 1.5,
                                py: 0.5,
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                alignSelf: { xs: 'flex-start', lg: 'center' },
                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)', color: '#F3F3F3' },
                            }}
                        >
                            {expandAllInOverview ? 'Згорнути (до 4)' : 'Показати всіх у дні'}
                        </Button>
                    )
                }
            />

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 1.5, md: 3 },
                        borderRadius: '16px',
                        minHeight: '76vh',
                        '& .fc': {
                            height: effectiveDayMaxEvents === false ? 'auto !important' : '72vh',
                        },
                    }}
                >
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,dayGridWeek',
                        }}
                        buttonText={{ today: 'Сьогодні', month: 'Місяць', week: 'Тиждень' }}
                        events={filteredEvents}
                        locale="uk"
                        height={effectiveDayMaxEvents === false ? 'auto' : '72vh'}
                        eventContent={renderEventContent}
                        dateClick={isAdmin ? handleDateClick : undefined}
                        eventClick={isAdmin ? handleEventClick : undefined}
                        editable={isAdmin}
                        eventDurationEditable={false}
                        eventDrop={isAdmin ? handleEventDrop : undefined}
                        dayMaxEvents={effectiveDayMaxEvents}
                    />
                </Paper>
            )}

            <ScheduleAuditDialog
                open={auditDialogOpen}
                onClose={() => setAuditDialogOpen(false)}
                report={auditReport}
                selectedPosition={selectedPosition}
            />

            {isAdmin && (
                <>
                    <ConfirmDialog
                        open={Boolean(quickDeleteTarget)}
                        title="Видалити зміну?"
                        confirmText="Видалити"
                        loading={saving}
                        onConfirm={handleQuickDeleteConfirm}
                        onClose={() => setQuickDeleteTarget(null)}
                    >
                        Видалити зміну <strong style={{ color: '#F3F3F3' }}>{quickDeleteTarget?.shiftType}</strong> для{' '}
                        <strong style={{ color: '#F3F3F3' }}>{quickDeleteTarget?.title}</strong> на{' '}
                        <strong style={{ color: '#F3F3F3' }}>{quickDeleteTarget?.date}</strong>?
                    </ConfirmDialog>

                    <ConfirmDialog
                        open={confirmClearDialog}
                        title="Очистити розклад за період?"
                        confirmText="Очистити все"
                        onConfirm={handleClearRange}
                        onClose={() => setConfirmClearDialog(false)}
                    >
                        {selectedPosition ? (
                            <>
                                Усі зміни для посади <strong style={{ color: '#F3F3F3' }}>{selectedPosition.name}</strong> з{' '}
                                <strong style={{ color: '#F3F3F3' }}>{genRange.startDate}</strong> по{' '}
                                <strong style={{ color: '#F3F3F3' }}>{genRange.endDate}</strong> будуть видалені.
                            </>
                        ) : (
                            <>
                                Усі призначені зміни (для всіх посад) з{' '}
                                <strong style={{ color: '#F3F3F3' }}>{genRange.startDate}</strong> по{' '}
                                <strong style={{ color: '#F3F3F3' }}>{genRange.endDate}</strong> будуть видалені.
                            </>
                        )}{' '}
                        Цю дію неможливо скасувати.
                    </ConfirmDialog>

                    <ShiftFormDialog
                        open={dialogOpen}
                        onClose={() => setDialogOpen(false)}
                        editingShift={editingShift}
                        formData={formData}
                        onChangeForm={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
                        employees={selectableEmployees}
                        shiftTypes={selectableShiftTypes}
                        errorMsg={errorMsg}
                        saving={saving}
                        onSave={handleSaveShift}
                        onDelete={handleDeleteShift}
                    />
                </>
            )}

            <Snackbar
                open={toast.open}
                autoHideDuration={5500}
                onClose={() => setToast((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setToast((prev) => ({ ...prev, open: false }))}
                    severity={toast.severity}
                    variant="filled"
                    sx={{
                        borderRadius: '12px',
                        fontWeight: 600,
                        ...(toast.severity === 'success' && {
                            bgcolor: '#B4F82C',
                            color: '#181515',
                            '& .MuiAlert-icon': { color: '#181515' },
                        }),
                        ...(toast.severity === 'warning' && {
                            bgcolor: '#F59E0B',
                            color: '#181515',
                            '& .MuiAlert-icon': { color: '#181515' },
                        }),
                    }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}