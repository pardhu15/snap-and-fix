import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Map as MapIcon, Home, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
    const location = useLocation();
    const { currentUser, logout } = useAuth();
    const isActive = (path) => location.pathname === path ? 'text-google-blue' : 'text-gray-500';

    return (
        <>
            {/* Desktop Top Nav */}
            <nav className="hidden md:flex fixed top-0 w-full bg-white/90 backdrop-blur-xl z-[9999] border-b border-gray-200/50 px-6 lg:px-12 py-4 justify-between items-center shadow-sm transition-all duration-300">
                <Link to="/" className="text-2xl font-black tracking-tight flex items-center gap-1 group">
                    <span className="text-blue-600 group-hover:scale-105 transition-transform">Snap</span>
                    <span className="text-gray-300">&</span>
                    <span className="text-gray-900 group-hover:scale-105 transition-transform">Fix</span>
                </Link>
                <div className="flex gap-8 items-center">
                    <Link to="/" className={`${isActive('/')} hover:text-blue-600 font-semibold text-sm tracking-wide transition`}>Home</Link>
                    <Link to="/report" className={`${isActive('/report')} hover:text-blue-600 font-semibold text-sm tracking-wide transition`}>Report</Link>
                    <Link to="/map" className={`${isActive('/map')} hover:text-blue-600 font-semibold text-sm tracking-wide transition`}>Live Map</Link>

                    {currentUser ? (
                        <button onClick={logout} className="text-gray-500 hover:text-red-500 font-semibold text-sm tracking-wide transition">Logout</button>
                    ) : (
                        <Link to="/login" className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-900/20 hover:-translate-y-0.5">Login</Link>
                    )}
                </div>
            </nav>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-lg border-t border-gray-200 z-[9999] pb-safe flex justify-around items-center h-16 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/')}`}>
                    <Home size={24} />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                <Link to="/report" className="relative -top-6">
                    <div className="bg-google-blue text-white p-4 rounded-xl shadow-lg shadow-google-blue/30 hover:scale-105 transition transform">
                        <Camera size={28} />
                    </div>
                </Link>

                <Link to="/map" className={`flex flex-col items-center gap-1 ${isActive('/map')}`}>
                    <MapIcon size={24} />
                    <span className="text-[10px] font-medium">Map</span>
                </Link>
            </nav>
        </>
    );
}
