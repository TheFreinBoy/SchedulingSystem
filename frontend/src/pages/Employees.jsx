import { useState, useEffect, useMemo } from 'react';
import {
    Typography,
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
    Stack,
    Snackbar,
    InputAdornment,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { apiFetch } from '../api/apiClient';
import {
    POSITION_PALETTE,
    buildPositionColorMap,
    inputSx,
    dialogPaperSlotProps,
    primaryBtnSx,
    dangerBtnSx,
} from '../constants/uiStyles';
import PositionFilterBar from '../components/common/PositionFilterBar';

const emptyForm = {
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    maxHoursPerWeek: 40,
    positionId: '',
    workDaysPattern: 5,
    offDaysPattern: 2,
    isActive: true,
};

export default function Employees() {
    const [employees, setEmployees] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedPositionId, setSelectedPositionId] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [formData, setFormData] = useState(emptyForm);
    const [errorMsg, setErrorMsg] = useState('');
    const [saving, setSaving] = useState(false);

    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    const fetchData = async () => {
        try {
            const [empRes, posRes] = await Promise.all([
                apiFetch('/Employees'),
                apiFetch('/Positions'),
            ]);
            const empData = await empRes.json();
            setEmployees(Array.isArray(empData) ? empData : []);

            if (posRes.ok) {
                const posData = await posRes.json();
                setPositions(Array.isArray(posData) ? posData : []);
            }
        } catch (error) {
            console.error('Помилка завантаження:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const positionColorMap = useMemo(() => buildPositionColorMap(positions), [positions]);

    const positionCounts = useMemo(() => {
        const counts = { all: employees.length };
        positions.forEach((p) => {
            counts[p.id] = 0;
        });
        employees.forEach((emp) => {
            if (emp.positionId != null && counts[emp.positionId] !== undefined) {
                counts[emp.positionId] += 1;
            }
        });
        return counts;
    }, [employees, positions]);

    const formatFullName = (emp) => {
        return [emp.lastName, emp.firstName, emp.middleName].filter(Boolean).join(' ');
    };

    const filteredEmployees = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return employees.filter((emp) => {
            if (selectedPositionId !== 'all' && emp.positionId !== Number(selectedPositionId)) {
                return false;
            }
            if (statusFilter === 'active' && emp.isActive === false) return false;
            if (statusFilter === 'archived' && emp.isActive !== false) return false;

            if (normalizedSearch) {
                const fullName = formatFullName(emp).toLowerCase();
                const email = (emp.email || '').toLowerCase();
                if (!fullName.includes(normalizedSearch) && !email.includes(normalizedSearch)) {
                    return false;
                }
            }

            return true;
        });
    }, [employees, selectedPositionId, statusFilter, searchQuery]);

    const handleOpenCreate = () => {
        setEditingEmployee(null);
        setConfirmDelete(false);
        setFormData({
            ...emptyForm,
            positionId:
                selectedPositionId !== 'all'
                    ? Number(selectedPositionId)
                    : positions.length > 0
                        ? positions[0].id
                        : '',
        });
        setErrorMsg('');
        setDialogOpen(true);
    };

    const handleOpenEdit = (emp) => {
        setEditingEmployee(emp);
        setConfirmDelete(false);
        setFormData({
            firstName: emp.firstName,
            lastName: emp.lastName,
            middleName: emp.middleName || '',
            email: emp.email,
            maxHoursPerWeek: emp.maxHoursPerWeek,
            positionId: emp.positionId || (positions[0]?.id ?? ''),
            workDaysPattern: emp.workDaysPattern,
            offDaysPattern: emp.offDaysPattern,
            isActive: emp.isActive ?? true,
        });
        setErrorMsg('');
        setDialogOpen(true);
    };

    const handleChange = (field) => (e) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleSave = async () => {
        if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.positionId) {
            setErrorMsg('Заповніть усі обов’язкові поля.');
            return;
        }

        setSaving(true);
        setErrorMsg('');

        const payload = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            middleName: formData.middleName.trim() ? formData.middleName.trim() : null,
            email: formData.email.trim(),
            maxHoursPerWeek: Number(formData.maxHoursPerWeek),
            positionId: Number(formData.positionId),
            workDaysPattern: Number(formData.workDaysPattern),
            offDaysPattern: Number(formData.offDaysPattern),
            ...(editingEmployee && { isActive: Boolean(formData.isActive) }),
        };

        try {
            const response = await apiFetch(
                editingEmployee ? `/Employees/${editingEmployee.id}` : '/Employees',
                {
                    method: editingEmployee ? 'PUT' : 'POST',
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) throw new Error((await response.text()) || 'Помилка збереження працівника');

            await fetchData();
            setDialogOpen(false);
            setToast({
                open: true,
                message: editingEmployee ? 'Дані працівника оновлено.' : 'Працівника додано.',
                severity: 'success',
            });
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editingEmployee) return;
        setSaving(true);
        setErrorMsg('');
        try {
            const response = await apiFetch(`/Employees/${editingEmployee.id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.text()) || 'Не вдалося видалити працівника.');
            const data = await response.json().catch(() => ({}));
            await fetchData();
            setDialogOpen(false);
            setToast({
                open: true,
                message: data.message || data.Message || 'Працівника видалено.',
                severity: 'success',
            });
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
            setConfirmDelete(false);
        }
    };

    return (
        <Box sx={{ pb: 4 }}>
            <Box
                sx={{
                    mb: 2.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                }}
            >
                <Box>
                    <Typography variant="h4" sx={{ color: 'text.primary', mb: 0.5 }}>
                        Працівники
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Натисніть на рядок працівника, щоб змінити дані або перевести в архів
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    onClick={(e) => {
                        e.currentTarget.blur();
                        handleOpenCreate();
                    }}
                    sx={{ ...primaryBtnSx, px: 2.2, py: 1 }}
                >
                    Додати працівника
                </Button>
            </Box>

            <PositionFilterBar
                positions={positions}
                counts={positionCounts}
                selectedPositionId={selectedPositionId}
                onSelectPosition={setSelectedPositionId}
                positionColorMap={positionColorMap}
                rightContent={
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ alignItems: 'center' }}>
                        <TextField
                            size="small"
                            placeholder="Пошук за ПІБ або Email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchRoundedIcon sx={{ color: '#989898', fontSize: 19 }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                            sx={{ ...inputSx, minWidth: { xs: '100%', sm: 220 } }}
                        />

                        <TextField
                            select
                            size="small"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            sx={{ ...inputSx, minWidth: { xs: '100%', sm: 145 } }}
                        >
                            <MenuItem value="all">Усі статуси</MenuItem>
                            <MenuItem value="active">Активні</MenuItem>
                            <MenuItem value="archived">Архівні</MenuItem>
                        </TextField>
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
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>ID</TableCell>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>ПІБ працівника</TableCell>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Посада</TableCell>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Email</TableCell>
                                <TableCell align="center" sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Години (тиждень)</TableCell>
                                <TableCell align="center" sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Графік</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredEmployees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: '#989898', borderBottom: 'none' }}>
                                        Працівників за вибраними фільтрами не знайдено
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEmployees.map((emp) => {
                                    const isArchived = emp.isActive === false;
                                    const currentHours = emp.currentWeekHours ?? 0;
                                    const isOvertime = currentHours > emp.maxHoursPerWeek;
                                    const posPalette = positionColorMap[emp.positionId] || POSITION_PALETTE[0];

                                    return (
                                        <TableRow
                                            key={emp.id}
                                            onClick={() => handleOpenEdit(emp)}
                                            sx={{
                                                cursor: 'pointer',
                                                opacity: isArchived ? 0.55 : 1,
                                                transition: 'background-color 0.15s',
                                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                                                '& td': { borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
                                            }}
                                        >
                                            <TableCell sx={{ color: '#989898', fontWeight: 600 }}>#{emp.id}</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#F3F3F3' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                    <span>{formatFullName(emp)}</span>
                                                    {isArchived && (
                                                        <Box
                                                            component="span"
                                                            sx={{
                                                                px: 1,
                                                                py: 0.25,
                                                                borderRadius: '4px',
                                                                bgcolor: 'rgba(248, 113, 113, 0.14)',
                                                                color: '#F87171',
                                                                fontSize: '0.72rem',
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            Архів
                                                        </Box>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        display: 'inline-block',
                                                        px: 1.5,
                                                        py: 0.9,
                                                        borderRadius: '4px',
                                                        bgcolor: posPalette.bg,
                                                        borderLeft: `4px solid ${posPalette.accent}`,
                                                        color: posPalette.accent,
                                                        fontSize: '0.85rem',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {emp.positionName}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ color: '#989898' }}>{emp.email}</TableCell>
                                            <TableCell align="center">
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        display: 'inline-block',
                                                        px: 1.5,
                                                        py: 0.65,
                                                        borderRadius: '4px',
                                                        bgcolor: isOvertime
                                                            ? 'rgba(248, 113, 113, 0.14)'
                                                            : 'rgba(255, 255, 255, 0.06)',
                                                        color: isOvertime ? '#F87171' : '#F3F3F3',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {currentHours} / {emp.maxHoursPerWeek} год
                                                </Box>
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
                                                        fontSize: '0.85rem',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {emp.workDaysPattern} / {emp.offDaysPattern}
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

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth slotProps={dialogPaperSlotProps}>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    {editingEmployee ? 'Редагувати працівника' : 'Новий працівник'}
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
                    {errorMsg && (
                        <Alert severity="error" sx={{ borderRadius: '10px' }}>
                            {errorMsg}
                        </Alert>
                    )}

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField label="Прізвище" fullWidth value={formData.lastName} onChange={handleChange('lastName')} sx={inputSx} />
                        <TextField label="Ім'я" fullWidth value={formData.firstName} onChange={handleChange('firstName')} sx={inputSx} />
                        <TextField label="По батькові" fullWidth value={formData.middleName} onChange={handleChange('middleName')} sx={inputSx} />
                    </Stack>

                    <TextField label="Email" type="email" fullWidth value={formData.email} onChange={handleChange('email')} sx={inputSx} />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField select label="Посада" fullWidth value={formData.positionId} onChange={handleChange('positionId')} sx={inputSx}>
                            {positions.map((pos) => (
                                <MenuItem key={pos.id} value={pos.id}>
                                    {pos.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        {editingEmployee && (
                            <TextField
                                select
                                label="Статус"
                                fullWidth
                                value={formData.isActive ? 'true' : 'false'}
                                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.value === 'true' }))}
                                sx={inputSx}
                            >
                                <MenuItem value="true">Активний</MenuItem>
                                <MenuItem value="false">Архівний (неактивний)</MenuItem>
                            </TextField>
                        )}
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField label="Макс. годин / тиждень" type="number" fullWidth value={formData.maxHoursPerWeek} onChange={handleChange('maxHoursPerWeek')} sx={inputSx} />
                        <TextField label="Робочих днів" type="number" fullWidth value={formData.workDaysPattern} onChange={handleChange('workDaysPattern')} sx={inputSx} />
                        <TextField label="Вихідних днів" type="number" fullWidth value={formData.offDaysPattern} onChange={handleChange('offDaysPattern')} sx={inputSx} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
                    {editingEmployee ? (
                        confirmDelete ? (
                            <Button variant="contained" onClick={handleDelete} disabled={saving} sx={dangerBtnSx}>
                                Підтвердити видалення
                            </Button>
                        ) : (
                            <Button startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setConfirmDelete(true)} sx={{ color: '#F87171' }}>
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
                        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ ...primaryBtnSx, px: 3 }}>
                            {saving ? 'Збереження...' : 'Зберегти'}
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={toast.open}
                autoHideDuration={4500}
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
                    }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}