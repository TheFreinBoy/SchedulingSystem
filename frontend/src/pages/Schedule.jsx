import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
    Typography,
    Paper,
    Box,
    CircularProgress,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
    Stack,
    Snackbar,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/apiClient';

const getTodayStr = () => new Date().toISOString().split('T')[0];

const getPlusDaysStr = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

export default function Schedule() {
    const { isAdmin } = useAuth();

    const [events, setEvents] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [shiftTypes, setShiftTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Стан панелі автоматичної генерації / очищення
    const [genRange, setGenRange] = useState({
        startDate: getTodayStr(),
        endDate: getPlusDaysStr(7),
    });
    const [generating, setGenerating] = useState(false);
    const [clearingRange, setClearingRange] = useState(false);
    const [confirmClearDialog, setConfirmClearDialog] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    // Швидке видалення з плашки календаря
    const [quickDeleteTarget, setQuickDeleteTarget] = useState(null);

    // Стан модального вікна призначення / редагування
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingShift, setEditingShift] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [formData, setFormData] = useState({
        date: '',
        employeeId: '',
        shiftTypeId: '',
    });
    const [errorMsg, setErrorMsg] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchAllData = async () => {
        try {
            const requests = [apiFetch('/ShiftAssignments')];
            if (isAdmin) {
                requests.push(apiFetch('/Employees'), apiFetch('/ShiftTypes'));
            }

            const [schedRes, empRes, typesRes] = await Promise.all(requests);

            const schedData = await schedRes.json();
            if (Array.isArray(schedData)) {
                const formattedEvents = schedData.map((shift) => {
                    const isUnassigned = shift.status === 'Unassigned';
                    return {
                        id: String(shift.id),
                        title: isUnassigned ? 'Непризначено' : shift.employeeFullName,
                        start: shift.date,
                        allDay: true,
                        extendedProps: {
                            shiftType: shift.shiftTypeName,
                            shiftTypeShortCode: shift.shiftTypeShortCode,
                            isUnassigned,
                            employeeId: shift.employeeId,
                            shiftTypeId: shift.shiftTypeId,
                            rawDate: shift.date,
                        },
                    };
                });
                setEvents(formattedEvents);
            }

            if (isAdmin && empRes?.ok) {
                const empData = await empRes.json();
                setEmployees(Array.isArray(empData) ? empData : []);
            }

            if (isAdmin && typesRes?.ok) {
                const typesData = await typesRes.json();
                setShiftTypes(Array.isArray(typesData) ? typesData : []);
            }
        } catch (error) {
            console.error('Помилка завантаження даних:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [isAdmin]);

    const handleGenerateSchedule = async () => {
        if (!genRange.startDate || !genRange.endDate) {
            setToast({ open: true, message: 'Вкажіть початкову та кінцеву дати.', severity: 'error' });
            return;
        }

        if (genRange.startDate > genRange.endDate) {
            setToast({ open: true, message: 'Початкова дата не може бути пізнішою за кінцеву.', severity: 'error' });
            return;
        }

        setGenerating(true);
        try {
            const response = await apiFetch('/ShiftAssignments/Generate', {
                method: 'POST',
                body: JSON.stringify({
                    startDate: genRange.startDate,
                    endDate: genRange.endDate,
                }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Помилка генерації розкладу');
            }

            const data = await response.json();
            await fetchAllData();

            setToast({
                open: true,
                message: data.message || data.Message || 'Розклад успішно згенеровано!',
                severity: 'success',
            });
        } catch (err) {
            setToast({
                open: true,
                message: err.message || 'Не вдалося згенерувати розклад',
                severity: 'error',
            });
        } finally {
            setGenerating(false);
        }
    };

    const handleClearRange = async () => {
        setConfirmClearDialog(false);
        if (!genRange.startDate || !genRange.endDate || genRange.startDate > genRange.endDate) {
            setToast({ open: true, message: 'Вкажіть коректний діапазон дат.', severity: 'error' });
            return;
        }

        setClearingRange(true);
        try {
            const query = `?startDate=${genRange.startDate}&endDate=${genRange.endDate}`;
            const response = await apiFetch(`/ShiftAssignments/Range${query}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Помилка очищення періоду');
            }

            const data = await response.json();
            await fetchAllData();

            setToast({
                open: true,
                message: data.message || data.Message || 'Зміни за період видалено.',
                severity: 'success',
            });
        } catch (err) {
            setToast({
                open: true,
                message: err.message || 'Не вдалося видалити зміни',
                severity: 'error',
            });
        } finally {
            setClearingRange(false);
        }
    };

    const handleQuickDeleteConfirm = async () => {
        if (!quickDeleteTarget) return;
        setSaving(true);
        try {
            const response = await apiFetch(`/ShiftAssignments/${quickDeleteTarget.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Помилка видалення зміни');
            }
            await fetchAllData();
            setToast({ open: true, message: 'Зміну видалено.', severity: 'success' });
        } catch (err) {
            setToast({ open: true, message: err.message, severity: 'error' });
        } finally {
            setSaving(false);
            setQuickDeleteTarget(null);
        }
    };

    const openCreateModal = (selectedDate = '') => {
        if (!isAdmin) return;
        const activeEmployees = employees.filter((e) => e.isActive !== false);
        setEditingShift(null);
        setConfirmDelete(false);
        setErrorMsg('');
        setFormData({
            date: selectedDate || getTodayStr(),
            employeeId: activeEmployees.length > 0 ? activeEmployees[0].id : '',
            shiftTypeId: shiftTypes.length > 0 ? shiftTypes[0].id : '',
        });
        setDialogOpen(true);
    };

    const handleDateClick = (arg) => {
        if (!isAdmin) return;
        openCreateModal(arg.dateStr);
    };

    const handleEventClick = (clickInfo) => {
        if (!isAdmin) return;
        const { id, extendedProps } = clickInfo.event;
        const activeEmployees = employees.filter((e) => e.isActive !== false);
        setEditingShift({ id });
        setConfirmDelete(false);
        setErrorMsg('');
        setFormData({
            date: extendedProps.rawDate,
            employeeId: extendedProps.employeeId || (activeEmployees[0]?.id ?? ''),
            shiftTypeId: extendedProps.shiftTypeId || (shiftTypes[0]?.id ?? ''),
        });
        setDialogOpen(true);
    };

    const handleSaveShift = async () => {
        if (!formData.date || !formData.employeeId || !formData.shiftTypeId) {
            setErrorMsg('Оберіть дату, працівника та тип зміни.');
            return;
        }

        setSaving(true);
        setErrorMsg('');

        const payload = {
            date: formData.date,
            employeeId: Number(formData.employeeId),
            shiftTypeId: Number(formData.shiftTypeId),
        };

        try {
            const endpoint = editingShift
                ? `/ShiftAssignments/${editingShift.id}`
                : '/ShiftAssignments/Assign';
            const method = editingShift ? 'PUT' : 'POST';

            const response = await apiFetch(endpoint, {
                method,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Не вдалося зберегти зміну');
            }

            const data = await response.json().catch(() => ({}));
            await fetchAllData();
            setDialogOpen(false);

            const warningMsg = data.warning || data.Warning;
            if (warningMsg) {
                setToast({
                    open: true,
                    message: warningMsg,
                    severity: 'warning',
                });
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
            if (!response.ok) {
                throw new Error('Помилка видалення зміни');
            }
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
        const { shiftType, shiftTypeShortCode, isUnassigned, rawDate } = eventInfo.event.extendedProps;
        const accentColor = isUnassigned ? '#F87171' : '#38BDF8';
        const bgColor = isUnassigned ? 'rgba(248, 113, 113, 0.14)' : 'rgba(56, 189, 248, 0.14)';
        const shortShiftType = shiftTypeShortCode || (shiftType ? shiftType.charAt(0).toUpperCase() : '');

        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 0.8,
                    bgcolor: bgColor,
                    borderLeft: `4px solid ${accentColor}`,
                    borderRadius: '4px',
                    px: 1.2,
                    py: 0.65,
                    overflow: 'hidden',
                    cursor: isAdmin ? 'pointer' : 'default',
                    transition: '0.15s',
                    '&:hover .quick-delete-btn': {
                        opacity: 1,
                    },
                    ...(isAdmin && {
                        '&:hover': { filter: 'brightness(1.2)' },
                    }),
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, overflow: 'hidden' }}>
                    <Typography
                        component="span"
                        sx={{
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            color: accentColor,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {shortShiftType}
                    </Typography>
                    <Typography
                        component="span"
                        sx={{
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: '#F3F3F3',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {eventInfo.event.title}
                    </Typography>
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
                            p: 0.2,
                            opacity: 0,
                            color: '#989898',
                            transition: 'opacity 0.15s, color 0.15s',
                            '&:hover': {
                                color: '#F87171',
                                bgcolor: 'rgba(248, 113, 113, 0.15)',
                            },
                        }}
                    >
                        <CloseRoundedIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                )}
            </Box>
        );
    };

    const selectableEmployees = employees.filter(
        (emp) => emp.isActive !== false || emp.id === Number(formData.employeeId)
    );

    const inputSx = {
        '& .MuiOutlinedInput-root': {
            bgcolor: '#1D1A1A',
            borderRadius: '10px',
            colorScheme: 'dark',
            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' },
            '&.Mui-focused fieldset': { borderColor: '#B4F82C' },
        },
        '& .MuiInputLabel-root.Mui-focused': { color: '#B4F82C' },
    };

    const dialogPaperSlotProps = {
        paper: {
            sx: {
                bgcolor: '#222222',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
            },
        },
    };

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ color: 'text.primary', mb: 0.5 }}>
                    Графік роботи
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {isAdmin
                        ? 'Натисніть на день для призначення, на зміну для редагування або на хрестик для видалення'
                        : 'Перегляд актуального розкладу змін'}
                </Typography>
            </Box>

            {isAdmin && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 2.5,
                        mb: 2.5,
                        borderRadius: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: { xs: 'stretch', lg: 'center' },
                        flexDirection: { xs: 'column', lg: 'row' },
                        gap: 2,
                    }}
                >
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#F3F3F3' }}>
                            Керування розкладом за період
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Автоматичний розподіл персоналу або очищення змін у вибраному діапазоні
                        </Typography>
                    </Box>

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.5}
                        sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
                    >
                        <TextField
                            label="Початкова дата"
                            type="date"
                            size="small"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={genRange.startDate}
                            onChange={(e) => setGenRange((prev) => ({ ...prev, startDate: e.target.value }))}
                            sx={{ ...inputSx, minWidth: 165 }}
                        />
                        <TextField
                            label="Кінцева дата"
                            type="date"
                            size="small"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={genRange.endDate}
                            onChange={(e) => setGenRange((prev) => ({ ...prev, endDate: e.target.value }))}
                            sx={{ ...inputSx, minWidth: 165 }}
                        />
                        <Button
                            variant="contained"
                            startIcon={
                                generating ? (
                                    <CircularProgress size={18} sx={{ color: '#181515' }} />
                                ) : (
                                    <AutoAwesomeRoundedIcon />
                                )
                            }
                            onClick={handleGenerateSchedule}
                            disabled={generating || clearingRange}
                            sx={{
                                bgcolor: '#B4F82C',
                                color: '#181515',
                                fontWeight: 700,
                                px: 2.5,
                                py: 1,
                                borderRadius: '10px',
                                whiteSpace: 'nowrap',
                                '&:hover': { bgcolor: '#a3e61e' },
                                '&.Mui-disabled': {
                                    bgcolor: 'rgba(180, 248, 44, 0.35)',
                                    color: '#181515',
                                },
                            }}
                        >
                            {generating ? 'Генерація...' : 'Згенерувати'}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={
                                clearingRange ? (
                                    <CircularProgress size={18} sx={{ color: '#F87171' }} />
                                ) : (
                                    <DeleteSweepRoundedIcon />
                                )
                            }
                            onClick={(e) => {
                                e.currentTarget.blur();
                                setConfirmClearDialog(true);
                            }}
                            disabled={generating || clearingRange}
                            sx={{
                                borderColor: 'rgba(248, 113, 113, 0.4)',
                                color: '#F87171',
                                fontWeight: 700,
                                px: 2,
                                py: 0.9,
                                borderRadius: '10px',
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                    borderColor: '#F87171',
                                    bgcolor: 'rgba(248, 113, 113, 0.1)',
                                },
                            }}
                        >
                            {clearingRange ? 'Очищення...' : 'Очистити'}
                        </Button>
                    </Stack>
                </Paper>
            )}

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
                        height: '78vh',
                    }}
                >
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek',
                        }}
                        buttonText={{
                            today: 'Сьогодні',
                            month: 'Місяць',
                            week: 'Тиждень',
                        }}
                        events={events}
                        locale="uk"
                        height="100%"
                        eventContent={renderEventContent}
                        dateClick={isAdmin ? handleDateClick : undefined}
                        eventClick={isAdmin ? handleEventClick : undefined}
                        dayMaxEvents={3}
                    />
                </Paper>
            )}

            {/* Підтвердження швидкого видалення однієї зміни з плашки */}
            {isAdmin && (
                <Dialog
                    open={Boolean(quickDeleteTarget)}
                    onClose={() => setQuickDeleteTarget(null)}
                    slotProps={dialogPaperSlotProps}
                >
                    <DialogTitle sx={{ fontWeight: 700 }}>Видалити зміну?</DialogTitle>
                    <DialogContent>
                        <Typography color="text.secondary">
                            Видалити зміну <strong style={{ color: '#F3F3F3' }}>{quickDeleteTarget?.shiftType}</strong> для{' '}
                            <strong style={{ color: '#F3F3F3' }}>{quickDeleteTarget?.title}</strong> на{' '}
                            <strong style={{ color: '#F3F3F3' }}>{quickDeleteTarget?.date}</strong>?
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setQuickDeleteTarget(null)} sx={{ color: '#989898' }}>
                            Скасувати
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleQuickDeleteConfirm}
                            disabled={saving}
                            sx={{
                                bgcolor: '#F87171',
                                color: '#181515',
                                fontWeight: 700,
                                '&:hover': { bgcolor: '#ef4444' },
                            }}
                        >
                            Видалити
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Підтвердження очищення періоду */}
            {isAdmin && (
                <Dialog
                    open={confirmClearDialog}
                    onClose={() => setConfirmClearDialog(false)}
                    slotProps={dialogPaperSlotProps}
                >
                    <DialogTitle sx={{ fontWeight: 700 }}>Очистити розклад за період?</DialogTitle>
                    <DialogContent>
                        <Typography color="text.secondary">
                            Усі призначені зміни з <strong style={{ color: '#F3F3F3' }}>{genRange.startDate}</strong> по{' '}
                            <strong style={{ color: '#F3F3F3' }}>{genRange.endDate}</strong> будуть видалені. Цю дію
                            неможливо скасувати.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setConfirmClearDialog(false)} sx={{ color: '#989898' }}>
                            Скасувати
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleClearRange}
                            sx={{
                                bgcolor: '#F87171',
                                color: '#181515',
                                fontWeight: 700,
                                '&:hover': { bgcolor: '#ef4444' },
                            }}
                        >
                            Очистити все
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Модальне вікно призначення / редагування / видалення зміни */}
            {isAdmin && (
                <Dialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    maxWidth="xs"
                    fullWidth
                    slotProps={dialogPaperSlotProps}
                >
                    <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                        {editingShift ? 'Редагувати зміну' : 'Призначити зміну'}
                    </DialogTitle>

                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
                        {errorMsg && (
                            <Alert severity="error" sx={{ borderRadius: '10px' }}>
                                {errorMsg}
                            </Alert>
                        )}

                        <TextField
                            label="Дата"
                            type="date"
                            fullWidth
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={formData.date}
                            onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                            sx={inputSx}
                        />

                        <TextField
                            select
                            label="Працівник"
                            fullWidth
                            value={formData.employeeId}
                            onChange={(e) => setFormData((prev) => ({ ...prev, employeeId: e.target.value }))}
                            sx={inputSx}
                        >
                            {selectableEmployees.map((emp) => (
                                <MenuItem key={emp.id} value={emp.id}>
                                    {[emp.lastName, emp.firstName, emp.middleName].filter(Boolean).join(' ')} ({emp.positionName})
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Тип зміни"
                            fullWidth
                            value={formData.shiftTypeId}
                            onChange={(e) => setFormData((prev) => ({ ...prev, shiftTypeId: e.target.value }))}
                            sx={inputSx}
                        >
                            {shiftTypes.map((st) => (
                                <MenuItem key={st.id} value={st.id}>
                                    [{st.shortCode || st.name.charAt(0).toUpperCase()}] {st.name} ({st.startTime?.slice(0, 5)} – {st.endTime?.slice(0, 5)})
                                </MenuItem>
                            ))}
                        </TextField>
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
                        {editingShift ? (
                            confirmDelete ? (
                                <Button
                                    variant="contained"
                                    onClick={handleDeleteShift}
                                    disabled={saving}
                                    sx={{
                                        bgcolor: '#F87171',
                                        color: '#181515',
                                        fontWeight: 700,
                                        '&:hover': { bgcolor: '#ef4444' },
                                    }}
                                >
                                    Підтвердити видалення
                                </Button>
                            ) : (
                                <Button
                                    startIcon={<DeleteOutlineRoundedIcon />}
                                    onClick={() => setConfirmDelete(true)}
                                    sx={{ color: '#F87171' }}
                                >
                                    Видалити
                                </Button>
                            )
                        ) : (
                            <Box />
                        )}

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button onClick={() => setDialogOpen(false)} sx={{ color: '#989898' }}>
                                Скасувати
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSaveShift}
                                disabled={saving}
                                sx={{
                                    bgcolor: '#B4F82C',
                                    color: '#181515',
                                    fontWeight: 700,
                                    px: 2.5,
                                    '&:hover': { bgcolor: '#a3e61e' },
                                }}
                            >
                                {saving ? 'Збереження...' : 'Зберегти'}
                            </Button>
                        </Box>
                    </DialogActions>
                </Dialog>
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