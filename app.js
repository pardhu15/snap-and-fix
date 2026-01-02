const { useState, useEffect, useRef } = React;

// --- Mock Data Service ---
const MOCK_REPORTS = [
    { id: 1, lat: 51.505, lng: -0.09, type: 'Pothole', description: 'Deep pothole on Main St.' },
    { id: 2, lat: 51.51, lng: -0.1, type: 'Garbage', description: 'Overflowing bin' }
];

// --- Components ---

function SettingsModal({ isOpen, onClose, apiKey, setApiKey }) {
    if (!isOpen) return null;
    return (
        <div className="ui-layer" style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
            <div className="glass-card">
                <div className="card-header">
                    <span className="card-title">Settings</span>
                    <button className="icon-btn" onClick={onClose}>
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>
                <div className="input-group">
                    <label style={{display:'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-muted)'}}>Gemini API Key (Optional)</label>
                    <input 
                        className="input-glass" 
                        type="password" 
                        placeholder="Paste AI Studio Key..." 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)} 
                    />
                    <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8}}>
                        Leave empty to use Simulated AI Mode for demo.
                    </p>
                </div>
                <button className="btn-primary" onClick={onClose}>Save & Close</button>
            </div>
        </div>
    );
}

function AnalysisModal({ image, onCancel, onComplete, apiKey }) {
    const [status, setStatus] = useState('uploading'); // uploading, analyzing, done
    const [result, setResult] = useState(null);

    useEffect(() => {
        analyzeImage();
    }, []);

    const analyzeImage = async () => {
        setStatus('analyzing');
        
        // Convert Blob URL to base64
        let base64Image = null;
        try {
            const response = await fetch(image);
            const blob = await response.blob();
            base64Image = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Error processing image", e);
        }

        if (apiKey && base64Image) {
            try {
                // Real Gemini API Call
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: "Identify the civic issue in this image (e.g. pothole, garbage, broken street light, graffiti). Return a JSON object with fields: 'issue_type' (short title), 'severity' (Low/Medium/High), and 'description' (1 sentence). If nothing found, say 'No Issue'." },
                                { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                            ]
                        }]
                    })
                });
                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                
                // Naive JSON parsing from text response
                let parsed = { issue_type: "Custom Issue", severity: "Medium", description: "Issue detected." };
                try {
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        parsed = JSON.parse(jsonMatch[0]);
                    } else {
                        parsed.description = text;
                    }
                } catch(e) { console.log("JSON parse fail, using raw text"); }
                
                setResult(parsed);
                setStatus('done');

            } catch (error) {
                console.error("API Error", error);
                // Fallback
                setTimeout(() => {
                    setResult({ issue_type: "Network Error", severity: "Unknown", description: "Could not reach AI. Using manual entry." });
                    setStatus('done');
                }, 1000);
            }
        } else {
            // Mock Simulation
            setTimeout(() => {
                setResult({
                    issue_type: "Pothole Detected",
                    severity: "High",
                    description: "Large pothole exposing asphalt foundation. potential hazard."
                });
                setStatus('done');
            }, 2500);
        }
    };

    if (status !== 'done') {
        return (
            <div className="ui-layer" style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
                <div className="glass-card" style={{textAlign: 'center'}}>
                    <div className="preview-img" style={{backgroundImage: `url(${image})`, backgroundSize: 'cover', height: 200, marginBottom: 20}}></div>
                    <div style={{color: 'var(--primary)', marginBottom: 10}}>
                        <span className="material-symbols-rounded" style={{fontSize: 48, animation: 'spin 2s infinite linear'}}>autorenew</span>
                    </div>
                    <h2>AI Analyzing...</h2>
                    <p style={{color: 'var(--text-muted)'}}>Scanning pixels for civic infrastructure defects.</p>
                </div>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="ui-layer" style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', paddingBottom: 0 }}>
            <div className="glass-card" style={{margin: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxWidth: '100%', animation: 'slideUp 0.4s'}}>
                <div className="card-header">
                    <span className="card-title">Confirm Report</span>
                    <button className="icon-btn" onClick={onCancel}>
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>
                
                <div className="preview-img" style={{backgroundImage: `url(${image})`, backgroundSize: 'cover', height: 120}}></div>

                <div className="ai-pill">
                    <span className="material-symbols-rounded" style={{fontSize: 16}}>auto_awesome</span>
                    {result.issue_type}
                </div>

                <div className="input-group">
                    <input className="input-glass" defaultValue={result.issue_type} />
                </div>
                <div className="input-group">
                    <textarea className="input-glass" rows="2" defaultValue={result.description}></textarea>
                </div>

                <button className="btn-primary" onClick={() => onComplete(result)}>
                    Submit Report
                </button>
            </div>
        </div>
    );
}

function App() {
    const [view, setView] = useState('map'); // map, settings
    const [reports, setReports] = useState(MOCK_REPORTS);
    const [activeImage, setActiveImage] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_key') || '');

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);

    // Save key
    useEffect(() => {
        localStorage.setItem('gemini_key', apiKey);
    }, [apiKey]);

    // Init Map
    useEffect(() => {
        if (!mapRef.current) return;
        if (mapInstance.current) return;

        // Default to London if no loc yet, or update later
        const map = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView([51.505, -0.09], 13);

        // CartoDB Dark Matter
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20
        }).addTo(map);

        mapInstance.current = map;

        // Locate user
        map.locate({setView: true, maxZoom: 16});
        map.on('locationfound', (e) => {
            setUserLocation(e.latlng);
            L.circleMarker(e.latlng, {
                radius: 8,
                fillColor: '#00f2ff',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map);
        });

    }, []);

    // Sync Markers
    useEffect(() => {
        if (!mapInstance.current) return;
        
        // Clear existing
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        const customIcon = L.divIcon({
            className: 'custom-pin',
            html: '<div class="pin-inner"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        reports.forEach(r => {
            const m = L.marker([r.lat, r.lng], { icon: customIcon })
                .bindPopup(`<b>${r.type}</b><br>${r.description}`)
                .addTo(mapInstance.current);
            markersRef.current.push(m);
        });

    }, [reports]);

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            setActiveImage(url);
        }
    };

    const handleSubmission = (data) => {
        // Add new report
        const newReport = {
            id: Date.now(),
            lat: userLocation ? userLocation.lat : 51.505,
            lng: userLocation ? userLocation.lng : -0.09,
            type: data.issue_type,
            description: data.description,
            image: activeImage
        };
        setReports([...reports, newReport]);
        setActiveImage(null);
        
        // Pan to it
        if(mapInstance.current) {
            mapInstance.current.setView([newReport.lat, newReport.lng], 18);
        }
    };

    return (
        <>
            <div id="map" ref={mapRef} className="map-container"></div>
            
            <div className="ui-layer">
                {/* Top Bar */}
                <div className="top-bar">
                    <div className="logo">
                        <span className="material-symbols-rounded">build_circle</span>
                        Snap & Fix
                    </div>
                    <button className="icon-btn" onClick={() => setView('settings')}>
                        <span className="material-symbols-rounded">settings</span>
                    </button>
                </div>

                {/* Bottom Bar */}
                <div className="bottom-area">
                    <div className="snap-btn-container">
                        <div className="snap-ring"></div>
                        <button className="snap-btn" onClick={() => document.getElementById('cameraInput').click()}>
                            <span className="material-symbols-rounded" style={{fontSize: 32}}>photo_camera</span>
                        </button>
                        <input 
                            type="file" 
                            id="cameraInput" 
                            accept="image/*" 
                            capture="environment" 
                            style={{display:'none'}} 
                            onChange={handleFileSelect}
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <SettingsModal 
                isOpen={view === 'settings'} 
                onClose={() => setView('map')} 
                apiKey={apiKey}
                setApiKey={setApiKey}
            />

            {activeImage && (
                <AnalysisModal 
                    image={activeImage} 
                    apiKey={apiKey}
                    onCancel={() => setActiveImage(null)}
                    onComplete={handleSubmission}
                />
            )}
        </>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
