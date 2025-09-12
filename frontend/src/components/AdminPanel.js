import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Shield, 
  Users, 
  UserPlus, 
  Database, 
  Settings, 
  Activity,
  Download,
  Upload,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  Eye,
  Server,
  HardDrive,
  Wifi,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../App';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'viewer',
    department: '',
    state: '',
    district: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      const [statsResponse] = await Promise.all([
        axios.get(`${API}/dashboard/stats`)
      ]);
      
      setStats(statsResponse.data);
      
      // Mock users data since we don't have user management API yet
      setUsers([
        {
          id: '1',
          username: 'admin',
          email: 'admin@fra-connect.gov.in',
          full_name: 'System Administrator',
          role: 'admin',
          department: 'Forest Department',
          state: 'All',
          district: 'All',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          username: 'officer1',
          email: 'officer1@fra-connect.gov.in',
          full_name: 'Forest Officer 1',
          role: 'officer',
          department: 'Forest Department',
          state: 'Jharkhand',
          district: 'Ranchi',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]);
      
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'officer': return 'bg-blue-100 text-blue-800';
      case 'verifier': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const systemMetrics = [
    { name: 'Database Status', value: 'Connected', status: 'success', icon: Database },
    { name: 'Server Status', value: 'Online', status: 'success', icon: Server },
    { name: 'Storage Usage', value: '72%', status: 'warning', icon: HardDrive },
    { name: 'Network Status', value: 'Stable', status: 'success', icon: Wifi }
  ];

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-600 mb-2">Access Denied</h2>
          <p className="text-slate-500">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Admin Panel</h1>
            <p className="text-slate-600">System administration and user management</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={fetchAdminData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {systemMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">{metric.name}</p>
                  <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  metric.status === 'success' ? 'bg-green-100' : 
                  metric.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <metric.icon className={`w-6 h-6 ${
                    metric.status === 'success' ? 'text-green-600' : 
                    metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Admin Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>User Management</span>
                  </CardTitle>
                  <CardDescription>Manage system users and their permissions</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>Create a new user account for the system</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Username</label>
                        <Input
                          value={newUser.username}
                          onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="Enter username"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Full Name</label>
                        <Input
                          value={newUser.full_name}
                          onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Email</label>
                        <Input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter email"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Role</label>
                        <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="officer">Officer</SelectItem>
                            <SelectItem value="verifier">Verifier</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Department</label>
                        <Input
                          value={newUser.department}
                          onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                          placeholder="Enter department"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">State</label>
                        <Input
                          value={newUser.state}
                          onChange={(e) => setNewUser(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="Enter state"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-6">
                      <Button variant="outline">Cancel</Button>
                      <Button className="bg-green-600 hover:bg-green-700">Create User</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{user.full_name}</h4>
                        <p className="text-sm text-slate-600">{user.email}</p>
                        <p className="text-xs text-slate-500">{user.department} | {user.state}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role.toUpperCase()}
                      </Badge>
                      
                      <div className="flex items-center space-x-1">
                        {user.is_active ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-xs text-slate-500">
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <span>System Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">OCR Processing</span>
                  <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">AI Recommendations</span>
                  <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Auto Backup</span>
                  <Badge className="bg-green-100 text-green-800">Daily</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Session Timeout</span>
                  <span className="text-sm text-slate-600">30 minutes</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm text-slate-600">25%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm text-slate-600">68%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Users</span>
                  <span className="text-sm text-slate-600">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm text-slate-600">99.8%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Records</span>
                  <span className="font-medium">{(stats?.total_villages || 0) + (stats?.total_claims || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Villages</span>
                  <span className="font-medium">{stats?.total_villages || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Claims</span>
                  <span className="font-medium">{stats?.total_claims || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Storage Size</span>
                  <span className="font-medium">2.4 GB</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backup & Recovery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Create Backup
                </Button>
                <Button className="w-full" variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Restore Backup
                </Button>
                <p className="text-xs text-slate-500">
                  Last backup: {new Date().toLocaleDateString('en-IN')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Optimize Database
                </Button>
                <Button className="w-full" variant="outline">
                  <Database className="w-4 h-4 mr-2" />
                  Clean Temp Files
                </Button>
                <Button className="w-full" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Rebuild Indexes
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>System Activity Logs</span>
              </CardTitle>
              <CardDescription>Recent system activities and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: '2 min ago', user: 'admin', action: 'Approved claim FRA-20240901-ABC123', type: 'success' },
                  { time: '5 min ago', user: 'officer1', action: 'Updated claim status to under_review', type: 'info' },
                  { time: '12 min ago', user: 'verifier2', action: 'Uploaded OCR document', type: 'info' },
                  { time: '18 min ago', user: 'system', action: 'Automated backup completed', type: 'success' },
                  { time: '25 min ago', user: 'admin', action: 'Created new user account', type: 'info' },
                  { time: '1 hour ago', user: 'officer1', action: 'Failed login attempt', type: 'warning' }
                ].map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        log.type === 'success' ? 'bg-green-500' :
                        log.type === 'warning' ? 'bg-yellow-500' :
                        log.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{log.action}</p>
                        <p className="text-xs text-slate-500">by {log.user}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{log.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;