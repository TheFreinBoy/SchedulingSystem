import { useState, useEffect } from 'react';
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
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { apiFetch } from '../api/apiClient';
import { POSITION_PALETTE, inputSx, primaryBtnSx } from '../constants/uiStyles';
import PageHeader from '../components/common/PageHeader';
import CrudFormDialog from '../components/common/CrudFormDialog';
import ToastNotification from '../components/common/ToastNotification';

export default function Positions() {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState(null);
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
        setName('');
        setErrorMsg('');
        setDialogOpen(true);
    };

    const handleOpenEdit = (pos) => {
        setEditingPosition(pos);
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
            const response = await apiFetch(
                editingPosition ? `/Positions/${editingPosition.id}` : '/Positions',
                {
                    method: editingPosition ? 'PUT' : 'POST',
                    body: JSON.stringify({ name: name.trim() }),
                }
            );

            if (!response.ok) throw new Error((await response.text()) || 'Помилка збереження посади');

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
            const response = await apiFetch(`/Positions/${editingPosition.id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.text()) || 'Не вдалося видалити посаду');

            await fetchPositions();
            setDialogOpen(false);
            setToast({ open: true, message: 'Посаду видалено.', severity: 'success' });
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ pb: 4 }}>
            <PageHeader
                title="Посади"
                subtitle="Натисніть на рядок посади, щоб змінити її назву або видалити"
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
                        Додати посаду
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
                            {positions.map((pos, idx) => {
                                const palette = POSITION_PALETTE[idx % POSITION_PALETTE.length];
                                return (
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
                                        <TableCell sx={{ color: '#989898', fontWeight: 600 }}>#{pos.id}</TableCell>
                                        <TableCell>
                                            <Box
                                                component="span"
                                                sx={{
                                                    display: 'inline-block',
                                                    px: 1.5,
                                                    py: 0.85,
                                                    borderRadius: '4px',
                                                    bgcolor: palette.bg,
                                                    borderLeft: `4px solid ${palette.accent}`,
                                                    color: palette.accent,
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
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <CrudFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={editingPosition ? 'Редагувати посаду' : 'Нова посада'}
                isEditing={Boolean(editingPosition)}
                errorMsg={errorMsg}
                saving={saving}
                onSave={handleSave}
                onDelete={handleDelete}
                maxWidth="xs"
            >
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
            </CrudFormDialog>

            <ToastNotification
                toast={toast}
                onClose={() => setToast((prev) => ({ ...prev, open: false }))}
            />
        </Box>
    );
}