import { useState, useEffect } from 'react';
import {
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Box,
} from '@mui/material';

export default function Employees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5110/api/Employees')
            .then((response) => response.json())
            .then((data) => {
                setEmployees(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Помилка завантаження:', error);
                setLoading(false);
            });
    }, []);

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ color: 'text.primary', mb: 0.5 }}>
                    Працівники
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    База персоналу та налаштування робочих патернів
                </Typography>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#1D1A1A' }}>
                            <TableRow>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>ID</TableCell>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Працівник</TableCell>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Посада</TableCell>
                                <TableCell sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Email</TableCell>
                                <TableCell align="center" sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Години / тиждень</TableCell>
                                <TableCell align="center" sx={{ color: '#989898', fontWeight: 600, borderBottomColor: 'rgba(255,255,255,0.06)' }}>Графік</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {employees.map((emp) => (
                                <TableRow
                                    key={emp.id}
                                    sx={{
                                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' },
                                        '& td': { borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
                                    }}
                                >
                                    <TableCell sx={{ color: '#989898', fontWeight: 600 }}>#{emp.id}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#F3F3F3' }}>
                                        {emp.firstName} {emp.lastName}
                                    </TableCell>
                                    <TableCell>
                                        <Box
                                            component="span"
                                            sx={{
                                                display: 'inline-block',
                                                px: 1.5,
                                                py: 1,
                                                borderRadius: '4px',
                                                bgcolor: 'rgba(56, 189, 248, 0.14)',
                                                borderLeft: '3px solid #38BDF8',
                                                color: '#38BDF8',
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {emp.positionName}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: '#989898' }}>{emp.email}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                                        {emp.maxHoursPerWeek} год
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box
                                            component="span"
                                            sx={{
                                                display: 'inline-block',
                                                px: 1.5,
                                                py: 1,
                                                borderRadius: '4px',
                                                bgcolor: 'rgba(180, 248, 44, 0.12)',
                                                color: '#B4F82C',
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {emp.workDaysPattern} / {emp.offDaysPattern}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}