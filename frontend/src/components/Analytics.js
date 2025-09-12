import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Download,
  Filter,
  Calendar,
  MapPin,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  IndianRupee,
  Activity
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [claims, setClaims] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeFilter, stateFilter]);

  const fetchAnalyticsData = async () => {
    try {
      const [statsResponse, claimsResponse, villagesResponse] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/claims`),
        axios.get(`${API}/villages`)
      ]);
      
      setStats(statsResponse.data);
      setClaims(claimsResponse.data);
      setVillages(villagesResponse.data);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDistribution = () => {
    const statusCounts = claims.reduce((acc, claim) => {
      acc[claim.status] = (acc[claim.status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replace('_', ' ').toUpperCase(),
      count,
      percentage: Math.round((count / claims.length) * 100)
    }));
  };

  const getStateWiseStats = () => {
    const stateStats = villages.reduce((acc, village) => {
      if (!acc[village.state]) {
        acc[village.state] = {
          villages: 0,
          claims: 0,
          totalArea: 0,
          forestArea: 0,
          population: 0,
          tribalPopulation: 0
        };
      }
      
      acc[village.state].villages += 1;
      acc[village.state].totalArea += village.total_area || 0;
      acc[village.state].forestArea += village.forest_area || 0;
      acc[village.state].population += village.population || 0;
      acc[village.state].tribalPopulation += village.tribal_population || 0;
      
      return acc;
    }, {});

    // Add claims count
    claims.forEach(claim => {
      const village = villages.find(v => v.id === claim.village_id);
      if (village && stateStats[village.state]) {
        stateStats[village.state].claims += 1;
      }
    });

    return Object.entries(stateStats).map(([state, data]) => ({
      state,
      ...data
    }));
  };

  const getMonthlyTrends = () => {
    const monthlyData = claims.reduce((acc, claim) => {
      const month = new Date(claim.submitted_date).toLocaleString('default', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-6) // Last 6 months
      .map(([month, count]) => ({ month, count }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'under review': return 'text-blue-600 bg-blue-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'disputed': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const statusDistribution = getStatusDistribution();
  const stateWiseStats = getStateWiseStats();
  const monthlyTrends = getMonthlyTrends();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Analytics Dashboard</h1>
          <p className="text-slate-600">Comprehensive insights into forest rights data</p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 3 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Processing Rate</p>
                <p className="text-3xl font-bold text-blue-900">
                  {stats?.total_claims ? Math.round(((stats.approved_claims + stats.rejected_claims) / stats.total_claims) * 100) : 0}%
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+12% from last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Approval Rate</p>
                <p className="text-3xl font-bold text-green-700">
                  {stats?.total_claims ? Math.round((stats.approved_claims / stats.total_claims) * 100) : 0}%
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+8% from last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Avg. Processing Time</p>
                <p className="text-3xl font-bold text-orange-600">28</p>
                <p className="text-sm text-slate-500">days</p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">-5 days improved</span>
                </div>
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
                <p className="text-sm font-medium text-slate-600 mb-1">OCR Accuracy</p>
                <p className="text-3xl font-bold text-purple-700">{stats?.ocr_accuracy || 0}%</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+2.5% improved</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              <span>Claims Status Distribution</span>
            </CardTitle>
            <CardDescription>Current status breakdown of all claims</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${getStatusColor(item.status).split(' ')[1]}`}></div>
                    <span className="font-medium">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg">{item.count}</span>
                    <span className="text-sm text-slate-500 ml-2">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Monthly Submission Trends</span>
            </CardTitle>
            <CardDescription>Claims submitted over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyTrends.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{item.month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(item.count / Math.max(...monthlyTrends.map(m => m.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-bold w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* State-wise Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>State-wise Statistics</span>
          </CardTitle>
          <CardDescription>Comprehensive breakdown by state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">State</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Villages</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Claims</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Forest Area (ha)</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Tribal Pop.</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {stateWiseStats.map((state, index) => (
                  <tr key={index} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{state.state}</td>
                    <td className="py-3 px-4 text-right">{state.villages}</td>
                    <td className="py-3 px-4 text-right">{state.claims}</td>
                    <td className="py-3 px-4 text-right">{state.forestArea.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">{state.tribalPopulation.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant="outline" className="text-xs">
                        {state.villages > 0 ? Math.round((state.claims / state.villages) * 100) : 0}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">System Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Database Response</span>
              <Badge className="bg-green-100 text-green-800">Fast (&lt; 100ms)</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">OCR Processing</span>
              <Badge className="bg-yellow-100 text-yellow-800">Moderate (2-5s)</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">AI Analysis</span>
              <Badge className="bg-green-100 text-green-800">Fast (&lt; 1s)</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Data Quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Document Accuracy</span>
              <span className="font-medium">94.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Geocoding Precision</span>
              <span className="font-medium">96.8%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Data Completeness</span>
              <span className="font-medium">91.5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Budget Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">MGNREGA Linked</span>
              <span className="font-medium">{formatCurrency(85000000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">PM-KISAN Linked</span>
              <span className="font-medium">{formatCurrency(40000000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Total Budget</span>
              <span className="font-medium text-green-600">{formatCurrency(125000000)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;