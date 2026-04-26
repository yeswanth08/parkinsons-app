import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { MapPin, Phone, AlertCircle, Navigation } from 'lucide-react';
export default function ContactPage() {
    const { analysisResults } = useSelector((state) => state.results);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [searchRadius, setSearchRadius] = useState(5);
    const [nearbyDoctors, setNearbyDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [apiKeyError, setApiKeyError] = useState(false);
    const mapRef = useRef(null);
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 3959; // Earth's radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };
    const fetchNearbyDoctors = async (lat, lng) => {
        setLoading(true);
        try {
            const mockNearbyDoctors = [
                {
                    id: 1,
                    name: 'Dr. Sarah Johnson',
                    specialty: 'Movement Disorder Specialist',
                    hospital: 'Central Medical Hospital',
                    address: '123 Main St, City, State 12345',
                    phone: '+1 (555) 123-4567',
                    hours: 'Mon-Fri: 9AM-5PM',
                    lat: lat + 0.01,
                    lng: lng - 0.01,
                },
                {
                    id: 2,
                    name: 'Dr. Michael Chen',
                    specialty: 'Neurologist',
                    hospital: 'West Side Medical Center',
                    address: '456 Oak Ave, City, State 12345',
                    phone: '+1 (555) 234-5678',
                    hours: 'Mon-Sat: 10AM-6PM',
                    lat: lat - 0.02,
                    lng: lng + 0.015,
                },
                {
                    id: 3,
                    name: 'Dr. Emma Williams',
                    specialty: 'Movement Disorder Specialist',
                    hospital: 'Downtown Neurology Clinic',
                    address: '789 Elm St, City, State 12345',
                    phone: '+1 (555) 345-6789',
                    hours: 'Tue-Fri: 8AM-4PM',
                    lat: lat + 0.015,
                    lng: lng + 0.02,
                },
            ];
            const doctorsWithDistance = mockNearbyDoctors
                .map(doctor => ({
                ...doctor,
                distance: calculateDistance(lat, lng, doctor.lat, doctor.lng).toFixed(1)
            }))
                .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
            setNearbyDoctors(doctorsWithDistance);
        }
        catch (error) {
            console.error('Error fetching nearby doctors:', error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const loc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setUserLocation(loc);
                if (analysisResults) {
                    fetchNearbyDoctors(loc.lat, loc.lng);
                }
            }, () => {
                const defaultLoc = { lat: 40.7128, lng: -74.0060 };
                setUserLocation(defaultLoc);
                if (analysisResults) {
                    fetchNearbyDoctors(defaultLoc.lat, defaultLoc.lng);
                }
            });
        }
    }, [analysisResults]);
    useEffect(() => {
        if (userLocation && analysisResults) {
            const filtered = nearbyDoctors.filter((doctor) => {
                const distNum = parseFloat(doctor.distance);
                return distNum <= searchRadius;
            });
            if (mapRef.current) {
                mapRef.current.updateMarkers(filtered, userLocation);
            }
        }
    }, [searchRadius, nearbyDoctors, analysisResults, userLocation]);
    const hasCompletedAnalysis = !!analysisResults;
    return (_jsxs("div", { className: "min-h-screen bg-[#0B1220]", children: [_jsx("section", { className: "border-b border-[#1F2937]/30 bg-gradient-to-br from-[#0B1220] via-[#111827]/30 to-[#0B1220]", children: _jsx("div", { className: "mx-auto max-w-7xl px-6 py-16 sm:py-20", children: _jsxs("div", { className: "animate-fade-in-up", children: [_jsx("h1", { className: "mb-4 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl", children: "Find Parkinson's Specialists" }), _jsx("p", { className: "text-lg text-[#9CA3AF]", children: "Locate qualified neurologists and movement disorder specialists near you" }), !hasCompletedAnalysis && (_jsxs("div", { className: "mt-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-sm p-4 flex items-start gap-3", children: [_jsx(AlertCircle, { className: "h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-sm text-yellow-200", children: "Complete a voice analysis test first to access real-time specialist locator" })] }))] }) }) }), _jsx("div", { className: "mx-auto max-w-7xl px-6 py-12 sm:py-16", children: !hasCompletedAnalysis ? (
                // Show message when no analysis completed
                _jsxs("div", { className: "rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-16 text-center animate-fade-in-up", children: [_jsx(MapPin, { className: "mx-auto h-12 w-12 text-[#9CA3AF] mb-4 opacity-50" }), _jsx("h3", { className: "text-xl font-semibold text-[#E5E7EB] mb-2", children: "Voice Analysis Required" }), _jsx("p", { className: "text-[#9CA3AF] mb-6", children: "Complete a voice test to unlock the real-time specialist locator feature." }), _jsxs("a", { href: "/test", className: "inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-8 py-3 text-base font-semibold text-[#0B1220] hover:from-[#06B6D4] hover:to-[#0891B2] transition-all transform hover:scale-105 shadow-lg shadow-[#22D3EE]/20", children: [_jsx(Navigation, { className: "h-4 w-4" }), "Go to Voice Test"] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-8 rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-[#E5E7EB]", children: "Search Radius" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("input", { type: "range", min: "1", max: "20", value: searchRadius, onChange: (e) => setSearchRadius(parseInt(e.target.value)), className: "flex-1 h-2 rounded-lg bg-[#1F2937] accent-[#22D3EE] cursor-pointer" }), _jsxs("span", { className: "text-lg font-semibold text-[#E5E7EB] min-w-fit", children: [searchRadius, " miles"] })] })] }), _jsxs("div", { className: "mb-8 rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6 h-80", children: [!googleMapsApiKey ? (_jsx("div", { className: "w-full h-full bg-[#0B1220] rounded-lg border border-[#1F2937] flex items-center justify-center relative overflow-hidden", children: _jsxs("div", { className: "text-center", children: [_jsx(MapPin, { className: "mx-auto h-8 w-8 text-yellow-500 mb-3" }), _jsx("p", { className: "text-[#E5E7EB] font-semibold mb-2", children: "Google Maps API Key Required" }), _jsx("p", { className: "text-sm text-[#9CA3AF]", children: "Add VITE_GOOGLE_MAPS_API_KEY to your environment variables" }), _jsxs("p", { className: "text-xs text-[#6B7280] mt-3", children: ["Get your free API key at ", _jsx("a", { href: "https://console.cloud.google.com", target: "_blank", rel: "noopener noreferrer", className: "text-[#22D3EE] hover:underline", children: "Google Cloud Console" })] })] }) })) : (_jsx("iframe", { width: "100%", height: "100%", style: { border: 0, borderRadius: '8px' }, src: `https://www.google.com/maps/embed/v1/search?key=${googleMapsApiKey}&q=neurologist+near+${userLocation?.lat},${userLocation?.lng}`, allowFullScreen: true, loading: "lazy", referrerPolicy: "no-referrer-when-downgrade", title: "Nearby Specialists Map" })), _jsx("p", { className: "text-xs text-[#6B7280] mt-2 text-center", children: "Real-time map showing neurologists and movement disorder specialists near your location" })] }), _jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "mb-4 text-2xl font-bold text-[#E5E7EB]", children: "Specialists Nearby" }), loading ? (_jsx("p", { className: "text-[#9CA3AF]", children: "Loading nearby specialists..." })) : (_jsxs("p", { className: "mb-6 text-[#9CA3AF]", children: [nearbyDoctors.filter(d => parseFloat(d.distance) <= searchRadius).length, " doctor", nearbyDoctors.filter(d => parseFloat(d.distance) <= searchRadius).length !== 1 ? 's' : '', " found within ", searchRadius, " miles"] })), nearbyDoctors.filter(d => parseFloat(d.distance) <= searchRadius).length === 0 ? (_jsxs("div", { className: "rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-12 text-center animate-fade-in-up", children: [_jsx(MapPin, { className: "mx-auto h-8 w-8 text-[#9CA3AF] mb-4" }), _jsx("p", { className: "text-[#9CA3AF]", children: "No specialists found in your search radius. Try increasing the distance." })] })) : (_jsx("div", { className: "grid gap-6 sm:grid-cols-2", children: nearbyDoctors.filter(d => parseFloat(d.distance) <= searchRadius).map((doctor, idx) => (_jsx("button", { onClick: () => setSelectedDoctor(doctor), className: "text-left animate-fade-in-up", style: { animationDelay: `${idx * 0.1}s` }, children: _jsx("div", { className: `rounded-lg border backdrop-blur-sm transition-all cursor-pointer duration-300 transform hover:scale-105 h-full ${selectedDoctor?.id === doctor.id
                                                ? "bg-[#22D3EE]/10 border-[#22D3EE] shadow-lg shadow-[#22D3EE]/20"
                                                : "bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 border-[#1F2937]/40 hover:bg-[#111827]/95 hover:shadow-lg"}`, children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("h3", { className: "text-lg font-semibold text-[#E5E7EB] flex items-center gap-2", children: [_jsx("span", { className: "inline-block h-2 w-2 rounded-full bg-[#22D3EE] animate-pulse" }), doctor.name] }), _jsx("p", { className: "text-sm text-[#9CA3AF] mt-1", children: doctor.specialty })] }), _jsx("div", { className: "rounded-lg bg-gradient-to-br from-[#22D3EE]/20 to-[#8B5CF6]/20 px-3 py-2 text-sm font-bold text-[#22D3EE] animate-pulse", children: doctor.distance })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-start gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity", children: [_jsx(MapPin, { className: "h-4 w-4 flex-shrink-0 text-[#22D3EE] mt-0.5" }), _jsx("span", { className: "text-[#9CA3AF]", children: doctor.hospital })] }), _jsxs("div", { className: "flex items-start gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity", children: [_jsx(MapPin, { className: "h-4 w-4 flex-shrink-0 text-[#22D3EE] mt-0.5" }), _jsx("span", { className: "text-[#9CA3AF]", children: doctor.address })] }), _jsxs("div", { className: "flex items-start gap-2 text-sm", children: [_jsx(Phone, { className: "h-4 w-4 flex-shrink-0 text-[#22D3EE] mt-0.5" }), _jsx("a", { href: `tel:${doctor.phone}`, className: "text-[#22D3EE] hover:underline font-medium transition-colors", children: doctor.phone })] })] })] }) }) }, doctor.id))) }))] }), _jsxs("div", { className: "rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6", children: [_jsx("h2", { className: "mb-6 text-2xl font-bold text-[#E5E7EB]", children: "Contact Us" }), _jsxs("form", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#E5E7EB] mb-2", children: "Name" }), _jsx("input", { type: "text", placeholder: "Your name", className: "w-full rounded-lg border border-[#1F2937] bg-[#0B1220] px-4 py-2 text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#22D3EE] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/20 transition-colors" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#E5E7EB] mb-2", children: "Email" }), _jsx("input", { type: "email", placeholder: "Your email", className: "w-full rounded-lg border border-[#1F2937] bg-[#0B1220] px-4 py-2 text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#22D3EE] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/20 transition-colors" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#E5E7EB] mb-2", children: "Message" }), _jsx("textarea", { placeholder: "Your message", rows: 4, className: "w-full rounded-lg border border-[#1F2937] bg-[#0B1220] px-4 py-2 text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#22D3EE] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/20 transition-colors" })] }), _jsx("button", { type: "submit", className: "w-full rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-6 py-3 text-base font-semibold text-[#0B1220] hover:from-[#06B6D4] hover:to-[#0891B2] transition-all transform hover:scale-105 shadow-lg shadow-[#22D3EE]/20", children: "Send Message" })] })] })] })) })] }));
}
