import { useState, useEffect, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Box,
    Button,
    TextField,
    MenuItem,
    Stack,
    Chip,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { apiFetch } from '../api/apiClient';
import {
    POSITION_PALETTE,
    buildPositionColorMap,
    inputSx,
    primaryBtnSx,
} from '../constants/uiStyles';
import PageHeader from '../components/common/PageHeader';
import CrudFormDialog from '../components/common/CrudFormDialog';
import ToastNotification from '../components/common/ToastNotification';

const getTodayStr = () => new Date().toISOString().split('T')[0];

const quickReasons = ['Відпустка', 'Лікарняний', 'Відгул', 'Особисті обставини'];

function calculateDays(startStr, endStr) {
    if (!startStr || !endStr) return 1;
    const start = new Date(`${startStr}T00:00:00`);
    const end = new Date(`${endStr}T00:00:00`);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
}

export default function Availabilities() {
    const [availabilities, setAvailabilities] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [positions, setPositions] = useState([]);
    const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        employeeId: '',
        startDate: getTodayStr(),
        endDate: getTodayStr(),
        reason: 'Відпустка',
    });
    const [errorMsg, setErrorMsg] = useState('');
    const [saving, setSaving] = useState(false);

    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    const fetchData = async () => {
        try {
            const [availRes, empRes, posRes] = await Promise.all([
                apiFetch('/EmployeeAvailabilities'),
                apiFetch('/Employees'),
                apiFetch('/Positions'),
            ]);

            if (availRes.ok) {
                const availData = await availRes.json();
                setAvailabilities(Array.isArray(availData) ? availData : []);
            }
            if (empRes.ok) {
                const empData = await empRes.json();
                setEmployees(Array.isArray(empData) ? empData : []);
            }
            if (posRes.ok) {
                const posData = await posRes.json();
                setPositions(Array.isArray(posData) ? posData : []);
            }
        } catch (error) {
            console.error('Помилка завантаження доступності:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const positionColorMap = useMemo(() => buildPositionColorMap(positions), [positions]);

    const employeePositionIdMap = useMemo(() => {
        const map = {};
        employees.forEach((emp) => {
            map[emp.id] = emp.positionId;
        });
        return map;
    }, [employees]);

    const activeEmployees = employees.filter((e) => e.isActive !== false);

    const handleOpenCreate = () => {
        setEditingItem(null);
        setFormData({
            employeeId: activeEmployees.length > 0 ? activeEmployees[0].id : '',
            startDate: getTodayStr(),
            endDate: getTodayStr(),
            reason: 'Відпустка',
        });
        setErrorMsg('');
        setDialogOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        setFormData({
            employeeId: item.employeeId,
            startDate: item.startDate,
            endDate: item.endDate,
            reason: item.reason || '',
        });
        setErrorMsg('');
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.employeeId || !formData.startDate || !formData.endDate) {
            setErrorMsg('Оберіть працівника та період дат.');
            return;
        }
        if (formData.endDate < formData.startDate) {
            setErrorMsg('Кінцева дата не може бути ранішою за початкову.');
            return;
        }
        if (!formData.reason.trim()) {
            setErrorMsg('Вкажіть причину відсутності.');
            return;
        }

        setSaving(true);
        setErrorMsg('');
        try {
            const response = await apiFetch(
                editingItem ? `/EmployeeAvailabilities/${editingItem.id}` : '/EmployeeAvailabilities',
                {
                    method: editingItem ? 'PUT' : 'POST',
                    body: JSON.stringify({
                        employeeId: Number(formData.employeeId),
                        startDate: formData.startDate,
                        endDate: formData.endDate,
                        reason: formData.reason.trim(),
                    }),
                }
            );

            if (!response.ok) throw new Error((await response.text()) || 'Помилка збереження запису');

            const data = await response.json().catch(() => ({}));
            await fetchData();
            setDialogOpen(false);

            if (data.warning) {
                setToast({ open: true, message: data.warning, severity: 'warning' });
            } else {
                setToast({
                    open: true,
                    message: editingItem ? 'Запис відсутності оновлено.' : 'Період відсутності збережено.',
                    severity: 'success',
                });
            }
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editingItem) return;
        setSaving(true);
        setErrorMsg('');
        try {
            const response = await apiFetch(`/EmployeeAvailabilities/${editingItem.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error((await response.text()) || 'Не вдалося видалити запис');

            await fetchData();
            setDialogOpen(false);
            setToast({ open: true, message: 'Запис видалено.', severity: 'success' });
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredAvailabilities =
        selectedEmployeeFilter === 'all'
            ? availabilities
            : availabilities.filter((a) => a.employeeId === Number(selectedEmployeeFilter));

    const selectableEmployees = employees.filter(
        (emp) => emp.isActive !== false || emp.id === Number(formData.employeeId)
    );

    return (
        <Box sx={{ pb: 4 }}>
            <PageHeader
                title="Відсутність та доступність"
                subtitle="Відпустки, лікарняні та вихідні дні, які виключаються під час генерації графіка"
                action={
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
                        <TextField
                            select
                            size="small"
                            label="Фільтр за працівником"
                            value={selectedEmployeeFilter}
                            onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                            sx={{ ...inputSx, minWidth: 230 }}
                        >
                            <MenuItem value="all">Усі працівники</MenuItem>
                            {employees.map((emp) => (
                                <MenuItem key={emp.id} value={emp.id}>
                                    {[emp.lastName, emp.firstName, emp.middleName].filter(Boolean).join(' ')}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Button
                            variant="contained"
                            startIcon={<AddRoundedIcon />}
                            onClick={(e) => {
                                e.currentTarget.blur();
                                handleOpenCreate();
                            }}
                            sx={{ ...primaryBtnSx, px: 2.2, py: 1, whiteSpace: 'nowrap' }}
                        >
                            Додати запис
                        </Button>
                    </Stack>
                }
            />

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#1D1A1A' }}>
                            <TableRow>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                                    Працівник
                                </TableCell>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                                    Посада
                                </TableCell>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                                    Період відсутності
                                </TableCell>
                                <TableCell align="center" sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                                    Тривалість
                                </TableCell>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                                    Причина
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredAvailabilities.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: '#989898', borderBottom: 'none' }}>
                                        Записів про відпустки або відсутність поки немає
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAvailabilities.map((item) => {
                                    const days = item.daysCount ?? calculateDays(item.startDate, item.endDate);
                                    const periodLabel =
                                        item.startDate === item.endDate
                                            ? item.startDate
                                            : `${item.startDate} — ${item.endDate}`;
                                    const posId = employeePositionIdMap[item.employeeId];
                                    const posPalette = positionColorMap[posId] || POSITION_PALETTE[0];

                                    return (
                                        <TableRow
                                            key={item.id}
                                            onClick={() => handleOpenEdit(item)}
                                            sx={{
                                                cursor: 'pointer',
                                                transition: 'background-color 0.15s',
                                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                                                '& td': { borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
                                            }}
                                        >
                                            <TableCell sx={{ fontWeight: 600, color: '#F3F3F3' }}>
                                                {item.employeeFullName}
                                            </TableCell>
                                            <TableCell>
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        display: 'inline-block',
                                                        px: 1.5,
                                                        py: 0.75,
                                                        borderRadius: '4px',
                                                        bgcolor: posPalette.bg,
                                                        borderLeft: `4px solid ${posPalette.accent}`,
                                                        color: posPalette.accent,
                                                        fontSize: '0.82rem',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {item.positionName}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#F3F3F3' }}>
                                                {periodLabel}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        display: 'inline-block',
                                                        px: 1.5,
                                                        py: 0.65,
                                                        borderRadius: '4px',
                                                        bgcolor: 'rgba(180, 248, 44, 0.12)',
                                                        color: '#B4F82C',
                                                        fontSize: '0.82rem',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {days} дн.
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        display: 'inline-block',
                                                        px: 1.5,
                                                        py: 0.65,
                                                        borderRadius: '4px',
                                                        bgcolor: 'rgba(248, 113, 113, 0.14)',
                                                        color: '#F87171',
                                                        fontSize: '0.82rem',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {item.reason}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <CrudFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={editingItem ? 'Редагувати період відсутності' : 'Новий період відсутності'}
                isEditing={Boolean(editingItem)}
                errorMsg={errorMsg}
                saving={saving}
                onSave={handleSave}
                onDelete={handleDelete}
            >
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

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                        label="Початкова дата"
                        type="date"
                        fullWidth
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={formData.startDate}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                startDate: e.target.value,
                                endDate: prev.endDate < e.target.value ? e.target.value : prev.endDate,
                            }))
                        }
                        sx={inputSx}
                    />
                    <TextField
                        label="Кінцева дата"
                        type="date"
                        fullWidth
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={formData.endDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                        sx={inputSx}
                    />
                </Stack>

                <Box>
                    <TextField
                        label="Причина"
                        fullWidth
                        value={formData.reason}
                        onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                        sx={inputSx}
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.8 }}>
                        {quickReasons.map((preset) => (
                            <Chip
                                key={preset}
                                label={preset}
                                size="small"
                                onClick={() => setFormData((prev) => ({ ...prev, reason: preset }))}
                                sx={{
                                    bgcolor: formData.reason === preset ? 'rgba(180, 248, 44, 0.2)' : '#1D1A1A',
                                    color: formData.reason === preset ? '#B4F82C' : '#989898',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    fontWeight: 600,
                                    '&:hover': { bgcolor: 'rgba(180, 248, 44, 0.14)', color: '#B4F82C' },
                                }}
                            />
                        ))}
                    </Stack>
                </Box>
            </CrudFormDialog>

            <ToastNotification
                toast={toast}
                onClose={() => setToast((prev) => ({ ...prev, open: false }))}
                duration={5000}
            />
        </Box>
    );
}