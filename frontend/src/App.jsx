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
    Menu,
    MenuItem,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import Employees from './pages/Employees';
import Schedule from './pages/Schedule';
import ShiftTypes from './pages/ShiftTypes';
import Positions from './pages/Positions';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';



function Layout() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [profileAnchor, setProfileAnchor] = useState(null);
    const location = useLocation();
    const { role, isAdmin, switchRole } = useAuth();

    const allMenuItems = [
        { text: 'Графіки', path: '/schedule', icon: <CalendarMonthRoundedIcon />, adminOnly: false },
        { text: 'Працівники', path: '/employees', icon: <PeopleAltRoundedIcon />, adminOnly: true },
        { text: 'Типи змін', path: '/shift-types', icon: <AccessTimeRoundedIcon />, adminOnly: true },
        { text: 'Посади', path: '/positions', icon: <BadgeRoundedIcon />}
    ];

    const menuItems = allMenuItems.filter((item) => !item.adminOnly || isAdmin);

    const handleRoleSelect = (selectedRole) => {
        switchRole(selectedRole);
        setProfileAnchor(null);
    };

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

                    {/* Аватарка + індикатор поточної тестової ролі */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                            component="span"
                            sx={{
                                px: 1.2,
                                py: 0.4,
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                bgcolor: isAdmin ? 'rgba(180, 248, 44, 0.14)' : 'rgba(56, 189, 248, 0.14)',
                                color: isAdmin ? '#B4F82C' : '#38BDF8',
                            }}
                        >
                            {isAdmin ? 'Admin' : 'Employee'}
                        </Box>

                        <Avatar
                            onClick={(e) => setProfileAnchor(e.currentTarget)}
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
                    </Box>

                    {/* Меню профілю (перемикач ролей для тестування) */}
                    <Menu
                        anchorEl={profileAnchor}
                        open={Boolean(profileAnchor)}
                        onClose={() => setProfileAnchor(null)}
                        sx={{
                            mt: 1,
                            '& .MuiPaper-root': {
                                bgcolor: '#222222',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                minWidth: 210,
                            },
                        }}
                    >
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                РЕЖИМ ПЕРЕГЛЯДУ (DEV)
                            </Typography>
                        </Box>
                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />
                        <MenuItem
                            selected={role === 'Admin'}
                            onClick={() => handleRoleSelect('Admin')}
                            sx={{ gap: 1.5, py: 1.2 }}
                        >
                            <AdminPanelSettingsRoundedIcon fontSize="small" sx={{ color: '#B4F82C' }} />
                            <Typography variant="body2" fontWeight={600}>
                                Адміністратор
                            </Typography>
                        </MenuItem>
                        <MenuItem
                            selected={role === 'Employee'}
                            onClick={() => handleRoleSelect('Employee')}
                            sx={{ gap: 1.5, py: 1.2 }}
                        >
                            <BadgeRoundedIcon fontSize="small" sx={{ color: '#38BDF8' }} />
                            <Typography variant="body2" fontWeight={600}>
                                Працівник (тільки перегляд)
                            </Typography>
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: 420,
                        bgcolor: '#1D1A1A',
                        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
                        p: 3,
                    },
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
                                    Відкрийте меню зліва зверху, щоб перейти до графіків{isAdmin ? ' або працівників' : ''}
                                </Typography>
                            </Box>
                        }
                    />
                    <Route
                        path="/employees"
                        element={isAdmin ? <Employees /> : <Navigate to="/schedule" replace />}
                    />
                    <Route path="/schedule" element={<Schedule />} />
                    <Route
                        path="/shift-types"
                        element={isAdmin ? <ShiftTypes /> : <Navigate to="/schedule" replace />}
                    />
                    <Route path="/positions" element={<Positions />} />
                </Routes>
            </Container>
        </Box>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Layout />
            </BrowserRouter>
        </AuthProvider>
    );
}