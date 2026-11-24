import { Paper, Stack, Chip } from '@mui/material';
import { POSITION_PALETTE } from '../../constants/uiStyles';

export default function PositionFilterBar({
                                              positions,
                                              counts,
                                              selectedPositionId,
                                              onSelectPosition,
                                              positionColorMap,
                                              rightContent = null,
                                          }) {
    return (
        <Paper
            elevation={0}
            sx={{
                px: 2,
                py: 1.4,
                mb: 2,
                borderRadius: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', lg: 'center' },
                flexDirection: { xs: 'column', lg: 'row' },
                gap: 1.5,
            }}
        >
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.8 }}>
                <Chip
                    label={`Усі посади (${counts.all ?? 0})`}
                    onClick={() => onSelectPosition('all')}
                    sx={{
                        fontWeight: 700,
                        borderRadius: '8px',
                        bgcolor: selectedPositionId === 'all' ? '#B4F82C' : '#1D1A1A',
                        color: selectedPositionId === 'all' ? '#181515' : '#989898',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        '&:hover': {
                            bgcolor: selectedPositionId === 'all' ? '#a3e61e' : 'rgba(255, 255, 255, 0.08)',
                        },
                    }}
                />

                {positions.map((pos) => {
                    const isSelected = Number(selectedPositionId) === pos.id;
                    const palette = positionColorMap[pos.id] || POSITION_PALETTE[0];
                    return (
                        <Chip
                            key={pos.id}
                            label={`${pos.name} (${counts[pos.id] ?? 0})`}
                            onClick={() => onSelectPosition(pos.id)}
                            sx={{
                                fontWeight: 700,
                                borderRadius: '8px',
                                bgcolor: isSelected ? palette.accent : '#1D1A1A',
                                color: isSelected ? '#181515' : palette.accent,
                                border: `1px solid ${isSelected ? palette.accent : 'rgba(255, 255, 255, 0.08)'}`,
                                '&:hover': {
                                    bgcolor: isSelected ? palette.accent : palette.bg,
                                },
                            }}
                        />
                    );
                })}
            </Stack>

            {rightContent}
        </Paper>
    );
}