import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Compass,
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  LocateFixed
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

// Custom station marker icon
const createStationIcon = (color = '#10b981') => {
  return L.divIcon({
    className: 'custom-station-pin',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 10px ${color};"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function GeographicalExplorerPage() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const [mapCenter, setMapCenter] = useState([21.7679, 78.8718]); // India geometric center
  const [zoomLevel, setZoomLevel] = useState(5);
  
  // Proximity search inputs
  const [queryLat, setQueryLat] = useState('28.6139'); // Central Delhi
  const [queryLon, setQueryLon] = useState('77.2090');
  const [nearestResults, setNearestResults] = useState([]);
  const [searchingNearest, setSearchingNearest] = useState(false);

  useEffect(() => {
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
      setNearestResults(res.data || []);
      setMapCenter([parseFloat(queryLat), parseFloat(queryLon)]);
      setZoomLevel(9);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingNearest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Geographical Station Explorer
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
              MongoDB 2dsphere GIS
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-world continuous ambient monitoring locations mapped with spherical spatial indexing.
          </p>
        </div>

        {/* Spatial Proximity Bar */}
        <div className="flex items-center gap-2 bg-[#0B0F19] p-1.5 rounded-xl border border-white/10">
          <div className="flex items-center gap-1.5 px-2">
            <span className="text-[10px] font-mono text-slate-400">Lat:</span>
            <input
              type="text"
              value={queryLat}
              onChange={(e) => setQueryLat(e.target.value)}
              className="w-16 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white font-mono"
            />
            <span className="text-[10px] font-mono text-slate-400 ml-1">Lon:</span>
            <input
              type="text"
              value={queryLon}
              onChange={(e) => setQueryLon(e.target.value)}
              className="w-16 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white font-mono"
            />
          </div>
          <button
            onClick={handleProximitySearch}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>Find Nearest</span>
          </button>
        </div>
      </div>

      {/* Main Map + Station Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-3 h-[560px] rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl">
          <MapContainer
            center={mapCenter}
            zoom={zoomLevel}
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
          >
            <ChangeMapView center={mapCenter} zoom={zoomLevel} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />

            {stations.map((st) => {
              if (!st.latitude || !st.longitude) return null;
              return (
                <Marker
                  key={st.station_id}
                  position={[st.latitude, st.longitude]}
                  icon={createStationIcon('#059669')}
                  eventHandlers={{
                    click: () => handleStationClick(st),
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-1">
                      <h4 className="font-bold text-xs text-slate-900">{st.station_name}</h4>
                      <p className="text-[11px] text-slate-600">{st.city}, {st.state}</p>
                      <div className="pt-1 text-[10px] font-mono text-emerald-700">
                        Coordinates: {st.latitude.toFixed(4)}°N, {st.longitude.toFixed(4)}°E
                      </div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                        {st.status || 'Active'}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Stations Directory & Nearest Search Results */}
        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/10 flex flex-col h-[560px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Stations ({stations.length})
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-emerald-400 font-mono">
              2dsphere
            </span>
          </div>

          {nearestResults.length > 0 && (
            <div className="my-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
                Nearest Station ($near match):
              </span>
              <div className="text-xs font-semibold text-white">
                {nearestResults[0].station_name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {nearestResults[0].city} • [{nearestResults[0].latitude}°N, {nearestResults[0].longitude}°E]
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 pt-2 pr-1">
            {stations.map((st) => (
              <div
                key={st.station_id}
                onClick={() => handleStationClick(st)}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                  selectedStation?.station_id === st.station_id
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                    : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/10'
                }`}
              >
                <div className="font-semibold">{st.station_name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
                  <span>{st.city}</span>
                  <span className="font-mono text-[10px] text-emerald-400">
                    {st.latitude?.toFixed(2)}°N, {st.longitude?.toFixed(2)}°E
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
