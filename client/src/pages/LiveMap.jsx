import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { Loader2, ThumbsUp, CheckCircle, MessageSquare } from 'lucide-react';
import L from 'leaflet';

// Fix for default marker icon in Leaflet + Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Severity Icons
const createCustomIcon = (color) => {
    return new L.DivIcon({
        className: 'custom-icon',
        html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -10]
    });
};

export default function LiveMap() {
    const [reports, setReports] = useState([]);
    const [userLocation, setUserLocation] = useState({ lat: 51.505, lng: -0.09 }); // Default London
    const [filter, setFilter] = useState('all'); // all, open, resolved
    const [loadingLocation, setLoadingLocation] = useState(true);

    // 1. Get User Location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLoadingLocation(false);
                },
                () => setLoadingLocation(false)
            );
        } else {
            setLoadingLocation(false);
        }
    }, []);

    // 2. Fetch Reports
    useEffect(() => {
        // Mock Mode Check
        const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
        if (!apiKey || apiKey.includes('your_api_key')) {
            console.warn("Using Mock Data for Map");
            const loadMockData = () => {
                let mockData = JSON.parse(localStorage.getItem('mockReports') || '[]');
                // Add logic to filter if needed
                if (filter !== 'all') {
                    mockData = mockData.filter(r => r.status === filter);
                }
                setReports(mockData);
            };

            loadMockData();
            const interval = setInterval(loadMockData, 2000); // Poll for updates
            return () => clearInterval(interval);
        }

        let q = query(collection(db, "reports"), orderBy("timestamp", "desc"), limit(50));
        // Note: Real Firestore filtering requires composite indexes, doing client-side filter for simplicity for now
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (filter !== 'all') {
                setReports(data.filter(r => r.status === filter));
            } else {
                setReports(data);
            }
        });
        return () => unsubscribe();
    }, [filter]);

    // Actions
    const handleUpvote = async (report) => {
        const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
        if (!apiKey || apiKey.includes('your_api_key')) {
            // Mock Upvote
            const mockReports = JSON.parse(localStorage.getItem('mockReports') || '[]');
            const index = mockReports.findIndex(r => r.id === report.id);
            if (index !== -1) {
                mockReports[index].votes = (mockReports[index].votes || 0) + 1;
                localStorage.setItem('mockReports', JSON.stringify(mockReports));
                // Force refresh handled by polling
            }
            return;
        }

        // Real Upvote
        const reportRef = doc(db, "reports", report.id);
        await updateDoc(reportRef, { votes: increment(1) });
    };

    const handleResolve = async (report) => {
        const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
        if (!apiKey || apiKey.includes('your_api_key')) {
            // Mock Resolve
            const mockReports = JSON.parse(localStorage.getItem('mockReports') || '[]');
            const index = mockReports.findIndex(r => r.id === report.id);
            if (index !== -1) {
                mockReports[index].status = 'resolved';
                localStorage.setItem('mockReports', JSON.stringify(mockReports));
            }
            return;
        }

        const reportRef = doc(db, "reports", report.id);
        await updateDoc(reportRef, { status: "resolved" });
    };


    if (loadingLocation) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-google-blue" /></div>;
    }

    return (
        <div className="h-screen w-full relative">
            {/* Filter Controls */}
            <div className="absolute top-24 left-4 z-[1000] bg-white p-2 rounded-lg shadow-lg flex flex-col gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition ${filter === 'all' ? 'bg-google-blue text-white' : 'hover:bg-gray-100'}`}
                >
                    All Issues
                </button>
                <button
                    onClick={() => setFilter('open')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition ${filter === 'open' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}
                >
                    Unresolved
                </button>
                <button
                    onClick={() => setFilter('resolved')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition ${filter === 'resolved' ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100'}`}
                >
                    Fixed
                </button>
            </div>

            <MapContainer
                center={[userLocation.lat, userLocation.lng]}
                zoom={13}
                scrollWheelZoom={true}
                className="h-full w-full"
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />

                {/* User Position */}
                <Marker position={[userLocation.lat, userLocation.lng]} icon={createCustomIcon('#4285F4')}>
                    <Popup>You are here</Popup>
                </Marker>

                {reports.map((report) => (
                    <Marker
                        key={report.id}
                        position={[report.location.lat, report.location.lng]}
                        icon={createCustomIcon(
                            report.status === 'resolved' ? '#34A853' :
                                report.severity === 'High' ? '#EA4335' :
                                    report.severity === 'Medium' ? '#FBBC04' : '#34A853'
                        )}
                    >
                        <Popup className="custom-popup">
                            <div className="w-64 p-1">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                            report.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {report.status === 'resolved' ? 'RESOLVED' : report.severity}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(report.timestamp?.seconds * 1000 || Date.now()).toLocaleDateString()}
                                    </span>
                                </div>

                                <h3 className="font-bold text-gray-800 text-base mb-1">{report.type}</h3>
                                <p className="text-gray-600 text-sm mb-3">{report.description}</p>

                                <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100 mb-3">
                                    <img src={report.imageUrl} alt="Issue" className="w-full h-full object-cover" />
                                </div>

                                <div className="flex gap-2 border-t pt-3">
                                    <button
                                        onClick={() => handleUpvote(report)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md hover:bg-gray-50 text-gray-600 text-xs font-medium transition"
                                    >
                                        <ThumbsUp size={14} />
                                        {report.votes || 0}
                                    </button>

                                    {report.status !== 'resolved' && (
                                        <button
                                            onClick={() => handleResolve(report)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium transition"
                                        >
                                            <CheckCircle size={14} />
                                            Resolve
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}

// Helper to smooth scroll map when user loc changes
function RecenterMap({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lng], map.getZoom());
    }, [lat, lng, map]);
    return null;
}
