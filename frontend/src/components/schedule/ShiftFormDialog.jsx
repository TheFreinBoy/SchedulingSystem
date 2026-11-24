import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Alert,
    Box,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { inputSx, dialogPaperSlotProps, primaryBtnSx, dangerBtnSx } from '../../constants/uiStyles';

export default function ShiftFormDialog({
                                            open,
                                            onClose,
                                            editingShift,
                                            formData,
                                            onChangeForm,
                                            employees,
                                            shiftTypes,
                                            errorMsg,
                                            saving,
                                            onSave,
                                            onDelete,
                                        }) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (open) {
            setConfirmDelete(false);
        }
    }, [open, editingShift]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth slotProps={dialogPaperSlotProps}>
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
                    onChange={(e) => onChangeForm('date', e.target.value)}
                    sx={inputSx}
                />

                <TextField
                    select
                    label="Працівник"
                    fullWidth
                    value={formData.employeeId}
                    onChange={(e) => onChangeForm('employeeId', e.target.value)}
                    sx={inputSx}
                >
                    <MenuItem value="">
                        <em>— Непризначено (вакантна зміна) —</em>
                    </MenuItem>
                    {employees.map((emp) => (
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
                    onChange={(e) => onChangeForm('shiftTypeId', e.target.value)}
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
                            onClick={onDelete}
                            disabled={saving}
                            sx={dangerBtnSx}
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
                    <Button onClick={onClose} sx={{ color: '#989898' }}>
                        Скасувати
                    </Button>
                    <Button
                        variant="contained"
                        onClick={onSave}
                        disabled={saving}
                        sx={{ ...primaryBtnSx, px: 2.5 }}
                    >
                        {saving ? 'Збереження...' : 'Зберегти'}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}