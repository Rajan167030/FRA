import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Search, 
  MapPin, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Navigation,
  TreePine,
  Home,
  Users,
  FileText,
  Filter,
  Info,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ForestAtlas = () => {
  const [villages, setVillages] = useState([]);
  const [claims, setClaims] = useState([]);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [layersVisible, setLayersVisible] = useState({
    villages: true,
    claims: true,
    boundaries: true,
    satellite: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      const [villagesResponse, claimsResponse] = await Promise.all([
        axios.get(`${API}/villages`),
        axios.get(`${API}/claims`)
      ]);
      
      setVillages(villagesResponse.data);
      setClaims(claimsResponse.data);
    } catch (error) {
      console.error('Failed to fetch map data:', error);
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  const filteredVillages = villages.filter(village => {
    const matchesSearch = village.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         village.village_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = !stateFilter || stateFilter === 'all' || village.state === stateFilter;
    const matchesDistrict = !districtFilter || districtFilter === 'all' || village.district === districtFilter;
    
    return matchesSearch && matchesState && matchesDistrict;
  });

  const getVillageClaims = (villageId) => {
    return claims.filter(claim => claim.village_id === villageId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'under_review': return 'bg-blue-500';
      case 'rejected': return 'bg-red-500';
      case 'disputed': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const states = [...new Set(villages.map(v => v.state))];
  const districts = stateFilter ? 
    [...new Set(villages.filter(v => v.state === stateFilter).map(v => v.district))] : 
    [...new Set(villages.map(v => v.district))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading forest atlas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Forest Rights Atlas</h1>
          <p className="text-slate-600">Interactive map of forest villages and claims</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Controls & Filters */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Search className="w-5 h-5 mr-2 text-blue-600" />
                Search Villages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={districtFilter} onValueChange={setDistrictFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {districts.map(district => (
                    <SelectItem key={district} value={district}>{district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Layer Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Layers className="w-5 h-5 mr-2 text-blue-600" />
                Map Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(layersVisible).map(([layer, visible]) => (
                <div key={layer} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {layer.replace('_', ' ')}
                  </span>
                  <Button
                    variant={visible ? "default" : "outline"}
                    size="sm"
                    className="w-16"
                    onClick={() => setLayersVisible(prev => ({
                      ...prev,
                      [layer]: !prev[layer]
                    }))}
                  >
                    {visible ? 'ON' : 'OFF'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Map Statistics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Info className="w-5 h-5 mr-2 text-blue-600" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Total Villages</span>
                <Badge variant="secondary">{filteredVillages.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Total Claims</span>
                <Badge variant="secondary">{claims.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">States Covered</span>
                <Badge variant="secondary">{states.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map Area */}
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Interactive Forest Map
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-full">
              {/* Mock Map Interface */}
              <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 rounded-lg relative overflow-hidden">
                {/* Mock satellite/terrain background */}
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-full bg-gradient-to-br from-green-200 via-green-300 to-blue-200"></div>
                </div>
                
                {/* Mock villages and claims markers */}
                <div className="absolute inset-0 p-4">
                  {filteredVillages.slice(0, 10).map((village, index) => {
                    const villageClaims = getVillageClaims(village.id);
                    const left = 20 + (index % 4) * 20;
                    const top = 20 + Math.floor(index / 4) * 25;
                    
                    return (
                      <div
                        key={village.id}
                        className={`absolute cursor-pointer transform transition-all hover:scale-110 ${
                          selectedVillage?.id === village.id ? 'z-10' : ''
                        }`}
                        style={{ left: `${left}%`, top: `${top}%` }}
                        onClick={() => setSelectedVillage(village)}
                      >
                        <div className="relative group">
                          <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                            villageClaims.length > 0 ? 'bg-blue-600' : 'bg-green-600'
                          }`}></div>
                          
                          {/* Claims indicators */}
                          {villageClaims.length > 0 && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">{villageClaims.length}</span>
                            </div>
                          )}
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {village.name}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Map Legend */}
                  <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
                    <h4 className="font-medium text-sm mb-2">Legend</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                        <span>Villages</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <span>Villages with Claims</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span>Claim Count</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Scale */}
                  <div className="absolute bottom-4 right-4 bg-white p-2 rounded text-xs">
                    Scale: 1:50,000
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Village Details Panel */}
      {selectedVillage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Home className="w-5 h-5 text-blue-600" />
                <span>{selectedVillage.name}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedVillage(null)}
              >
                Close
              </Button>
            </CardTitle>
            <CardDescription>
              {selectedVillage.district}, {selectedVillage.state} | Code: {selectedVillage.village_code}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Village Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Village Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Area:</span>
                    <span className="font-medium">{selectedVillage.total_area} ha</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Forest Area:</span>
                    <span className="font-medium">{selectedVillage.forest_area} ha</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Population:</span>
                    <span className="font-medium">{selectedVillage.population}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tribal Population:</span>
                    <span className="font-medium">{selectedVillage.tribal_population}</span>
                  </div>
                </div>
              </div>

              {/* Claims Summary */}
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Claims Overview</h4>
                {getVillageClaims(selectedVillage.id).length > 0 ? (
                  <div className="space-y-2">
                    {getVillageClaims(selectedVillage.id).map((claim) => (
                      <div key={claim.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{claim.beneficiary_name}</span>
                          <Badge className={`${getStatusColor(claim.status)} text-white text-xs`}>
                            {claim.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-600">
                          <p>{claim.claim_type} | {claim.area_claimed} ha</p>
                          <p>Submitted: {new Date(claim.submitted_date).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No forest rights claims found for this village.</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Quick Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    View All Claims
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Beneficiary List
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <TreePine className="w-4 h-4 mr-2" />
                    Forest Survey
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ForestAtlas;