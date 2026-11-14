import { useState, useEffect } from 'react';
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
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
    Stack,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { apiFetch } from '../api/apiClient';

const emptyForm = {
    name: '',
    shortCode: '',
    startTime: '08:00',
    endTime: '16:00',
    requiredStaffCount: 1,
    positionId: '',
};

function calculateDuration(start, end) {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    const diff = endMins >= startMins ? endMins - startMins : 24 * 60 - startMins + endMins;
    return Number((diff / 60).toFixed(1));
}

export default function ShiftTypes() {
    const [shiftTypes, setShiftTypes] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingShiftType, setEditingShiftType] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [errorMsg, setErrorMsg] = useState('');
    const [saving, setSaving] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchData = async () => {
        try {
            const [typesRes, posRes] = await Promise.all([
                apiFetch('/ShiftTypes'),
                apiFetch('/Positions'),
            ]);
            const typesData = await typesRes.json();
            setShiftTypes(Array.isArray(typesData) ? typesData : []);

            if (posRes.ok) {
                const posData = await posRes.json();
                setPositions(Array.isArray(posData) ? posData : []);
            }
        } catch (error) {
            console.error('Помилка завантаження типів змін:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenCreate = () => {
        setEditingShiftType(null);
        setFormData({
            ...emptyForm,
            positionId: positions.length > 0 ? positions[0].id : '',
        });
        setErrorMsg('');
        setDialogOpen(true);
    };

    const handleOpenEdit = (st) => {
        setEditingShiftType(st);
        setFormData({
            name: st.name,
            shortCode: st.shortCode || st.name.charAt(0).toUpperCase(),
            startTime: st.startTime?.slice(0, 5) || '08:00',
            endTime: st.endTime?.slice(0, 5) || '16:00',
            requiredStaffCount: st.requiredStaffCount,
            positionId: st.positionId || (positions[0]?.id ?? ''),
        });
        setErrorMsg('');
        setDialogOpen(true);
    };

    const handleNameChange = (e) => {
        const val = e.target.value;
        setFormData((prev) => ({
            ...prev,
            name: val,
            shortCode: !editingShiftType && val.trim().length > 0
                ? val.trim().charAt(0).toUpperCase()
                : prev.shortCode,
        }));
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.shortCode.trim() || !formData.positionId) {
            setErrorMsg('Заповніть назву, код зміни та посаду.');
            return;
        }

        setSaving(true);
        setErrorMsg('');

        const formatTime = (t) => (t.length === 5 ? `${t}:00` : t);

        const payload = {
            name: formData.name.trim(),
            shortCode: formData.shortCode.trim().toUpperCase(),
            startTime: formatTime(formData.startTime),
            endTime: formatTime(formData.endTime),
            requiredStaffCount: Number(formData.requiredStaffCount),
            positionId: Number(formData.positionId),
        };

        try {
            const endpoint = editingShiftType
                ? `/ShiftTypes/${editingShiftType.id}`
                : '/ShiftTypes';
            const method = editingShiftType ? 'PUT' : 'POST';

            const response = await apiFetch(endpoint, {
                method,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Помилка збереження типу зміни');
            }

            await fetchData();
            setDialogOpen(false);
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setErrorMsg('');
        try {
            const response = await apiFetch(`/ShiftTypes/${deleteTarget.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const text = await response.text();
                alert(text || 'Не вдалося видалити тип зміни');
            } else {
                setShiftTypes((prev) => prev.filter((st) => st.id !== deleteTarget.id));
            }
        } catch (error) {
            console.error('Помилка видалення:', error);
        } finally {
            setDeleteTarget(null);
        }
    };

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
            <Box
                sx={{
                    mb: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                }}
            >
                <Box>
                    <Typography variant="h4" sx={{ color: 'text.primary', mb: 0.5 }}>
                        Типи змін
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Налаштування графіків змін, тривалості та необхідної кількості персоналу
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    onClick={(e) => {
                        e.currentTarget.blur();
                        handleOpenCreate();
                    }}
                    sx={{
                        bgcolor: '#B4F82C',
                        color: '#181515',
                        fontWeight: 700,
                        px: 2.2,
                        py: 1,
                        borderRadius: '10px',
                        '&:hover': { bgcolor: '#a3e61e' },
                    }}
                >
                    Додати тип зміни
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#1D1A1A' }}>
                            <TableRow>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Код</TableCell>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Назва зміни</TableCell>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Посада</TableCell>
                                <TableCell align="center" sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Час зміни</TableCell>
                                <TableCell align="center" sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Тривалість</TableCell>
                                <TableCell align="center" sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Потрібно людей</TableCell>
                                <TableCell align="right" sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Дії</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {shiftTypes.map((st) => {
                                const start = st.startTime?.slice(0, 5);
                                const end = st.endTime?.slice(0, 5);
                                const hours = calculateDuration(start, end);

                                return (
                                    <TableRow
                                        key={st.id}
                                        sx={{
                                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' },
                                            '& td': { borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
                                        }}
                                    >
                                        <TableCell>
                                            <Box
                                                component="span"
                                                sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    minWidth: 32,
                                                    px: 1,
                                                    py: 0.6,
                                                    borderRadius: '4px',
                                                    bgcolor: 'rgba(56, 189, 248, 0.14)',
                                                    borderLeft: '4px solid #38BDF8',
                                                    color: '#38BDF8',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 800,
                                                }}
                                            >
                                                {st.shortCode || st.name.charAt(0).toUpperCase()}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#F3F3F3' }}>
                                            {st.name}
                                        </TableCell>
                                        <TableCell>
                                            <Box
                                                component="span"
                                                sx={{
                                                    display: 'inline-block',
                                                    px: 1.5,
                                                    py: 0.8,
                                                    borderRadius: '4px',
                                                    bgcolor: 'rgba(56, 189, 248, 0.14)',
                                                    borderLeft: '4px solid #38BDF8',
                                                    color: '#38BDF8',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {st.positionName}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#F3F3F3' }}>
                                            {start} – {end}
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
                                                {hours} год
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#989898' }}>
                                            {st.requiredStaffCount} ос.
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.currentTarget.blur();
                                                        handleOpenEdit(st);
                                                    }}
                                                    sx={{
                                                        color: '#989898',
                                                        '&:hover': { color: '#B4F82C', bgcolor: 'rgba(180, 248, 44, 0.1)' },
                                                    }}
                                                >
                                                    <EditRoundedIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.currentTarget.blur();
                                                        setDeleteTarget(st);
                                                    }}
                                                    sx={{
                                                        color: '#989898',
                                                        '&:hover': { color: '#F87171', bgcolor: 'rgba(248, 113, 113, 0.1)' },
                                                    }}
                                                >
                                                    <DeleteOutlineRoundedIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                slotProps={dialogPaperSlotProps}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    {editingShiftType ? 'Редагувати тип зміни' : 'Новий тип зміни'}
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
                    {errorMsg && (
                        <Alert severity="error" sx={{ borderRadius: '10px' }}>
                            {errorMsg}
                        </Alert>
                    )}

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Назва (напр. Денна)"
                            fullWidth
                            value={formData.name}
                            onChange={handleNameChange}
                            sx={inputSx}
                        />
                        <TextField
                            label="Код у календарі"
                            value={formData.shortCode}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    shortCode: e.target.value.slice(0, 3).toUpperCase(),
                                }))
                            }
                            sx={{ ...inputSx, minWidth: { sm: 150 } }}
                        />
                    </Stack>

                    <TextField
                        select
                        label="Посада"
                        fullWidth
                        value={formData.positionId}
                        onChange={(e) => setFormData((prev) => ({ ...prev, positionId: e.target.value }))}
                        sx={inputSx}
                    >
                        {positions.map((pos) => (
                            <MenuItem key={pos.id} value={pos.id}>
                                {pos.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Початок зміни"
                            type="time"
                            fullWidth
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={formData.startTime}
                            onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                            sx={inputSx}
                        />
                        <TextField
                            label="Кінець зміни"
                            type="time"
                            fullWidth
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={formData.endTime}
                            onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                            sx={inputSx}
                        />
                        <TextField
                            label="Потрібно персоналу"
                            type="number"
                            fullWidth
                            value={formData.requiredStaffCount}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, requiredStaffCount: e.target.value }))
                            }
                            sx={inputSx}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ color: '#989898' }}>
                        Скасувати
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                        sx={{
                            bgcolor: '#B4F82C',
                            color: '#181515',
                            fontWeight: 700,
                            px: 3,
                            '&:hover': { bgcolor: '#a3e61e' },
                        }}
                    >
                        {saving ? 'Збереження...' : 'Зберегти'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                slotProps={dialogPaperSlotProps}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Видалити тип зміни?</DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary">
                        Ви дійсно хочете видалити тип зміни{' '}
                        <strong style={{ color: '#F3F3F3' }}>{deleteTarget?.name}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteTarget(null)} sx={{ color: '#989898' }}>
                        Скасувати
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleDelete}
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
        </Box>
    );
}