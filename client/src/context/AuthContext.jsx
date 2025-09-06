import React, { createContext, useContext, useState, useEffect } from 'react';
import { me } from '../auth';

const AuthContext = createContext({
    user: null,
    isAuthenticated: false,
    loading: false,
    login: () => {},
    logout: () => {},
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing token on mount
        const checkAuth = () => {
            try {
                const userData = me();
                if (userData) {
                    setUser({
                        _id: userData.id,
                        name: userData.name,
                        role: userData.role
                    });
                }
            } catch (error) {
                console.error('Auth check error:', error);
                // Clear invalid token
                localStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = (userData, token) => {
        console.log('Login called with:', userData, token ? 'token provided' : 'no token');
        if (token) {
            localStorage.setItem('token', token);
        }
        setUser(userData);
    };

    const logout = () => {
        console.log('Logout called');
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // Provide safe fallback values
        return {
            user: null,
            isAuthenticated: false,
            loading: false,
            login: () => {},
            logout: () => {},
        };
    }
    return context;
};