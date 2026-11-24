import { Snackbar, Alert } from '@mui/material';

export default function ToastNotification({ toast, onClose, duration = 4500 }) {
    return (
        <Snackbar
            open={toast.open}
            autoHideDuration={duration}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <Alert
                onClose={onClose}
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
    );
}