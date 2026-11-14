const BASE_URL = 'http://localhost:5110/api';

export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');

    const headers = {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        localStorage.removeItem('auth_token');
        //window.location.href = '/login';
    }

    return response;
}