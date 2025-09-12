// Default users for frontend authentication
const users = [
    {
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        fullName: 'Administrator',
        department: 'Administration',
        email: 'admin@fra.local'
    },
    {
        username: 'viewer',
        password: 'viewer123',
        role: 'viewer',
        fullName: 'Viewer User',
        department: 'General',
        email: 'viewer@fra.local'
    }
];

export const authenticate = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        const token = btoa(JSON.stringify({ ...user, timestamp: Date.now() }));
        const userToStore = { ...user };
        delete userToStore.password; // Don't store password in localStorage
        
        localStorage.setItem('user', JSON.stringify(userToStore));
        localStorage.setItem('token', token);
        return { 
            success: true, 
            user: userToStore,
            token,
            token_type: "bearer"
        };
    }
    return { 
        success: false, 
        message: 'Invalid credentials' 
    };
};

export const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
};

export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
    return !!getCurrentUser();
};

export const hasRole = (requiredRole) => {
    const user = getCurrentUser();
    return user && user.role === requiredRole;
};

export const isAdmin = () => {
    return hasRole('admin');
};