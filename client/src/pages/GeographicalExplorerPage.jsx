import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  LocateFixed,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Wind
} from 'lucide-react';
import airguardApi from '../services/api';
import 'leaflet/dist/leaflet.css';

// Fix standard Leaflet default marker icon paths in Vite bundles
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom glowing station marker pin
const createStationIcon = (color = '#10b981') => {
  return L.divIcon({
    className: 'custom-station-pin',
    html: `
      <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${color}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="width: 14px; height: 14px; border-radius: 50%; background-color: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 0 12px ${color}; position: relative; z-index: 2;"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
};

function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true });
      map.invalidateSize();
    }
  }, [center, zoom, map]);
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 200);
    const t2 = setTimeout(() => map.invalidateSize(), 700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);
  return null;
}

export default function GeographicalExplorerPage() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const [mapCenter, setMapCenter] = useState([21.7679, 78.8718]); // India geographic center
  const [zoomLevel, setZoomLevel] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [tileMode, setTileMode] = useState('osm'); // 'osm' or 'carto'
  
  // Proximity search inputs
  const [queryLat, setQueryLat] = useState('28.6139'); // Central Delhi
  const [queryLon, setQueryLon] = useState('77.2090');
  const [nearestResults, setNearestResults] = useState([]);
  const [searchingNearest, setSearchingNearest] = useState(false);
  
  const navigate = useNavigate();

  const fetchStations = async () => {
    try {
      setLoading(true);
      const res = await airguardApi.getStations();
      setStations(res.data || []);
    } catch (err) {
      console.error('Failed to load stations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleStationClick = (st) => {
    setSelectedStation(st);
    if (st.latitude && st.longitude) {
      setMapCenter([st.latitude, st.longitude]);
      setZoomLevel(12);
    }
  };

  const handleProximitySearch = async () => {
    if (!queryLat || !queryLon) return;
    try {
      setSearchingNearest(true);
      const res = await airguardApi.getNearestStations(queryLat, queryLon, 150000);
      const results = res.data || [];
      setNearestResults(results);
      if (results.length > 0) {
        setSelectedStation(results[0]);
        setMapCenter([parseFloat(queryLat), parseFloat(queryLon)]);
        setZoomLevel(9);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingNearest(false);
    }
  };

  const filteredStations = stations.filter((st) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      st.station_name?.toLowerCase().includes(term) ||
      st.city?.toLowerCase().includes(term) ||
      st.state?.toLowerCase().includes(term)
    );
  });

  const uniqueCitiesCount = new Set(stations.map((s) => s.city)).size;

  return (
    <div className="space-y-6">
      {/* Header & Spatial Proximity Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Geographical Station Explorer
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
              MongoDB 2dsphere GIS
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-world continuous ambient air monitoring stations (CAAQMS) mapped across {uniqueCitiesCount || 26} Indian metropolitan centers.
          </p>
        </div>

        {/* Spatial Proximity Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-[#0B0F19] p-1.5 rounded-xl border border-white/10">
          <div className="flex items-center gap-1.5 px-2">
            <span className="text-[10px] font-mono text-slate-400">Lat:</span>
            <input
              type="text"
              value={queryLat}
              onChange={(e) => setQueryLat(e.target.value)}
              className="w-16 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] font-mono text-slate-400 ml-1">Lon:</span>
            <input
              type="text"
              value={queryLon}
              onChange={(e) => setQueryLon(e.target.value)}
              className="w-16 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={handleProximitySearch}
            disabled={searchingNearest}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${searchingNearest ? 'animate-spin' : ''}`} />
            <span>Find Nearest</span>
          </button>
          <button
            onClick={() => setTileMode(tileMode === 'osm' ? 'carto' : 'osm')}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium border border-white/10 transition"
            title="Toggle Map Tile Style"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{tileMode === 'osm' ? 'Street' : 'Carto'}</span>
          </button>
        </div>
      </div>

      {/* Main Map + Station Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-3 h-[580px] rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl bg-[#0B0F19]">
          <MapContainer
            center={mapCenter}
            zoom={zoomLevel}
            style={{ width: '100%', height: '100%', minHeight: '580px' }}
            attributionControl={true}
          >
            <ChangeMapView center={mapCenter} zoom={zoomLevel} />
            <MapResizer />
            
            {tileMode === 'osm' ? (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            ) : (
              <TileLayer
                attribution='&copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                subdomains={['a', 'b', 'c', 'd']}
                maxZoom={19}
              />
            )}

            {stations.map((st) => {
              const lat = Number(st.latitude);
              const lon = Number(st.longitude);
              if (!lat || !lon) return null;
              
              const isSelected = selectedStation?.station_id === st.station_id;

              return (
                <Marker
                  key={st.station_id || `${st.city}-${lat}`}
                  position={[lat, lon]}
                  icon={createStationIcon(isSelected ? '#3b82f6' : '#10b981')}
                  eventHandlers={{
                    click: () => handleStationClick(st),
                  }}
                >
                  <Popup>
                    <div className="p-1.5 space-y-1.5 min-w-[200px]">
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
                        <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                          {st.station_id || 'CAAQMS'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-semibold">
                          {st.status || 'Active'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-white leading-tight">{st.station_name}</h4>
                      <p className="text-[11px] text-slate-300">{st.city}, {st.state}</p>
                      <div className="text-[10px] font-mono text-emerald-400/90 pt-0.5">
                        📍 {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
                      </div>
                      <button
                        onClick={() => navigate(`/monitoring?city=${encodeURIComponent(st.city)}`)}
                        className="w-full mt-2 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium transition"
                      >
                        <span>View {st.city} Telemetry</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map Overlay Badge */}
          <div className="absolute top-4 left-4 z-[500] pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl bg-[#0B0F19]/80 backdrop-blur-md border border-white/10 shadow-lg text-[11px] text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-semibold text-white">{stations.length}</span> Active Stations Mapped
            </div>
          </div>
        </div>

        {/* Stations Directory & Nearest Search Results */}
        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/10 flex flex-col h-[580px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Stations ({stations.length})
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-emerald-400 font-mono">
              2dsphere
            </span>
          </div>

          {/* Station Search Input */}
          <div className="my-2.5 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search station or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {nearestResults.length > 0 && (
            <div className="mb-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
                Nearest Station ($near match):
              </span>
              <div className="text-xs font-semibold text-white">
                {nearestResults[0].station_name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {nearestResults[0].city} • [{Number(nearestResults[0].latitude)?.toFixed(2)}°N, {Number(nearestResults[0].longitude)?.toFixed(2)}°E]
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredStations.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No stations match "{searchTerm}"
              </div>
            ) : (
              filteredStations.map((st) => (
                <div
                  key={st.station_id || `${st.city}-${st.station_name}`}
                  onClick={() => handleStationClick(st)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    selectedStation?.station_id === st.station_id
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-white shadow-sm'
                      : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="font-semibold text-slate-100 flex items-center justify-between">
                    <span>{st.station_name}</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-white/5 text-slate-400">
                      {st.station_id}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                    <span className="text-emerald-400 font-medium">{st.city}, {st.state}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {Number(st.latitude)?.toFixed(2)}°N, {Number(st.longitude)?.toFixed(2)}°E
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}