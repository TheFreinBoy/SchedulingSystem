export const POSITION_PALETTE = [
    { accent: '#38BDF8', bg: 'rgba(56, 189, 248, 0.14)' },
    { accent: '#A78BFA', bg: 'rgba(167, 139, 250, 0.14)' },
    { accent: '#34D399', bg: 'rgba(52, 211, 153, 0.14)' },
    { accent: '#FBBF24', bg: 'rgba(251, 191, 36, 0.14)' },
    { accent: '#F472B6', bg: 'rgba(244, 114, 182, 0.14)' },
    { accent: '#FB923C', bg: 'rgba(251, 146, 60, 0.14)' },
];

export const buildPositionColorMap = (positions = []) => {
    const map = {};
    positions.forEach((pos, index) => {
        map[pos.id] = POSITION_PALETTE[index % POSITION_PALETTE.length];
    });
    return map;
};

export const inputSx = {
    '& .MuiOutlinedInput-root': {
        bgcolor: '#1D1A1A',
        borderRadius: '10px',
        colorScheme: 'dark',
        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' },
        '&.Mui-focused fieldset': { borderColor: '#B4F82C' },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: '#B4F82C' },
};

export const dialogPaperSlotProps = {
    paper: {
        sx: {
            bgcolor: '#222222',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
        },
    },
};

export const primaryBtnSx = {
    bgcolor: '#B4F82C',
    color: '#181515',
    fontWeight: 700,
    borderRadius: '10px',
    '&:hover': { bgcolor: '#a3e61e' },
    '&.Mui-disabled': {
        bgcolor: 'rgba(180, 248, 44, 0.35)',
        color: '#181515',
    },
};

export const dangerBtnSx = {
    bgcolor: '#F87171',
    color: '#181515',
    fontWeight: 700,
    '&:hover': { bgcolor: '#ef4444' },
};