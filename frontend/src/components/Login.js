import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, Shield, Trees } from 'lucide-react';
import { authenticate } from '../auth/authentication';
import { toast } from 'sonner';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const user = localStorage.getItem('user');

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = authenticate(username, password);
    
    if (result.success) {
      toast.success('Login successful');
      window.location.href = '/dashboard';
    } else {
      toast.error(result.message || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      {/* Government Header */}
      <div className="absolute top-0 left-0 right-0 bg-white border-b-4 border-orange-500">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center">
                <Trees className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900">FRA-Connect</h1>
                <p className="text-sm text-slate-600">Forest Rights Atlas & Decision Support System</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Government of India</p>
              <p className="text-xs text-slate-500">Ministry of Tribal Affairs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-md mt-20">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-blue-900">
              Secure Login
            </CardTitle>
            <CardDescription className="text-slate-600">
              Access your FRA-Connect dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-11"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-900 hover:bg-blue-800 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">Demo Credentials</h4>
                  <div className="mt-2 text-sm text-amber-700">
                    <p><strong>Username:</strong> admin</p>
                    <p><strong>Password:</strong> admin123</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-white text-sm">
          <p>© 2024 Government of India | Ministry of Tribal Affairs</p>
          <p className="mt-1 text-slate-300">Secured by NIC | Digital India Initiative</p>
        </div>
      </div>
    </div>
  );
};

export default Login;