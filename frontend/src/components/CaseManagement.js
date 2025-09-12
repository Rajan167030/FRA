import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Search, 
  Filter, 
  FileText, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  Download,
  Upload,
  Bot,
  MessageSquare
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../App';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CaseManagement = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const fetchClaims = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      
      const response = await axios.get(`${API}/claims`, { params });
      setClaims(response.data);
    } catch (error) {
      console.error('Failed to fetch claims:', error);
      toast.error('Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.beneficiary_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.village_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'under_review': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'disputed': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'under_review': return <Eye className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'disputed': return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const updateClaimStatus = async (claimId, newStatus, notes = '') => {
    setActionLoading(true);
    try {
      await axios.put(`${API}/claims/${claimId}/status`, {
        status: newStatus,
        notes: notes
      });
      
      // Refresh claims
      await fetchClaims();
      setSelectedClaim(null);
      setActionNotes('');
      toast.success(`Claim ${newStatus} successfully`);
    } catch (error) {
      console.error('Failed to update claim status:', error);
      toast.error('Failed to update claim status');
    } finally {
      setActionLoading(false);
    }
  };

  const canTakeAction = (claim) => {
    return ['admin', 'officer'].includes(user?.role) && 
           ['pending', 'under_review'].includes(claim.status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Case Management</h1>
          <p className="text-slate-600">Manage forest rights claims and applications</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by beneficiary name, village, or claim number..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {['pending', 'under_review', 'approved', 'rejected', 'disputed'].map(status => {
          const count = claims.filter(c => c.status === status).length;
          return (
            <Card key={status} className="text-center">
              <CardContent className="p-4">
                <div className="flex items-center justify-center mb-2">
                  {getStatusIcon(status)}
                </div>
                <p className="text-2xl font-bold text-slate-900">{count}</p>
                <p className="text-sm text-slate-600 capitalize">
                  {status.replace('_', ' ')}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Claims List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Forest Rights Claims ({filteredClaims.length})</span>
          </CardTitle>
          <CardDescription>Click on any claim to view details and take actions</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClaims.length > 0 ? (
            <div className="space-y-4">
              {filteredClaims.map((claim) => (
                <div 
                  key={claim.id} 
                  className="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedClaim(claim)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{claim.beneficiary_name}</h4>
                        <p className="text-sm text-slate-600">{claim.village_name} | {claim.claim_type}</p>
                        <p className="text-xs text-slate-500">
                          Claim #{claim.claim_number} | Area: {claim.area_claimed} ha
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={`${getStatusColor(claim.status)} mb-2`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(claim.status)}
                          <span>{claim.status.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </Badge>
                      <p className="text-xs text-slate-500">
                        Submitted: {new Date(claim.submitted_date).toLocaleDateString('en-IN')}
                      </p>
                      {claim.ai_recommendation && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Bot className="w-3 h-3 text-purple-600" />
                          <span className="text-xs text-purple-600">
                            AI: {claim.ai_recommendation.decision} ({Math.round(claim.ai_recommendation.confidence * 100)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No claims found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claim Details Dialog */}
      {selectedClaim && (
        <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Claim Details - {selectedClaim.beneficiary_name}</span>
              </DialogTitle>
              <DialogDescription>
                Claim #{selectedClaim.claim_number} | {selectedClaim.village_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Beneficiary Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Name:</span>
                      <span className="font-medium">{selectedClaim.beneficiary_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Father's Name:</span>
                      <span className="font-medium">{selectedClaim.beneficiary_father_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Claim Type:</span>
                      <Badge variant="outline">{selectedClaim.claim_type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Area Claimed:</span>
                      <span className="font-medium">{selectedClaim.area_claimed} hectares</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                      Location Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Village:</span>
                      <span className="font-medium">{selectedClaim.village_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <Badge className={getStatusColor(selectedClaim.status)}>
                        {selectedClaim.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Submitted:</span>
                      <span className="font-medium">
                        {new Date(selectedClaim.submitted_date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Last Updated:</span>
                      <span className="font-medium">
                        {new Date(selectedClaim.last_updated).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Recommendation */}
              {selectedClaim.ai_recommendation && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Bot className="w-5 h-5 mr-2 text-purple-600" />
                      AI Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium text-lg">
                          Recommendation: 
                          <span className={`ml-2 ${
                            selectedClaim.ai_recommendation.decision === 'approve' ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {selectedClaim.ai_recommendation.decision.toUpperCase()}
                          </span>
                        </p>
                        <p className="text-sm text-slate-600">
                          Confidence: {Math.round(selectedClaim.ai_recommendation.confidence * 100)}%
                        </p>
                      </div>
                    </div>
                    
                    {selectedClaim.ai_recommendation.reasons && (
                      <div>
                        <h4 className="font-medium mb-2">Supporting Reasons:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                          {selectedClaim.ai_recommendation.reasons.map((reason, index) => (
                            <li key={index}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Linked Schemes */}
              {selectedClaim.linked_schemes.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Linked Government Schemes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedClaim.linked_schemes.map((scheme, index) => (
                        <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                          {scheme}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              {canTakeAction(selectedClaim) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Take Action</CardTitle>
                    <CardDescription>Review and update the status of this claim</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Add notes or comments..."
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      className="min-h-[100px]"
                    />
                    
                    <div className="flex space-x-3">
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateClaimStatus(selectedClaim.id, 'approved', actionNotes)}
                        disabled={actionLoading}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => updateClaimStatus(selectedClaim.id, 'under_review', actionNotes)}
                        disabled={actionLoading}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Mark for Review
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                        onClick={() => updateClaimStatus(selectedClaim.id, 'rejected', actionNotes)}
                        disabled={actionLoading}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CaseManagement;