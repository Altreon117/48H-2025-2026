import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';
import socketService from '../services/socketService';
import adminApi from '../services/adminApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const isAuthBypassed = import.meta.env.VITE_BYPASS_AUTH === 'true';

    const testUser = {
        id: 0,
        username: 'test-user',
        fullName: 'Utilisateur Test',
        isAdmin: false,
    };

    useEffect(() => {
        if (isAuthBypassed) {
            setCurrentUser(testUser);
            setIsLoading(false);
            return;
        }

        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            apiService.setToken(savedToken);
            apiService.get('/auth/me')
                .then(response => {
                    setCurrentUser(response.user);
                    socketService.connect(savedToken);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    apiService.setToken(null);
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [isAuthBypassed]);

    const login = async (email, password) => {
        const response = await apiService.post('/auth/login', { email, password });

        const { user, token } = response;

        localStorage.setItem('token', token);

        if (user.isAdmin) {
            localStorage.setItem('adminToken', token);
            adminApi.setToken(token);
        }

        setCurrentUser(user);

        if (user.isAdmin) {
            navigate('/admin/dashboard');
        } else {
            navigate('/feed');
        }
    };

    const register = async (userData) => {
        const response = await apiService.post('/auth/register', userData);
        localStorage.setItem('token', response.token);
        apiService.setToken(response.token);
        setCurrentUser(response.user);
        socketService.connect(response.token);
        return response;
    };

    const logout = () => {
        localStorage.removeItem('token');
        apiService.setToken(null);
        socketService.disconnect();
        setCurrentUser(null);
    };

    const updateCurrentUser = (updatedUser) => {
        setCurrentUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ currentUser, isLoading, login, register, logout, updateCurrentUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
    return context;
}
