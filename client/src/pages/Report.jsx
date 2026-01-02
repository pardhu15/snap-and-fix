import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Webcam from 'react-webcam';
import { Camera, X, Check, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyzeImage } from '../utils/gemini';
import { db, storage } from '../firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Report() {
    const webcamRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [location, setLocation] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => console.error("Location error:", error)
            );
        }
    }, []);

    const capture = React.useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImgSrc(imageSrc);
        setCameraActive(false);
        handleAnalyze(imageSrc);
    }, [webcamRef]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImgSrc(reader.result);
                handleAnalyze(reader.result); // Pass base64
            };
            reader.readAsDataURL(file);
        }
    };

    // State for manual overrides
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [isInvalid, setIsInvalid] = useState(false);

    const handleAnalyze = async (base64Image) => {
        setAnalyzing(true);
        setIsInvalid(false);
        try {
            const res = await fetch(base64Image);
            const blob = await res.blob();
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
            const result = await analyzeImage(file);

            // Check if AI determined image is invalid
            if (result.valid === false) {
                setAnalysis(result);
                setIsInvalid(true);
                return;
            }

            setAnalysis(result);
            setCategory(result.type || "Other");
            setDescription(result.description);
        } catch (err) {
            console.error("Analysis failed", err);
            // Fallback mock
            const fallback = { valid: true, type: "Other", severity: "Low", description: "Could not analyze image. Please describe." };
            setAnalysis(fallback);
            setCategory(fallback.type);
            setDescription(fallback.description);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmit = async () => {
        if (!imgSrc || !location) return;
        if (!currentUser) {
            alert("You must be logged in to submit a report.");
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            // Check for Mock Mode via API Key presence
            const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
            if (!apiKey || apiKey.includes('your_api_key')) {
                // Mock Submission
                console.warn("Mock Submission Mode");
                await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network

                // Save to local storage for demo purposes
                const mockReports = JSON.parse(localStorage.getItem('mockReports') || '[]');
                const newReport = {
                    id: 'mock-' + Date.now(),
                    imageUrl: imgSrc,
                    type: category || analysis?.type || "Mock Issue",
                    severity: analysis?.severity || "Low",
                    description: description || analysis?.description || "Mock description",
                    location: location,
                    userId: currentUser.uid,
                    timestamp: { seconds: Date.now() / 1000 },
                    status: "open",
                    votes: 0
                };
                mockReports.unshift(newReport); // Add to top
                localStorage.setItem('mockReports', JSON.stringify(mockReports));

                alert("Issue reported successfully! (Mock Mode)");
                navigate('/map');
                return;
            }

            // 1. Upload Image
            const storageRef = ref(storage, `reports/${Date.now()}.jpg`);
            await uploadString(storageRef, imgSrc, 'data_url');
            const url = await getDownloadURL(storageRef);

            // 2. Save to Firestore
            await addDoc(collection(db, "reports"), {
                imageUrl: url,
                type: category || analysis?.type || "Unknown",
                severity: analysis?.severity || "Low",
                description: description || analysis?.description || "No description",
                location: location,
                userId: currentUser.uid,
                userEmail: currentUser.email,
                timestamp: serverTimestamp(),
                status: "open",
                votes: 0
            });

            // 3. Success Feedback
            // Custom toast or simple alert
            alert("Issue reported successfully!");
            navigate('/map');

        } catch (error) {
            console.error("Error submitting:", error);
            alert("Failed to submit. Check console/API keys.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-24 bg-gray-50 flex flex-col items-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-gray-800">New Report</h2>
                    {location ?
                        <div className="flex flex-col items-end">
                            <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md font-medium border border-green-100">
                                <MapPin size={12} className="mr-1" />
                                <span>GPS Locked</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono mt-1 tracking-tight">
                                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                            </span>
                        </div> :
                        <div className="flex items-center text-xs text-red-500 bg-red-50 px-2 py-1 rounded-md font-medium border border-red-100">
                            <Loader2 size={12} className="mr-1 animate-spin" />
                            <span>Locating...</span>
                        </div>
                    }
                </div>

                {/* Camera / Image Area */}
                <div className="relative bg-gray-900 aspect-[4/3] flex items-center justify-center overflow-hidden">
                    {!imgSrc && !cameraActive && (
                        <div className="flex flex-col items-center gap-4">
                            <button
                                onClick={() => setCameraActive(true)}
                                className="bg-white/20 hover:bg-white/30 text-white rounded-full p-6 backdrop-blur-sm transition"
                            >
                                <Camera size={40} />
                            </button>
                            <div className="text-gray-400 text-sm">or</div>
                            <label className="cursor-pointer text-google-blue font-medium hover:underline">
                                Upload from Gallery
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                    )}

                    {cameraActive && (
                        <>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover"
                                videoConstraints={{ facingMode: "environment" }}
                            />
                            <button
                                onClick={capture}
                                className="absolute bottom-6 bg-white rounded-full p-4 shadow-lg border-4 border-gray-200 hover:border-google-blue transition"
                            >
                                <div className="w-12 h-12 bg-google-red rounded-full"></div>
                            </button>
                            <button
                                onClick={() => setCameraActive(false)}
                                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </>
                    )}

                    {imgSrc && (
                        <div className="relative w-full h-full">
                            <img src={imgSrc} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                onClick={() => { setImgSrc(null); setAnalysis(null); setCategory(""); setDescription(""); }}
                                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                            >
                                <X size={20} />
                            </button>

                            {analyzing && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                                    <Loader2 size={48} className="animate-spin mb-4 text-google-blue" />
                                    <p className="font-medium animate-pulse">AI Analyzing...</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Analysis Results / Form */}
                {isInvalid && (
                    <div className="p-8 text-center animate-fade-in-up">
                        <div className="bg-red-50 text-red-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Not a Civic Issue</h3>
                        <p className="text-gray-500 mb-6 px-4 leading-relaxed">
                            {analysis?.description || "This image does not appear to be a relevant civic issue. Please strictly upload photos of infrastructure problems."}
                        </p>
                        <button
                            onClick={() => { setImgSrc(null); setAnalysis(null); setIsInvalid(false); }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-8 rounded-xl transition"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {analysis && !analyzing && !isInvalid && (
                    <div className="p-6 animate-fade-in-up space-y-4">

                        {/* Type Selection */}
                        <div>
                            <label className="block text-gray-500 text-xs font-bold uppercase mb-1">Issue Type</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-lg p-3 focus:outline-none focus:border-google-blue font-medium"
                            >
                                <option value="Pothole">Pothole</option>
                                <option value="Garbage">Garbage / Dumping</option>
                                <option value="Streetlight">Broken Streetlight</option>
                                <option value="Graffiti">Graffiti</option>
                                <option value="Signage">Damaged Signage</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-gray-500 text-xs font-bold uppercase mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-lg p-3 focus:outline-none focus:border-google-blue text-sm"
                                rows="3"
                            />
                        </div>


                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-500 text-sm">Severity</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${analysis.severity === 'High' ? 'bg-red-100 text-red-700' :
                                analysis.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                {analysis.severity}
                            </span>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !location}
                            className="w-full bg-google-blue hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Check />}
                            Submit Report
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
