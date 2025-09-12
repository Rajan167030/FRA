import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Users,
  TreePine,
  IndianRupee,
  Activity,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../App';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, claimsResponse] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/claims?limit=5`)
      ]);
      
      setStats(statsResponse.data);
      setRecentClaims(claimsResponse.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'disputed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.full_name}
            </h1>
            <p className="text-blue-100">
              {user?.role && user.role.charAt(0).toUpperCase() + user.role.slice(1)} | {user?.department}
            </p>
            {user?.district && (
              <p className="text-blue-200 text-sm mt-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                {user.district}, {user.state}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-sm">Today's Date</p>
            <p className="text-xl font-semibold">{new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Total Villages</p>
                <p className="text-3xl font-bold text-blue-900">{stats?.total_villages || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Covered under FRA</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TreePine className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Forest Claims</p>
                <p className="text-3xl font-bold text-green-700">{stats?.total_claims || 0}</p>
                <p className="text-xs text-slate-500 mt-1">IFR + CFR Applications</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.pending_claims || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Awaiting approval</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Budget Linked</p>
                <p className="text-2xl font-bold text-purple-700">
                  {stats?.total_budget_linked ? formatCurrency(stats.total_budget_linked) : '₹0'}
                </p>
                <p className="text-xs text-slate-500 mt-1">MGNREGA, PM-KISAN</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Claims Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Claims Status Overview</span>
            </CardTitle>
            <CardDescription>Current status of forest rights claims</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Approved Claims</p>
                    <p className="text-sm text-green-600">Successfully processed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">{stats?.approved_claims || 0}</p>
                  <p className="text-sm text-green-600">
                    {stats?.total_claims ? Math.round((stats.approved_claims / stats.total_claims) * 100) : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Pending Claims</p>
                    <p className="text-sm text-yellow-600">Under processing</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-700">{stats?.pending_claims || 0}</p>
                  <p className="text-sm text-yellow-600">
                    {stats?.total_claims ? Math.round((stats.pending_claims / stats.total_claims) * 100) : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">Disputed Claims</p>
                    <p className="text-sm text-orange-600">Require resolution</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-700">{stats?.disputed_claims || 0}</p>
                  <p className="text-sm text-orange-600">
                    {stats?.total_claims ? Math.round((stats.disputed_claims / stats.total_claims) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-600" />
              <span>System Health</span>
            </CardTitle>
            <CardDescription>Platform performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">OCR Accuracy</span>
              <Badge className="bg-green-100 text-green-800">
                {stats?.ocr_accuracy || 0}%
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Schemes Integrated</span>
              <Badge className="bg-blue-100 text-blue-800">
                {stats?.schemes_integrated || 0}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database Status</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Connected</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Sync</span>
              <span className="text-sm text-slate-600">2 min ago</span>
            </div>

            <div className="pt-4 border-t">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Full Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Claims */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Recent Claims</span>
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              View All
            </Button>
          </CardTitle>
          <CardDescription>Latest forest rights applications</CardDescription>
        </CardHeader>
        <CardContent>
          {recentClaims.length > 0 ? (
            <div className="space-y-4">
              {recentClaims.map((claim) => (
                <div key={claim.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{claim.beneficiary_name}</p>
                      <p className="text-sm text-slate-600">{claim.village_name} | {claim.claim_type}</p>
                      <p className="text-xs text-slate-500">Area: {claim.area_claimed} hectares</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(claim.status)}>
                      {claim.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(claim.submitted_date).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No recent claims found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;