import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import './index.css';
import App from './App.jsx';

const theme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#181515',
            paper: '#222222',
        },
        primary: {
            main: '#B4F82C',
            contrastText: '#181515',
        },
        text: {
            primary: '#F3F3F3',
            secondary: '#989898',
        },
    },
    shape: {
        borderRadius: 12,
    },
    typography: {
        fontFamily: '"Manrope", sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 700 },
        h5: { fontWeight: 700 },
        h6: { fontWeight: 700 },
        button: { fontWeight: 600, textTransform: 'none' },
        body1: { fontWeight: 400 },
        body2: { fontWeight: 400 },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                },
            },
        },
    },
});

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
        </ThemeProvider>
    </StrictMode>
);