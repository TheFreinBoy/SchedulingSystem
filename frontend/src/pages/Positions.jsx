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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Snackbar,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { apiFetch } from '../api/apiClient';

export default function Positions() {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [name, setName] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [saving, setSaving] = useState(false);

    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    const fetchPositions = async () => {
        try {
            const response = await apiFetch('/Positions');
            if (response.ok) {
                const data = await response.json();
                setPositions(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Помилка завантаження посад:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPositions();
    }, []);

    const handleOpenCreate = () => {
        setEditingPosition(null);
        setConfirmDelete(false);
        setName('');
        setErrorMsg('');
        setDialogOpen(true);
    };

    const handleOpenEdit = (pos) => {
        setEditingPosition(pos);
        setConfirmDelete(false);
        setName(pos.name);
        setErrorMsg('');
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setErrorMsg('Введіть назву посади.');
            return;
        }

        setSaving(true);
        setErrorMsg('');

        try {
            const endpoint = editingPosition
                ? `/Positions/${editingPosition.id}`
                : '/Positions';
            const method = editingPosition ? 'PUT' : 'POST';

            const response = await apiFetch(endpoint, {
                method,
                body: JSON.stringify({ name: name.trim() }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Помилка збереження посади');
            }

            await fetchPositions();
            setDialogOpen(false);
            setToast({
                open: true,
                message: editingPosition ? 'Посаду оновлено.' : 'Посаду додано.',
                severity: 'success',
            });
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editingPosition) return;
        setSaving(true);
        setErrorMsg('');

        try {
            const response = await apiFetch(`/Positions/${editingPosition.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Не вдалося видалити посаду');
            }

            await fetchPositions();
            setDialogOpen(false);
            setToast({
                open: true,
                message: 'Посаду видалено.',
                severity: 'success',
            });
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
            setConfirmDelete(false);
        }
    };

    const inputSx = {
        '& .MuiOutlinedInput-root': {
            bgcolor: '#1D1A1A',
            borderRadius: '10px',
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
                        Посади
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Натисніть на рядок посади, щоб змінити її назву або видалити
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
                    Додати посаду
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
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)', width: 90 }}>
                                    ID
                                </TableCell>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                                    Назва посади
                                </TableCell>
                                <TableCell align="center" sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                                    Працівників
                                </TableCell>
                                <TableCell align="center" sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                                    Типів змін
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {positions.map((pos) => (
                                <TableRow
                                    key={pos.id}
                                    onClick={() => handleOpenEdit(pos)}
                                    sx={{
                                        cursor: 'pointer',
                                        transition: 'background-color 0.15s',
                                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                                        '& td': { borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
                                    }}
                                >
                                    <TableCell sx={{ color: '#989898', fontWeight: 600 }}>
                                        #{pos.id}
                                    </TableCell>
                                    <TableCell>
                                        <Box
                                            component="span"
                                            sx={{
                                                display: 'inline-block',
                                                px: 1.5,
                                                py: 0.85,
                                                borderRadius: '4px',
                                                bgcolor: 'rgba(56, 189, 248, 0.14)',
                                                borderLeft: '4px solid #38BDF8',
                                                color: '#38BDF8',
                                                fontSize: '0.88rem',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {pos.name}
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
                                            {pos.employeesCount ?? 0} ос.
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
                                                bgcolor: 'rgba(255, 255, 255, 0.06)',
                                                color: '#F3F3F3',
                                                fontSize: '0.85rem',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {pos.shiftTypesCount ?? 0}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                slotProps={dialogPaperSlotProps}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    {editingPosition ? 'Редагувати посаду' : 'Нова посада'}
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
                    {errorMsg && (
                        <Alert severity="error" sx={{ borderRadius: '10px' }}>
                            {errorMsg}
                        </Alert>
                    )}

                    <TextField
                        label="Назва посади (напр. Бариста)"
                        fullWidth
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                        }}
                        sx={inputSx}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
                    {editingPosition ? (
                        confirmDelete ? (
                            <Button
                                variant="contained"
                                onClick={handleDelete}
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
                            onClick={handleSave}
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