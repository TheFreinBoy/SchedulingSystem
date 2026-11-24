import { Paper, Box, Typography, Stack, TextField, Button, CircularProgress } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import { inputSx, primaryBtnSx } from '../../constants/uiStyles';

export default function ScheduleToolbar({
                                            genRange,
                                            onChangeRange,
                                            selectedPosition,
                                            generating,
                                            validating,
                                            clearingRange,
                                            onGenerate,
                                            onValidate,
                                            onOpenClearConfirm,
                                        }) {
    const busy = generating || clearingRange || validating;

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                mb: 2,
                borderRadius: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', xl: 'center' },
                flexDirection: { xs: 'column', xl: 'row' },
                gap: 2,
            }}
        >
            <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#F3F3F3' }}>
                    Керування розкладом за період
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {selectedPosition
                        ? `Дії застосовуються до обраної посади: ${selectedPosition.name}`
                        : 'Авторозподіл, аудит обмежень (12 год відпочинку, години, відпустки) та очищення'}
                </Typography>
            </Box>

            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.25}
                sx={{ alignItems: { xs: 'stretch', sm: 'center' }, flexWrap: 'wrap' }}
            >
                <TextField
                    label="Початкова дата"
                    type="date"
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={genRange.startDate}
                    onChange={(e) => onChangeRange('startDate', e.target.value)}
                    sx={{ ...inputSx, minWidth: 155 }}
                />
                <TextField
                    label="Кінцева дата"
                    type="date"
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={genRange.endDate}
                    onChange={(e) => onChangeRange('endDate', e.target.value)}
                    sx={{ ...inputSx, minWidth: 155 }}
                />
                <Button
                    variant="contained"
                    startIcon={
                        generating ? (
                            <CircularProgress size={18} sx={{ color: '#181515' }} />
                        ) : (
                            <AutoAwesomeRoundedIcon />
                        )
                    }
                    onClick={onGenerate}
                    disabled={busy}
                    sx={{ ...primaryBtnSx, px: 2.2, py: 0.95, whiteSpace: 'nowrap' }}
                >
                    {generating
                        ? 'Генерація...'
                        : selectedPosition
                            ? `Згенерувати (${selectedPosition.name})`
                            : 'Згенерувати'}
                </Button>
                <Button
                    variant="outlined"
                    startIcon={
                        validating ? (
                            <CircularProgress size={18} sx={{ color: '#38BDF8' }} />
                        ) : (
                            <FactCheckRoundedIcon />
                        )
                    }
                    onClick={(e) => {
                        e.currentTarget.blur();
                        onValidate();
                    }}
                    disabled={busy}
                    sx={{
                        borderColor: 'rgba(56, 189, 248, 0.45)',
                        color: '#38BDF8',
                        fontWeight: 700,
                        px: 2,
                        py: 0.9,
                        borderRadius: '10px',
                        whiteSpace: 'nowrap',
                        '&:hover': {
                            borderColor: '#38BDF8',
                            bgcolor: 'rgba(56, 189, 248, 0.1)',
                        },
                    }}
                >
                    {validating ? 'Перевірка...' : 'Перевірити графік'}
                </Button>
                <Button
                    variant="outlined"
                    startIcon={
                        clearingRange ? (
                            <CircularProgress size={18} sx={{ color: '#F87171' }} />
                        ) : (
                            <DeleteSweepRoundedIcon />
                        )
                    }
                    onClick={(e) => {
                        e.currentTarget.blur();
                        onOpenClearConfirm();
                    }}
                    disabled={busy}
                    sx={{
                        borderColor: 'rgba(248, 113, 113, 0.4)',
                        color: '#F87171',
                        fontWeight: 700,
                        px: 1.8,
                        py: 0.9,
                        borderRadius: '10px',
                        whiteSpace: 'nowrap',
                        '&:hover': {
                            borderColor: '#F87171',
                            bgcolor: 'rgba(248, 113, 113, 0.1)',
                        },
                    }}
                >
                    {clearingRange ? 'Очищення...' : 'Очистити'}
                </Button>
            </Stack>
        </Paper>
    );
}