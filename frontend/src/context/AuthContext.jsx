import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [role, setRole] = useState(() => {
        return localStorage.getItem('dev_role') || 'Admin';
    });

    const switchRole = (newRole) => {
        setRole(newRole);
        localStorage.setItem('dev_role', newRole);
    };

    const isAdmin = role === 'Admin';

    return (
        <AuthContext.Provider value={{ role, isAdmin, switchRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth має використовуватися всередині AuthProvider');
    }
    return context;
}