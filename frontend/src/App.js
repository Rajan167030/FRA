import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import './App.css';
import { authenticate, logout as authLogout, getCurrentUser } from './auth/authentication';
import LanguageProvider from './contexts/LanguageContext';

// Components
import { Toaster } from './components/ui/sonner';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ForestAtlas from './components/ForestAtlas';
import CaseManagement from './components/CaseManagement';
import Analytics from './components/Analytics';
import AdminPanel from './components/AdminPanel';

// Auth Context
const AuthContext = React.createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getCurrentUser());
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const result = authenticate(username, password);
      if (result.success) {
        setUser(result.user);
        return { success: true };
      }
      return { success: false, error: result.message };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Main Layout Component
const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        user={user} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
      <div className="flex pt-[120px]">
        <Sidebar 
          isOpen={sidebarOpen} 
          userRole={user?.role} 
        />
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'} min-h-[calc(100vh-120px)]`}>
          <div className="p-6 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/atlas" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ForestAtlas />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/cases" element={
                <ProtectedRoute>
                  <MainLayout>
                    <CaseManagement />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Analytics />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminPanel />
                  </MainLayout>
                </ProtectedRoute>
              } />
            </Routes>
            <Toaster position="top-right" richColors />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;