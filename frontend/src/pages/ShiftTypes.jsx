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

    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

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

    const positionColorMap = useMemo(() => buildPositionColorMap(positions), [positions]);

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
            shortCode:
                !editingShiftType && val.trim().length > 0
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

        try {
            const response = await apiFetch(
                editingShiftType ? `/ShiftTypes/${editingShiftType.id}` : '/ShiftTypes',
                {
                    method: editingShiftType ? 'PUT' : 'POST',
                    body: JSON.stringify({
                        name: formData.name.trim(),
                        shortCode: formData.shortCode.trim().toUpperCase(),
                        startTime: formatTime(formData.startTime),
                        endTime: formatTime(formData.endTime),
                        requiredStaffCount: Number(formData.requiredStaffCount),
                        positionId: Number(formData.positionId),
                    }),
                }
            );

            if (!response.ok) throw new Error((await response.text()) || 'Помилка збереження типу зміни');

            await fetchData();
            setDialogOpen(false);
            setToast({
                open: true,
                message: editingShiftType ? 'Тип зміни оновлено.' : 'Тип зміни створено.',
                severity: 'success',
            });
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editingShiftType) return;
        setSaving(true);
        setErrorMsg('');
        try {
            const response = await apiFetch(`/ShiftTypes/${editingShiftType.id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.text()) || 'Не вдалося видалити тип зміни');

            await fetchData();
            setDialogOpen(false);
            setToast({ open: true, message: 'Тип зміни видалено.', severity: 'success' });
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ pb: 4 }}>
            <PageHeader
                title="Типи змін"
                subtitle="Натисніть на рядок зміни, щоб змінити параметри або видалити її"
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddRoundedIcon />}
                        onClick={(e) => {
                            e.currentTarget.blur();
                            handleOpenCreate();
                        }}
                        sx={{ ...primaryBtnSx, px: 2.2, py: 1 }}
                    >
                        Додати тип зміни
                    </Button>
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
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Код</TableCell>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Назва зміни</TableCell>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Посада</TableCell>
                                <TableCell align="center" sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Час зміни</TableCell>
                                <TableCell align="center" sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Тривалість</TableCell>
                                <TableCell align="center" sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Потрібно людей</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {shiftTypes.map((st) => {
                                const start = st.startTime?.slice(0, 5);
                                const end = st.endTime?.slice(0, 5);
                                const hours = calculateDuration(start, end);
                                const posPalette = positionColorMap[st.positionId] || POSITION_PALETTE[0];

                                return (
                                    <TableRow
                                        key={st.id}
                                        onClick={() => handleOpenEdit(st)}
                                        sx={{
                                            cursor: 'pointer',
                                            transition: 'background-color 0.15s',
                                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
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
                                                    bgcolor: posPalette.bg,
                                                    borderLeft: `4px solid ${posPalette.accent}`,
                                                    color: posPalette.accent,
                                                    fontSize: '0.85rem',
                                                    fontWeight: 800,
                                                }}
                                            >
                                                {st.shortCode || st.name.charAt(0).toUpperCase()}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#F3F3F3' }}>{st.name}</TableCell>
                                        <TableCell>
                                            <Box
                                                component="span"
                                                sx={{
                                                    display: 'inline-block',
                                                    px: 1.5,
                                                    py: 0.8,
                                                    borderRadius: '4px',
                                                    bgcolor: posPalette.bg,
                                                    borderLeft: `4px solid ${posPalette.accent}`,
                                                    color: posPalette.accent,
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
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <CrudFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={editingShiftType ? 'Редагувати тип зміни' : 'Новий тип зміни'}
                isEditing={Boolean(editingShiftType)}
                errorMsg={errorMsg}
                saving={saving}
                onSave={handleSave}
                onDelete={handleDelete}
            >
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
            </CrudFormDialog>

            <ToastNotification
                toast={toast}
                onClose={() => setToast((prev) => ({ ...prev, open: false }))}
            />
        </Box>
    );
}