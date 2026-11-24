import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { dialogPaperSlotProps, dangerBtnSx } from '../../constants/uiStyles';

export default function ConfirmDialog({
                                          open,
                                          title,
                                          children,
                                          confirmText = 'Підтвердити',
                                          onConfirm,
                                          onClose,
                                          loading = false,
                                      }) {
    return (
        <Dialog open={open} onClose={onClose} slotProps={dialogPaperSlotProps}>
            <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
            <DialogContent>
                <Typography color="text.secondary">{children}</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ color: '#989898' }}>
                    Скасувати
                </Button>
                <Button
                    variant="contained"
                    onClick={onConfirm}
                    disabled={loading}
                    sx={dangerBtnSx}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}