import { jwtDecode } from 'jwt-decode';

export const setToken = (token) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
    }
};

export const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

export const removeToken = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
    }
};

export const isAuthenticated = () => {
    const token = getToken();
    if (!token) return false;

    try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
};

export const getUserRole = () => {
    const token = getToken();
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        return decoded.role;
    } catch (error) {
        return null;
    }
};