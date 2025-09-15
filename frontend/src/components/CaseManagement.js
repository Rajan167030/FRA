import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  User,
  MapPin,
  Calendar,
  Download,
  Upload,
  Bot,
  MessageSquare,
  Scan,
  Image,
  FileX,
  Loader2,
  Camera,
  RotateCcw,
  Check,
  X,
  Globe
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
  const [showOcrDialog, setShowOcrDialog] = useState(false);
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [newClaimData, setNewClaimData] = useState({
    beneficiary_name: '',
    father_name: '',
    village: '',
    district: '',
    area_claimed: '',
    survey_number: '',
    claim_type: 'Individual Forest Rights'
  });
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
    
    const matchesStatus = !statusFilter || statusFilter === 'all' || claim.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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

  // OCR Functions
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setOcrFile(file);
      setOcrResult(null);
    } else {
      toast.error('Please select a valid image file');
    }
  };

  const processDocument = async () => {
    if (!ocrFile) {
      toast.error('Please select a document image first');
      return;
    }

    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', ocrFile);

      // Call AI service
      const response = await axios.post('http://localhost:8000/api/process-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setOcrResult(response.data);
        
        // Auto-fill form with extracted data
        const entities = response.data.entities;
        setNewClaimData(prev => ({
          ...prev,
          beneficiary_name: entities.holder_name || prev.beneficiary_name,
          father_name: entities.father_name || prev.father_name,
          village: entities.village || prev.village,
          district: entities.district || prev.district,
          area_claimed: entities.area || prev.area_claimed,
          survey_number: entities.survey_number || prev.survey_number,
        }));

        toast.success('Document processed successfully! Form auto-filled with extracted data.');
      } else {
        throw new Error('Failed to process document');
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      toast.error('Failed to process document. Make sure AI service is running.');
    } finally {
      setOcrLoading(false);
    }
  };

  // Camera Functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',  // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `document-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setOcrFile(file);
        stopCamera();
        toast.success('Photo captured! Ready for processing.');
      }
    }, 'image/jpeg', 0.8);
  };

  const submitNewClaim = async () => {
    try {
      const claimData = {
        ...newClaimData,
        submitted_date: new Date().toISOString(),
        status: 'pending',
        latitude: ocrResult?.entities?.coordinates?.[0] || 21.2514,
        longitude: ocrResult?.entities?.coordinates?.[1] || 81.6296,
        document_hash: ocrResult?.document_hash,
        ai_processed: ocrResult ? true : false
      };

      await axios.post(`${API}/claims`, claimData);
      
      // Refresh claims list
      await fetchClaims();
      
      // Reset form
      setNewClaimData({
        beneficiary_name: '',
        father_name: '',
        village: '',
        district: '',
        area_claimed: '',
        survey_number: '',
        claim_type: 'Individual Forest Rights'
      });
      setOcrFile(null);
      setOcrResult(null);
      setShowOcrDialog(false);
      
      toast.success('New claim submitted successfully');
    } catch (error) {
      console.error('Failed to submit claim:', error);
      toast.error('Failed to submit claim');
    }
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
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Dialog open={showOcrDialog} onOpenChange={setShowOcrDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Scan className="w-4 h-4 mr-2" />
                OCR Scan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-purple-600" />
                  AI-Powered Document Processing
                </DialogTitle>
                <DialogDescription>
                  Upload a document image to extract information using OCR and NLP
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Document Upload Section */}
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {!showCamera ? (
                      <>
                        <Image className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <div className="space-y-3">
                          <div>
                            <span className="text-lg font-medium text-gray-700">
                              Upload or Capture Document
                            </span>
                            <p className="text-sm text-gray-500 mt-1">
                              PNG, JPG files up to 10MB
                            </p>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <label htmlFor="document-upload" className="cursor-pointer">
                              <Button variant="outline" className="w-full sm:w-auto" asChild>
                                <span>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload File
                                </span>
                              </Button>
                              <input
                                id="document-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                              />
                            </label>
                            
                            <Button 
                              onClick={startCamera}
                              variant="outline"
                              className="w-full sm:w-auto bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Use Camera
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full max-w-md mx-auto rounded-lg border-4 border-purple-200"
                          />
                          <div className="absolute inset-0 border-2 border-dashed border-purple-400 rounded-lg pointer-events-none"></div>
                        </div>
                        
                        <div className="flex justify-center space-x-2">
                          <Button onClick={capturePhoto} className="bg-purple-600 hover:bg-purple-700">
                            <Camera className="w-4 h-4 mr-2" />
                            Capture
                          </Button>
                          <Button onClick={stopCamera} variant="outline">
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                        
                        <p className="text-sm text-purple-600">
                          📋 Position the document within the frame and click Capture
                        </p>
                      </div>
                    )}
                    
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {ocrFile && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <Image className="w-5 h-5 mr-2 text-blue-600" />
                          <p className="text-sm font-medium text-blue-900">
                            {ocrFile.name || 'Captured Image'}
                          </p>
                        </div>
                        <div className="flex space-x-2 justify-center">
                          <Button
                            onClick={processDocument}
                            disabled={ocrLoading}
                            className="bg-purple-600 hover:bg-purple-700"
                            size="sm"
                          >
                            {ocrLoading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Bot className="w-4 h-4 mr-2" />
                            )}
                            {ocrLoading ? 'Processing with AI...' : 'Process with AI'}
                          </Button>
                          <Button
                            onClick={() => setOcrFile(null)}
                            variant="outline"
                            size="sm"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced OCR Results */}
                  {ocrResult && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center mb-3">
                        <Bot className="w-5 h-5 mr-2 text-green-600" />
                        <h4 className="font-semibold text-green-800">AI Processing Complete ✨</h4>
                        <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {Math.round(ocrResult.confidence_score * 100)}% confidence
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium mb-2 text-gray-800 flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            Extracted Text
                          </h5>
                          <div className="text-sm text-gray-600 max-h-32 overflow-y-auto bg-white p-2 rounded border">
                            {ocrResult.extracted_text || 'No text extracted'}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Language: {ocrResult.language_detected || 'Auto-detected'}
                          </p>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h5 className="font-medium mb-2 text-blue-800 flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            Key Information
                          </h5>
                          <div className="space-y-1 text-sm">
                            {ocrResult.entities && ocrResult.entities.length > 0 ? (
                              ocrResult.entities.map((entity, idx) => (
                                <div key={idx} className="flex justify-between bg-white p-2 rounded border">
                                  <span className="font-medium text-blue-700">{entity.label}:</span>
                                  <span className="text-blue-600">{entity.text}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-blue-600 italic bg-white p-2 rounded border">
                                🔍 Processing entities...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {ocrResult.coordinates && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h5 className="font-medium mb-2 text-green-800 flex items-center">
                            <Globe className="w-4 h-4 mr-2" />
                            Location & Forest Analysis
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div className="bg-white p-3 rounded border">
                              <span className="font-medium text-green-700 block">Coordinates:</span>
                              <p className="text-green-600 font-mono">
                                {ocrResult.coordinates.lat.toFixed(6)}, {ocrResult.coordinates.lng.toFixed(6)}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <span className="font-medium text-green-700 block">Forest Cover:</span>
                              <p className="text-green-600 font-semibold">
                                {ocrResult.forest_analysis?.cover_percentage || 'Analyzing...'}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <span className="font-medium text-green-700 block">Risk Level:</span>
                              <p className="text-green-600 font-semibold">
                                {ocrResult.risk_assessment || 'Computing...'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Blockchain Verification Status */}
                      {ocrResult.blockchain_verification && (
                        <div className={`p-4 rounded-lg border-l-4 ${
                          ocrResult.blockchain_verification.success && !ocrResult.blockchain_verification.error 
                            ? 'bg-emerald-50 border-emerald-400' 
                            : 'bg-amber-50 border-amber-400'
                        }`}>
                          <h5 className="font-medium mb-2 flex items-center">
                            {ocrResult.blockchain_verification.success && !ocrResult.blockchain_verification.error ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                                <span className="text-emerald-800">🔗 Blockchain Verified</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
                                <span className="text-amber-800">⚠️ Verification Pending</span>
                              </>
                            )}
                          </h5>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            {ocrResult.blockchain_verification.transactionId && (
                              <div className="bg-white p-3 rounded border">
                                <span className="font-medium text-gray-700 block">Transaction ID:</span>
                                <p className="font-mono text-xs text-blue-600 break-all">
                                  {ocrResult.blockchain_verification.transactionId}
                                </p>
                              </div>
                            )}
                            
                            {ocrResult.blockchain_verification.blockNumber && (
                              <div className="bg-white p-3 rounded border">
                                <span className="font-medium text-gray-700 block">Block Number:</span>
                                <p className="text-green-600 font-semibold">
                                  #{ocrResult.blockchain_verification.blockNumber}
                                </p>
                              </div>
                            )}
                            
                            {ocrResult.blockchain_verification.documentHash && (
                              <div className="bg-white p-3 rounded border sm:col-span-2">
                                <span className="font-medium text-gray-700 block">Document Hash:</span>
                                <p className="font-mono text-xs text-purple-600 break-all">
                                  {ocrResult.blockchain_verification.documentHash}
                                </p>
                              </div>
                            )}
                            
                            {ocrResult.blockchain_verification.network && (
                              <div className="bg-white p-3 rounded border">
                                <span className="font-medium text-gray-700 block">Network:</span>
                                <p className="text-blue-600">
                                  {ocrResult.blockchain_verification.network}
                                </p>
                              </div>
                            )}
                            
                            {ocrResult.blockchain_verification.timestamp && (
                              <div className="bg-white p-3 rounded border">
                                <span className="font-medium text-gray-700 block">Verified At:</span>
                                <p className="text-gray-600 text-xs">
                                  {new Date(ocrResult.blockchain_verification.timestamp).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {ocrResult.blockchain_verification.immutable && (
                            <div className="mt-3 p-2 bg-white rounded border flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                              <span className="text-xs text-green-700 font-medium">
                                🛡️ Immutable record - Cannot be altered or deleted
                              </span>
                            </div>
                          )}
                          
                          {ocrResult.blockchain_verification.error && (
                            <div className="mt-3 p-2 bg-amber-100 border border-amber-300 rounded">
                              <span className="text-xs text-amber-700">
                                ⚠️ {ocrResult.blockchain_verification.error}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => {
                              // Auto-fill the form with extracted data
                              setNewClaimData(prev => ({
                                ...prev,
                                beneficiary_name: ocrResult.beneficiary_name || prev.beneficiary_name,
                                land_area: ocrResult.land_area || prev.land_area,
                                location_details: ocrResult.extracted_text || prev.location_details,
                                coordinates: ocrResult.coordinates || prev.coordinates
                              }));
                              setShowOcrDialog(false);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Auto-Fill Form
                          </Button>
                          <Button
                            onClick={() => {
                              // Download extracted data as JSON
                              const dataStr = JSON.stringify(ocrResult, null, 2);
                              const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                              const exportFileDefaultName = `ocr_result_${Date.now()}.json`;
                              const linkElement = document.createElement('a');
                              linkElement.setAttribute('href', dataUri);
                              linkElement.setAttribute('download', exportFileDefaultName);
                              linkElement.click();
                            }}
                            variant="outline"
                            className="border-purple-200 text-purple-700 hover:bg-purple-50"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export Data
                          </Button>
                        </div>
                        <Button
                          onClick={() => {
                            setOcrResult(null);
                            setOcrFile(null);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Process Another
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Auto-filled Form */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">New Claim Form</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beneficiary Name
                      </label>
                      <Input
                        value={newClaimData.beneficiary_name}
                        onChange={(e) => setNewClaimData(prev => ({...prev, beneficiary_name: e.target.value}))}
                        placeholder="Enter beneficiary name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Father's Name
                      </label>
                      <Input
                        value={newClaimData.father_name}
                        onChange={(e) => setNewClaimData(prev => ({...prev, father_name: e.target.value}))}
                        placeholder="Enter father's name"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Village
                        </label>
                        <Input
                          value={newClaimData.village}
                          onChange={(e) => setNewClaimData(prev => ({...prev, village: e.target.value}))}
                          placeholder="Village name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          District
                        </label>
                        <Input
                          value={newClaimData.district}
                          onChange={(e) => setNewClaimData(prev => ({...prev, district: e.target.value}))}
                          placeholder="District name"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Area Claimed (Hectares)
                        </label>
                        <Input
                          type="number"
                          value={newClaimData.area_claimed}
                          onChange={(e) => setNewClaimData(prev => ({...prev, area_claimed: e.target.value}))}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Survey Number
                        </label>
                        <Input
                          value={newClaimData.survey_number}
                          onChange={(e) => setNewClaimData(prev => ({...prev, survey_number: e.target.value}))}
                          placeholder="Survey number"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Claim Type
                      </label>
                      <Select 
                        value={newClaimData.claim_type} 
                        onValueChange={(value) => setNewClaimData(prev => ({...prev, claim_type: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Individual Forest Rights">Individual Forest Rights</SelectItem>
                          <SelectItem value="Community Forest Rights">Community Forest Rights</SelectItem>
                          <SelectItem value="Development Rights">Development Rights</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setShowOcrDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={submitNewClaim}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Submit Claim
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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