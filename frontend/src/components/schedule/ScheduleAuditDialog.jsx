import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Box,
    Typography,
    Divider,
} from '@mui/material';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { dialogPaperSlotProps, primaryBtnSx } from '../../constants/uiStyles';

const RULE_LABELS = {
    'Недоукомплектованість': { label: 'Недоукомплектованість', color: '#F87171', bg: 'rgba(248, 113, 113, 0.15)' },
    REST_VIOLATION: { label: 'Відпочинок < 12 год', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
    WEEKLY_OVERTIME: { label: 'Перепрацювання', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
    UNAVAILABLE: { label: 'Відпустка / Відсутність', color: '#F87171', bg: 'rgba(248, 113, 113, 0.15)' },
    PATTERN_WORK_LIMIT: { label: 'Серія робочих днів', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)' },
    PATTERN_OFF_LIMIT: { label: 'Неповні вихідні', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)' },
    POSITION_MISMATCH: { label: 'Інша посада', color: '#F87171', bg: 'rgba(248, 113, 113, 0.15)' },
    INACTIVE: { label: 'Архівний працівник', color: '#F87171', bg: 'rgba(248, 113, 113, 0.15)' },
};

const KpiCard = ({ label, value, color, subtitle }) => (
    <Box
        sx={{
            flex: 1,
            p: 2,
            borderRadius: '12px',
            bgcolor: '#1D1A1A',
            border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
    >
        <Typography variant="caption" sx={{ color: '#989898', fontWeight: 600 }}>
            {label}
        </Typography>
        <Typography variant="h4" sx={{ color, fontWeight: 800, mt: 0.5 }}>
            {value}
        </Typography>
        <Typography variant="caption" sx={{ color: '#989898' }}>
            {subtitle}
        </Typography>
    </Box>
);

export default function ScheduleAuditDialog({ open, onClose, report, selectedPosition }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth slotProps={dialogPaperSlotProps}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FactCheckRoundedIcon sx={{ color: '#38BDF8' }} />
                <span>
                    Перевірка графіка ({report?.startDate} — {report?.endDate}
                    {selectedPosition ? ` · ${selectedPosition.name}` : ''})
                </span>
            </DialogTitle>

            <DialogContent sx={{ pt: '12px !important' }}>
                {report && (
                    <Stack spacing={2.5}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <KpiCard
                                label="УКОМПЛЕКТОВАНІСТЬ ЗМІН"
                                value={`${report.coveragePercent}%`}
                                color="#B4F82C"
                                subtitle={`Закрито ${report.filledSlots} із ${report.totalRequiredSlots} слотів`}
                            />
                            <KpiCard
                                label="СЕРЕДНЯ ЗАВАНТАЖЕНІСТЬ"
                                value={`${report.averageWorkloadPercent}%`}
                                color="#38BDF8"
                                subtitle="Від тижневої норми активного штату"
                            />
                            <KpiCard
                                label="КОНФЛІКТИ ТА ВІДХИЛЕННЯ"
                                value={report.violationsCount}
                                color={report.violationsCount === 0 ? '#B4F82C' : '#F87171'}
                                subtitle={
                                    report.violationsCount === 0
                                        ? 'Порушень не виявлено'
                                        : 'Потребують уваги адміністратора'
                                }
                            />
                        </Stack>

                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

                        {report.violationsCount === 0 ? (
                            <Box
                                sx={{
                                    p: 3,
                                    borderRadius: '12px',
                                    bgcolor: 'rgba(180, 248, 44, 0.08)',
                                    border: '1px solid rgba(180, 248, 44, 0.25)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                }}
                            >
                                <CheckCircleOutlineRoundedIcon sx={{ color: '#B4F82C', fontSize: 32 }} />
                                <Box>
                                    <Typography sx={{ fontWeight: 700, color: '#F3F3F3' }}>
                                        Графік повністю коректний
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#989898' }}>
                                        Усі зміни укомплектовані, міжзмінний відпочинок (≥ 12 год), тижневі норми годин та графіки відпусток дотримані.
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            <Stack spacing={1.2} sx={{ maxHeight: 340, overflowY: 'auto', pr: 0.5 }}>
                                {report.violations.map((v, idx) => {
                                    const badge = RULE_LABELS[v.ruleType] || {
                                        label: v.ruleType,
                                        color: '#F59E0B',
                                        bg: 'rgba(245, 158, 11, 0.15)',
                                    };
                                    return (
                                        <Box
                                            key={`${v.date}-${v.employeeName}-${idx}`}
                                            sx={{
                                                p: 1.6,
                                                borderRadius: '10px',
                                                bgcolor: '#1D1A1A',
                                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                                display: 'flex',
                                                alignItems: { xs: 'flex-start', sm: 'center' },
                                                justifyContent: 'space-between',
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                gap: 1.5,
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
                                                <WarningAmberRoundedIcon sx={{ color: badge.color, mt: 0.2, fontSize: 20 }} />
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#F3F3F3' }}>
                                                        {v.date} · {v.employeeName} ({v.shiftName})
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.82rem', color: '#989898' }}>
                                                        {v.description}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box
                                                component="span"
                                                sx={{
                                                    px: 1.2,
                                                    py: 0.45,
                                                    borderRadius: '6px',
                                                    bgcolor: badge.bg,
                                                    color: badge.color,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {badge.label}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button variant="contained" onClick={onClose} sx={{ ...primaryBtnSx, px: 2.5 }}>
                    Закрити
                </Button>
            </DialogActions>
        </Dialog>
    );
}