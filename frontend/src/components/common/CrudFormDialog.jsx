import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    Box,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { dialogPaperSlotProps, primaryBtnSx, dangerBtnSx } from '../../constants/uiStyles';

export default function CrudFormDialog({
                                           open,
                                           onClose,
                                           title,
                                           isEditing = false,
                                           errorMsg = '',
                                           saving = false,
                                           onSave,
                                           onDelete,
                                           maxWidth = 'sm',
                                           children,
                                       }) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (open) {
            setConfirmDelete(false);
        }
    }, [open, isEditing]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth slotProps={dialogPaperSlotProps}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{title}</DialogTitle>

            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
                {errorMsg && (
                    <Alert severity="error" sx={{ borderRadius: '10px' }}>
                        {errorMsg}
                    </Alert>
                )}
                {children}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
                {isEditing && onDelete ? (
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