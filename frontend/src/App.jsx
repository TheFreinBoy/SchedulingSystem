import { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Container,
    Box,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Divider,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

import Employees from './pages/Employees';
import Schedule from './pages/Schedule';

function Layout() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const location = useLocation();

    const menuItems = [
        { text: 'Графіки', path: '/schedule', icon: <CalendarMonthRoundedIcon /> },
        { text: 'Працівники', path: '/employees', icon: <PeopleAltRoundedIcon /> },
    ];

    return (
        <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh', color: 'text.primary' }}>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: 'rgba(24, 21, 21, 0.85)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
                    <IconButton
                        onClick={() => setDrawerOpen(true)}
                        sx={{
                            bgcolor: '#222222',
                            color: '#F3F3F3',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '10px',
                            '&:hover': { bgcolor: '#2C2929', borderColor: '#B4F82C' },
                        }}
                    >
                        <MenuRoundedIcon />
                    </IconButton>

                    <Avatar
                        sx={{
                            width: 40,
                            height: 40,
                            bgcolor: '#222222',
                            color: '#B4F82C',
                            border: '1px solid rgba(180, 248, 44, 0.35)',
                            cursor: 'pointer',
                            transition: '0.2s',
                            '&:hover': { bgcolor: 'rgba(180, 248, 44, 0.12)' },
                        }}
                    >
                        <PersonRoundedIcon fontSize="small" />
                    </Avatar>
                </Toolbar>
            </AppBar>

            {/* Залізобетонний варіант Drawer без PaperProps */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: 420, // Ширина гарантовано застосується тут
                        bgcolor: '#1D1A1A',
                        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
                        p: 3,
                    }
                }}
            >
                <Box
                    sx={{
                        height: 54,
                        mb: 2,
                        borderRadius: '12px',
                        border: '1px dashed rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.secondary',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                    }}
                >
                    ВАШ ЛОГОТИП
                </Box>

                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mb: 2 }} />

                <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <ListItem key={item.path} disablePadding>
                                <ListItemButton
                                    component={Link}
                                    to={item.path}
                                    onClick={() => setDrawerOpen(false)}
                                    sx={{
                                        borderRadius: '10px',
                                        bgcolor: isActive ? 'rgba(180, 248, 44, 0.14)' : 'transparent',
                                        color: isActive ? '#B4F82C' : '#F3F3F3',
                                        '&:hover': {
                                            bgcolor: isActive ? 'rgba(180, 248, 44, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 38, color: isActive ? '#B4F82C' : '#989898' }}>
                                        {item.icon}
                                    </ListItemIcon>

                                    {/* Залізобетонний варіант тексту без primaryTypographyProps */}
                                    <ListItemText
                                        disableTypography
                                        primary={
                                            <Typography sx={{ fontWeight: isActive ? 700 : 500, fontSize: '0.95rem' }}>
                                                {item.text}
                                            </Typography>
                                        }
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Drawer>

            <Container maxWidth="xl" sx={{ mt: 3, px: { xs: 2, md: 4 } }}>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <Box sx={{ textAlign: 'center', mt: 10 }}>
                                <Typography variant="h4" gutterBottom>
                                    Головна панель
                                </Typography>
                                <Typography color="text.secondary">
                                    Відкрийте меню зліва зверху, щоб перейти до графіків або працівників
                                </Typography>
                            </Box>
                        }
                    />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/schedule" element={<Schedule />} />
                </Routes>
            </Container>
        </Box>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Layout />
        </BrowserRouter>
    );
}