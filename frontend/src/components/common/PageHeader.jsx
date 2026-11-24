import { Box, Typography } from '@mui/material';

export default function PageHeader({ title, subtitle, action = null }) {
    return (
        <Box
            sx={{
                mb: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
            }}
        >
            <Box>
                <Typography variant="h4" sx={{ color: 'text.primary', mb: 0.5 }}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
            </Box>
            {action}
        </Box>
    );
}