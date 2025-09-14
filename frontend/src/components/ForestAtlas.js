import React, { useState, useEffect, useRef } from 'react';
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
  RotateCcw,
  Ruler,
  Download,
  Satellite,
  Bot,
  AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

// OpenLayers imports
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { Style, Fill, Stroke, Circle as CircleStyle, Text } from 'ol/style';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Select as OlSelect } from 'ol/interaction';
import { click } from 'ol/events/condition';
import { Cluster } from 'ol/source';
import 'ol/ol.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ForestAtlas = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const villagesLayer = useRef(null);
  const claimsLayer = useRef(null);
  const selectInteraction = useRef(null);

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
  const [mapCenter, setMapCenter] = useState([78.9629, 20.5937]); // Center of India
  const [mapZoom, setMapZoom] = useState(6);
  const [currentBaseLayer, setCurrentBaseLayer] = useState('osm');
  const [spatialFilter, setSpatialFilter] = useState(false);
  const [mapExtent, setMapExtent] = useState(null);
  const [visibleInExtent, setVisibleInExtent] = useState({
    villages: 0,
    claims: 0
  });
  const [satelliteAnalysis, setSatelliteAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  
  // OpenLayers base layers
  const baseLayers = useRef({
    osm: new TileLayer({
      source: new OSM(),
      visible: true,
    }),
    satellite: new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Tiles © Esri',
      }),
      visible: false,
    }),
  });

  useEffect(() => {
    fetchMapData();
    initializeMap();
    
    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(null);
      }
    };
  }, []);

  useEffect(() => {
    updateMapLayers();
  }, [villages, claims, layersVisible]);

  useEffect(() => {
    updateVillageFilter();
  }, [searchTerm, stateFilter, districtFilter]);

  const initializeMap = () => {
    if (!mapRef.current || mapInstance.current) return;

    // Create vector sources
    const villagesSource = new VectorSource();
    const claimsSource = new VectorSource();

    // Create clustered source for villages
    const clusterSource = new Cluster({
      distance: 40,
      source: villagesSource,
    });

    // Create vector layers
    villagesLayer.current = new VectorLayer({
      source: clusterSource,
      style: createVillageStyle,
      visible: layersVisible.villages,
    });

    claimsLayer.current = new VectorLayer({
      source: claimsSource,
      style: createClaimStyle,
      visible: layersVisible.claims,
    });

    // Create map
    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [
        baseLayers.current.osm,
        baseLayers.current.satellite,
        villagesLayer.current,
        claimsLayer.current,
      ],
      view: new View({
        center: fromLonLat(mapCenter),
        zoom: mapZoom,
      }),
    });

    // Add click interaction
    selectInteraction.current = new OlSelect({
      condition: click,
      layers: [villagesLayer.current],
      style: null,
    });

    mapInstance.current.addInteraction(selectInteraction.current);

    // Add right-click event for satellite analysis
    mapInstance.current.on('contextmenu', (event) => {
      event.preventDefault();
      handleMapRightClick(event);
    });

    // Handle feature selection
    selectInteraction.current.on('select', (event) => {
      if (event.selected.length > 0) {
        const feature = event.selected[0];
        const features = feature.get('features');
        
        if (features && features.length === 1) {
          // Single village selection
          const villageData = features[0].get('villageData');
          setSelectedVillage(villageData);
        } else if (features && features.length > 1) {
          // Cluster selection - zoom in
          const extent = clusterSource.getExtent();
          mapInstance.current.getView().fit(extent, { duration: 500, padding: [20, 20, 20, 20] });
        }
      }
    });

    // Update map center and zoom state on view changes
    mapInstance.current.getView().on('change:center', () => {
      const center = toLonLat(mapInstance.current.getView().getCenter());
      setMapCenter(center);
      updateSpatialStats();
    });

    mapInstance.current.getView().on('change:resolution', () => {
      setMapZoom(mapInstance.current.getView().getZoom());
      updateSpatialStats();
    });
  };

  const updateSpatialStats = async () => {
    if (!mapInstance.current || !spatialFilter) return;

    const view = mapInstance.current.getView();
    const extent = view.calculateExtent(mapInstance.current.getSize());
    setMapExtent(extent);

    // Convert OpenLayers extent to lat/lon bounding box
    const bottomLeft = toLonLat([extent[0], extent[1]]);
    const topRight = toLonLat([extent[2], extent[3]]);
    const bbox = [bottomLeft[0], bottomLeft[1], topRight[0], topRight[1]]; // [min_lon, min_lat, max_lon, max_lat]

    try {
      if (BACKEND_URL) {
        // Use backend spatial statistics endpoint
        const bboxParam = bbox.join(',');
        const response = await axios.get(`${API}/villages/spatial/stats?bbox=${bboxParam}`);
        const stats = response.data;
        
        setVisibleInExtent({
          villages: stats.villages_count || 0,
          claims: stats.claims_count || 0
        });

        // Optionally refresh map data with spatial filter
        await fetchMapData(bbox);
        return;
      }
    } catch (error) {
      console.warn('Failed to fetch spatial stats from backend, falling back to client-side calculation:', error);
    }

    // Fallback: Count features within current extent (client-side)
    let visibleVillages = 0;
    let visibleClaims = 0;

    if (villagesLayer.current) {
      const villagesSource = villagesLayer.current.getSource().getSource();
      villagesSource.getFeatures().forEach(feature => {
        const geom = feature.getGeometry();
        if (geom && geom.intersectsExtent(extent)) {
          visibleVillages++;
        }
      });
    }

    if (claimsLayer.current) {
      const claimsSource = claimsLayer.current.getSource();
      claimsSource.getFeatures().forEach(feature => {
        const geom = feature.getGeometry();
        if (geom && geom.intersectsExtent(extent)) {
          visibleClaims++;
        }
      });
    }

    setVisibleInExtent({ villages: visibleVillages, claims: visibleClaims });
  };

  // Enhanced Satellite Analysis Function
  const performSatelliteAnalysis = async (coordinates, analysisType = 'comprehensive') => {
    setAnalysisLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/analyze-satellite', {
        coordinates: {
          lat: coordinates[1],
          lon: coordinates[0]
        },
        analysis_type: analysisType,
        buffer_km: 1.0
      });

      if (response.data.success) {
        setSatelliteAnalysis({
          ...response.data.data,
          coordinates: coordinates
        });
        setShowAnalysisPanel(true);
        toast.success('Satellite analysis completed successfully!');
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Satellite analysis error:', error);
      toast.error('Failed to perform satellite analysis. Make sure AI service is running.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Handle map right-click for satellite analysis
  const handleMapRightClick = (event) => {
    if (!mapInstance.current) return;
    
    const coordinate = mapInstance.current.getEventCoordinate(event.originalEvent);
    const lonLat = toLonLat(coordinate);
    
    // Show context menu or directly perform analysis
    if (confirm(`Perform satellite analysis at coordinates: ${lonLat[1].toFixed(4)}°N, ${lonLat[0].toFixed(4)}°E?`)) {
      performSatelliteAnalysis(lonLat);
    }
  };

  const createVillageStyle = (feature) => {
    const features = feature.get('features');
    const size = features.length;
    
    if (size === 1) {
      // Single village
      const village = features[0].get('villageData');
      const villageClaims = getVillageClaims(village.id);
      const hasTribalPopulation = village.tribal_population > 0;
      
      return new Style({
        image: new CircleStyle({
          radius: hasTribalPopulation ? 8 : 6,
          fill: new Fill({
            color: villageClaims.length > 0 ? '#2563eb' : '#16a34a',
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 2,
          }),
        }),
      });
    } else {
      // Cluster
      return new Style({
        image: new CircleStyle({
          radius: Math.min(Math.max(10, size / 2 + 8), 20),
          fill: new Fill({
            color: 'rgba(37, 99, 235, 0.8)',
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 2,
          }),
        }),
        text: new Text({
          text: size.toString(),
          fill: new Fill({
            color: '#ffffff',
          }),
          font: 'bold 12px sans-serif',
        }),
      });
    }
  };

  const createClaimStyle = (feature) => {
    const claimData = feature.get('claimData');
    const colors = {
      approved: '#16a34a',
      pending: '#eab308',
      under_review: '#3b82f6',
      rejected: '#dc2626',
      disputed: '#ea580c',
    };
    
    return new Style({
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: colors[claimData.status] || '#6b7280',
        }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 1,
        }),
      }),
    });
  };

  const updateMapLayers = () => {
    if (!mapInstance.current || !villagesLayer.current || !claimsLayer.current) return;

    // Update villages layer
    const villagesSource = villagesLayer.current.getSource().getSource();
    villagesSource.clear();
    
    villages.forEach(village => {
      if (village.latitude && village.longitude) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([village.longitude, village.latitude])),
          villageData: village,
        });
        villagesSource.addFeature(feature);
      }
    });

    // Update claims layer
    const claimsSource = claimsLayer.current.getSource();
    claimsSource.clear();
    
    claims.forEach(claim => {
      if (claim.latitude && claim.longitude) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([claim.longitude, claim.latitude])),
          claimData: claim,
        });
        claimsSource.addFeature(feature);
      }
    });

    // Update layer visibility
    villagesLayer.current.setVisible(layersVisible.villages);
    claimsLayer.current.setVisible(layersVisible.claims);
    baseLayers.current.osm.setVisible(!layersVisible.satellite);
    baseLayers.current.satellite.setVisible(layersVisible.satellite);
  };

  const updateVillageFilter = () => {
    if (!mapInstance.current || !villagesLayer.current) return;

    const filtered = filteredVillages;
    const villagesSource = villagesLayer.current.getSource().getSource();
    
    villagesSource.clear();
    filtered.forEach(village => {
      if (village.latitude && village.longitude) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([village.longitude, village.latitude])),
          villageData: village,
        });
        villagesSource.addFeature(feature);
      }
    });
  };

  const handleMapControl = (action) => {
    if (!mapInstance.current) return;

    const view = mapInstance.current.getView();
    
    switch (action) {
      case 'zoom-in':
        view.animate({
          zoom: view.getZoom() + 1,
          duration: 250,
        });
        break;
      case 'zoom-out':
        view.animate({
          zoom: view.getZoom() - 1,
          duration: 250,
        });
        break;
      case 'reset-view':
        view.animate({
          center: fromLonLat(mapCenter),
          zoom: 6,
          duration: 500,
        });
        break;
      case 'fit-villages':
        if (villagesLayer.current) {
          const extent = villagesLayer.current.getSource().getSource().getExtent();
          if (extent && extent.every(coord => isFinite(coord))) {
            view.fit(extent, { duration: 500, padding: [50, 50, 50, 50] });
          }
        }
        break;
        default:
          break;
    }
  };

  const handleExportData = async () => {
    try {
      if (!BACKEND_URL) {
        // Fallback: Export current data as JSON
        const exportData = {
          villages: filteredVillages,
          claims: claims,
          metadata: {
            exported_at: new Date().toISOString(),
            total_villages: filteredVillages.length,
            total_claims: claims.length,
            spatial_filter: spatialFilter
          }
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `forest-atlas-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Data exported successfully');
        return;
      }

      // Use backend GeoJSON endpoints for export
      let bboxParam = '';
      if (spatialFilter && mapInstance.current) {
        const view = mapInstance.current.getView();
        const extent = view.calculateExtent(mapInstance.current.getSize());
        const bottomLeft = toLonLat([extent[0], extent[1]]);
        const topRight = toLonLat([extent[2], extent[3]]);
        bboxParam = `?bbox=${bottomLeft[0]},${bottomLeft[1]},${topRight[0]},${topRight[1]}`;
      }

      const [villagesResponse, claimsResponse] = await Promise.all([
        axios.get(`${API}/villages/geojson${bboxParam}`),
        axios.get(`${API}/claims/geojson${bboxParam}`)
      ]);

      const exportData = {
        type: "FeatureCollection",
        metadata: {
          exported_at: new Date().toISOString(),
          spatial_filter: spatialFilter,
          bbox: bboxParam
        },
        villages: villagesResponse.data,
        claims: claimsResponse.data
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/geo+json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forest-atlas-geojson-${new Date().toISOString().split('T')[0]}.geojson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('GeoJSON data exported successfully');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    }
  };  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async (boundingBox = null) => {
    try {
      if (BACKEND_URL && spatialFilter && boundingBox) {
        // Use backend spatial endpoints with bounding box
        const bboxParam = `${boundingBox[0]},${boundingBox[1]},${boundingBox[2]},${boundingBox[3]}`;
        const [villagesResponse, claimsResponse] = await Promise.all([
          axios.get(`${API}/villages/geojson?bbox=${bboxParam}`),
          axios.get(`${API}/claims/geojson?bbox=${bboxParam}`)
        ]);
        
        // Convert GeoJSON features back to our data format
        const villagesData = villagesResponse.data.features.map(feature => ({
          ...feature.properties,
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0]
        }));
        
        const claimsData = claimsResponse.data.features.map(feature => ({
          ...feature.properties,
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0]
        }));
        
        setVillages(villagesData);
        setClaims(claimsData);
        return;
      }
      
      // For now, use mock data with coordinates (fallback or when backend is not available)
      const mockVillages = [
        {
          id: 1,
          name: 'Khargone Village',
          village_code: 'KHG001',
          state: 'Madhya Pradesh',
          district: 'Khargone',
          total_area: 1200,
          forest_area: 800,
          population: 450,
          tribal_population: 320,
          latitude: 21.8236,
          longitude: 75.6088
        },
        {
          id: 2,
          name: 'Bastar Village',
          village_code: 'BST002',
          state: 'Chhattisgarh',
          district: 'Bastar',
          total_area: 950,
          forest_area: 700,
          population: 380,
          tribal_population: 290,
          latitude: 19.0144,
          longitude: 81.9610
        },
        {
          id: 3,
          name: 'Gadchiroli Village',
          village_code: 'GDC003',
          state: 'Maharashtra',
          district: 'Gadchiroli',
          total_area: 1100,
          forest_area: 850,
          population: 520,
          tribal_population: 410,
          latitude: 20.1809,
          longitude: 80.0046
        },
        {
          id: 4,
          name: 'Rayagada Village',
          village_code: 'RYG004',
          state: 'Odisha',
          district: 'Rayagada',
          total_area: 880,
          forest_area: 600,
          population: 340,
          tribal_population: 280,
          latitude: 19.1657,
          longitude: 83.4158
        },
        {
          id: 5,
          name: 'Wayanad Village',
          village_code: 'WYD005',
          state: 'Kerala',
          district: 'Wayanad',
          total_area: 750,
          forest_area: 580,
          population: 420,
          tribal_population: 150,
          latitude: 11.6854,
          longitude: 76.1320
        },
        {
          id: 6,
          name: 'Idukki Village',
          village_code: 'IDK006',
          state: 'Kerala',
          district: 'Idukki',
          total_area: 920,
          forest_area: 720,
          population: 290,
          tribal_population: 180,
          latitude: 9.8547,
          longitude: 76.9366
        },
        {
          id: 7,
          name: 'Dantewada Village',
          village_code: 'DTW007',
          state: 'Chhattisgarh',
          district: 'Dantewada',
          total_area: 1350,
          forest_area: 1100,
          population: 480,
          tribal_population: 420,
          latitude: 18.8951,
          longitude: 81.3496
        },
        {
          id: 8,
          name: 'Jhargram Village',
          village_code: 'JHG008',
          state: 'West Bengal',
          district: 'Jhargram',
          total_area: 650,
          forest_area: 480,
          population: 360,
          tribal_population: 220,
          latitude: 22.4517,
          longitude: 86.9937
        }
      ];

      const mockClaims = [
        {
          id: 1,
          village_id: 1,
          beneficiary_name: 'Ram Singh',
          claim_type: 'Community Forest Rights',
          area_claimed: 45,
          status: 'approved',
          submitted_date: '2023-08-15',
          latitude: 21.8256,
          longitude: 75.6108
        },
        {
          id: 2,
          village_id: 1,
          beneficiary_name: 'Sita Devi',
          claim_type: 'Individual Forest Rights',
          area_claimed: 2.5,
          status: 'pending',
          submitted_date: '2024-01-20',
          latitude: 21.8216,
          longitude: 75.6068
        },
        {
          id: 3,
          village_id: 2,
          beneficiary_name: 'Gond Community',
          claim_type: 'Community Forest Rights',
          area_claimed: 120,
          status: 'under_review',
          submitted_date: '2023-11-10',
          latitude: 19.0164,
          longitude: 81.9630
        },
        {
          id: 4,
          village_id: 3,
          beneficiary_name: 'Tribal Cooperative',
          claim_type: 'Community Forest Rights',
          area_claimed: 85,
          status: 'disputed',
          submitted_date: '2023-09-05',
          latitude: 20.1829,
          longitude: 80.0066
        },
        {
          id: 5,
          village_id: 4,
          beneficiary_name: 'Kondh Tribe',
          claim_type: 'Habitat Rights',
          area_claimed: 200,
          status: 'approved',
          submitted_date: '2023-07-22',
          latitude: 19.1677,
          longitude: 83.4178
        }
      ];

      setVillages(mockVillages);
      setClaims(mockClaims);
      
    } catch (error) {
      console.error('Failed to fetch map data:', error);
      toast.error('Failed to load map data');
      
      // Fallback to empty arrays
      setVillages([]);
      setClaims([]);
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportData}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              setLoading(true);
              fetchMapData().finally(() => setLoading(false));
            }}
          >
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
                  <span className="text-sm font-medium capitalize flex items-center">
                    {layer === 'satellite' && <Satellite className="w-4 h-4 mr-1" />}
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

          {/* Map Tools */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Ruler className="w-5 h-5 mr-2 text-blue-600" />
                Map Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant={spatialFilter ? "default" : "outline"}
                size="sm" 
                className="w-full justify-start"
                onClick={() => setSpatialFilter(!spatialFilter)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Spatial Filter {spatialFilter ? 'ON' : 'OFF'}
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Ruler className="w-4 h-4 mr-2" />
                Measure Distance
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export View
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => handleMapControl('fit-villages')}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Fit to Data
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                onClick={() => {
                  const center = toLonLat(mapInstance.current.getView().getCenter());
                  performSatelliteAnalysis(center);
                }}
                disabled={analysisLoading}
              >
                {analysisLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                ) : (
                  <Satellite className="w-4 h-4 mr-2" />
                )}
                Satellite Analysis
              </Button>
            </CardContent>
          </Card>

          {/* Spatial Statistics */}
          {spatialFilter && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Info className="w-5 h-5 mr-2 text-blue-600" />
                  Current View
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Visible Villages</span>
                  <Badge variant="secondary">{visibleInExtent.villages}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Visible Claims</span>
                  <Badge variant="secondary">{visibleInExtent.claims}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Zoom Level</span>
                  <Badge variant="outline">{mapZoom?.toFixed(1) || '6.0'}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

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
                <span className="text-sm text-slate-600">
                  {spatialFilter ? 'Filtered' : 'Total'} Villages
                </span>
                <Badge variant="secondary">
                  {spatialFilter ? visibleInExtent.villages : filteredVillages.length}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">
                  {spatialFilter ? 'Filtered' : 'Total'} Claims
                </span>
                <Badge variant="secondary">
                  {spatialFilter ? visibleInExtent.claims : claims.length}
                </Badge>
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleMapControl('zoom-out')}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleMapControl('zoom-in')}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleMapControl('reset-view')}
                  >
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-full p-0">
              {/* OpenLayers Map Container */}
              <div 
                ref={mapRef} 
                className="w-full h-full rounded-lg relative"
                style={{ minHeight: '550px' }}
              >
                {/* Map Legend - positioned over the map */}
                <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-10 max-w-48">
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
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Pending Claims</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                      <span>Rejected Claims</span>
                    </div>
                  </div>
                </div>
                
                {/* Coordinate Display and Map Info */}
                <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg z-10 text-xs">
                  <div className="p-2 border-b">
                    <div>Zoom: {mapZoom ? mapZoom.toFixed(1) : '6.0'}</div>
                  </div>
                  <div className="p-2">
                    <div>Center: {mapCenter[1]?.toFixed(3)}°N, {mapCenter[0]?.toFixed(3)}°E</div>
                  </div>
                  {spatialFilter && (
                    <div className="p-2 border-t bg-blue-50">
                      <div className="text-blue-700 font-medium">Spatial Filter ON</div>
                      <div className="text-blue-600">Showing current view only</div>
                    </div>
                  )}
                </div>
                
                {/* Loading overlay */}
                {loading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20 rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
                      <p className="mt-2 text-slate-600 text-sm">Loading map data...</p>
                    </div>
                  </div>
                )}
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

      {/* Enhanced Satellite Analysis Panel */}
      {showAnalysisPanel && satelliteAnalysis && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Satellite className="w-5 h-5 text-purple-600" />
                <span>Satellite Analysis Results</span>
                {analysisLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAnalysisPanel(false)}
              >
                Close
              </Button>
            </CardTitle>
            <CardDescription>
              Analysis for coordinates: {satelliteAnalysis.coordinates[1].toFixed(4)}°N, {satelliteAnalysis.coordinates[0].toFixed(4)}°E
              <br />
              Method: {satelliteAnalysis.analysis_method} | Date: {new Date(satelliteAnalysis.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Land Cover Analysis */}
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900 flex items-center">
                  <TreePine className="w-4 h-4 mr-2 text-green-600" />
                  Land Cover (Hectares)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Forest Area:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{satelliteAnalysis.land_cover?.forest || 0} ha</span>
                      <div className="w-3 h-3 bg-green-600 rounded"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Agriculture:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{satelliteAnalysis.land_cover?.agriculture || 0} ha</span>
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Settlement:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{satelliteAnalysis.land_cover?.settlement || 0} ha</span>
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Water Bodies:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{satelliteAnalysis.land_cover?.water || 0} ha</span>
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vegetation Health */}
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900 flex items-center">
                  <Bot className="w-4 h-4 mr-2 text-purple-600" />
                  Vegetation Health
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">NDVI:</span>
                    <span className="font-medium">{satelliteAnalysis.vegetation?.ndvi || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">EVI:</span>
                    <span className="font-medium">{satelliteAnalysis.vegetation?.evi || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Health Status:</span>
                    <Badge variant={satelliteAnalysis.vegetation?.health_status === 'Good' ? 'default' : 'secondary'}>
                      {satelliteAnalysis.vegetation?.health_status || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Forest Density:</span>
                    <span className="font-medium">{satelliteAnalysis.vegetation?.forest_density || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              {/* Forest Rights Analysis */}
              {satelliteAnalysis.fra_context && (
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-blue-600" />
                    FRA Assessment
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Forest Dependency:</span>
                      <span className="font-medium">
                        {Math.round((satelliteAnalysis.fra_context.forest_dependency_score || 0) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Recommended Claim:</span>
                      <Badge className="text-xs">
                        {satelliteAnalysis.fra_context.recommended_claim_type || 'Assessment Required'}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <span className="text-slate-600 text-xs">Documentation Priority:</span>
                      <p className="text-xs mt-1 p-2 bg-blue-50 rounded">
                        {satelliteAnalysis.fra_context.documentation_priority || 'Standard process recommended'}
                      </p>
                    </div>
                    
                    {/* Eligibility Indicators */}
                    <div className="mt-3 space-y-1">
                      <span className="text-slate-600 text-xs">Eligibility Indicators:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {satelliteAnalysis.fra_context.eligibility_indicators?.has_forest_cover && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            ✓ Forest Cover
                          </Badge>
                        )}
                        {satelliteAnalysis.fra_context.eligibility_indicators?.traditional_use && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            ✓ Traditional Use
                          </Badge>
                        )}
                        {satelliteAnalysis.fra_context.eligibility_indicators?.vegetation_health && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            ✓ Good Vegetation
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Administrative Info */}
              {satelliteAnalysis.administrative && (
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-orange-600" />
                    Location Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">State:</span>
                      <span className="font-medium">{satelliteAnalysis.administrative.state}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">District:</span>
                      <span className="font-medium">{satelliteAnalysis.administrative.district}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tehsil:</span>
                      <span className="font-medium">{satelliteAnalysis.administrative.tehsil}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Village:</span>
                      <span className="font-medium">{satelliteAnalysis.administrative.village}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Risk Assessment */}
              {satelliteAnalysis.risk_assessment && (
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                    Risk Assessment
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Encroachment Risk:</span>
                      <Badge variant={satelliteAnalysis.risk_assessment.encroachment_risk === 'Low' ? 'default' : 'secondary'}>
                        {satelliteAnalysis.risk_assessment.encroachment_risk}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Conservation Status:</span>
                      <Badge variant="outline">
                        {satelliteAnalysis.risk_assessment.conservation_status}
                      </Badge>
                    </div>
                    {satelliteAnalysis.risk_assessment.monitoring_required && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                        ⚠️ Monitoring recommended due to vegetation health concerns
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const coordinates = satelliteAnalysis.coordinates;
                  performSatelliteAnalysis(coordinates, 'temporal');
                }}
                disabled={analysisLoading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Temporal Analysis
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const data = JSON.stringify(satelliteAnalysis, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `satellite-analysis-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success('Analysis exported successfully');
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ForestAtlas;