import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, MapPin, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Landing() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans">

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Blobs - Professional Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                    <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
                    <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wide mb-6 border border-blue-100 shadow-sm animate-fade-in-up">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                        Live Beta 2.0
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 animate-fade-in-up delay-100">
                        Fix Your City <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            In a Snap.
                        </span>
                    </h1>

                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 mb-10 animate-fade-in-up delay-200">
                        Empowering citizens to report potholes, garbage, and broken infrastructure instantly.
                        AI-powered analysis with real-time tracking.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up delay-300">
                        <Link to="/report" className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5">
                            <Camera className="w-5 h-5 mr-2 -ml-1 transition-transform group-hover:scale-110" />
                            Report Issue
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </Link>

                        <Link to="/map" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-gray-700 transition-all duration-200 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 shadow-sm">
                            <MapPin className="w-5 h-5 mr-2 -ml-1 text-gray-500" />
                            View Live Map
                        </Link>
                    </div>
                </div>
            </div>

            {/* Feature Grid - 'Professional' cards with glass effect */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Camera className="w-6 h-6 text-white" />}
                        color="bg-blue-500"
                        title="AI Analysis"
                        desc="Snap a photo and our Gemini AI immediately identifies the issue type and severity without manual input."
                    />
                    <FeatureCard
                        icon={<MapPin className="w-6 h-6 text-white" />}
                        color="bg-purple-500"
                        title="Geo-Tagging"
                        desc="Automatic location detection places your report precisely on the city map for crews to find."
                    />
                    <FeatureCard
                        icon={<ShieldCheck className="w-6 h-6 text-white" />}
                        color="bg-indigo-500"
                        title="Verified Impact"
                        desc="Track the status of your reports from 'Open' to 'Resolved' and see your impact on the community."
                    />
                </div>
            </div>

            {/* Simple Footer */}
            <footer className="border-t border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto py-12 px-4 text-center">
                    <p className="text-gray-400">© 2026 Snap & Fix. Built for the community.</p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, color, title, desc }) {
    return (
        <div className="relative group p-8 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color.replace('bg-', 'from-')}/10 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>

            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${color} shadow-lg shadow-${color}/30 mb-6 relative z-10`}>
                {icon}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">{title}</h3>
            <p className="text-gray-500 leading-relaxed relative z-10">{desc}</p>
        </div>
    );
}
