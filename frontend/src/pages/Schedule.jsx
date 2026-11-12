import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Typography, Paper, Box, CircularProgress } from '@mui/material';

export default function Schedule() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5110/api/ShiftAssignments')
            .then((response) => response.json())
            .then((data) => {
                if (!Array.isArray(data)) {
                    console.error('Очікувався масив, але отримано:', data);
                    setLoading(false);
                    return;
                }

                const formattedEvents = data.map((shift) => {
                    const isUnassigned = shift.status === 'Unassigned';

                    return {
                        id: shift.id,
                        title: isUnassigned ? 'Непризначено' : shift.employeeFullName,
                        start: shift.date,
                        allDay: true,
                        extendedProps: {
                            shiftType: shift.shiftTypeName,
                            isUnassigned,
                        },
                    };
                });

                setEvents(formattedEvents);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Помилка завантаження графіку:', error);
                setLoading(false);
            });
    }, []);

    // Компактна сучасна плашка у стилі темного дашборду
    const renderEventContent = (eventInfo) => {
        const { shiftType, isUnassigned } = eventInfo.event.extendedProps;

        const accentColor = isUnassigned ? '#F87171' : '#38BDF8';
        const bgColor = isUnassigned ? 'rgba(248, 113, 113, 0.14)' : 'rgba(56, 189, 248, 0.14)';
        const shortShiftType = shiftType ? shiftType.charAt(0).toUpperCase() : '';

        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.8,
                    bgcolor: bgColor,
                    borderLeft: `4px solid ${accentColor}`,
                    borderRadius: '4px',
                    px: 1,
                    py: 1,
                    overflow: 'hidden',
                    transition: '0.15s',
                    '&:hover': {
                        filter: 'brightness(1.15)',
                    },
                }}
            >
                <Typography
                    component="span"
                    sx={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: accentColor,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {shiftType}
                </Typography>
                <Typography
                    component="span"
                    sx={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: '#F3F3F3',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {eventInfo.event.title}
                </Typography>
            </Box>
        );
    };

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ color: 'text.primary', mb: 0.5 }}>
                    Графік роботи
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Розклад змін персоналу
                </Typography>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 1.5, md: 3 },
                        borderRadius: '16px',
                        height: '78vh',
                    }}
                >
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek',
                        }}
                        buttonText={{
                            today: 'Сьогодні',
                            month: 'Місяць',
                            week: 'Тиждень',
                        }}
                        events={events}
                        locale="uk"
                        height="100%"
                        eventContent={renderEventContent}
                        dayMaxEvents={3}
                    />
                </Paper>
            )}
        </Box>
    );
}