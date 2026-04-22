import { useState, useEffect } from 'react'
import { MapPin, Phone, Clock, Building, Navigation } from 'lucide-react'
import InteractiveMap from '../components/InteractiveMap'

interface Doctor {
  id: number
  name: string
  specialty: string
  hospital: string
  address: string
  phone: string
  hours: string
  lat: number
  lng: number
  distance: string
}

const mockDoctors: Doctor[] = [
  {
    id: 1,
    name: 'Dr. Sarah Johnson',
    specialty: 'Movement Disorder Specialist',
    hospital: 'Central Medical Hospital',
    address: '123 Main St, City, State 12345',
    phone: '+1 (555) 123-4567',
    hours: 'Mon-Fri: 9AM-5PM',
    lat: 40.7128,
    lng: -74.0060,
    distance: '2.3 mi'
  },
  {
    id: 2,
    name: 'Dr. Michael Chen',
    specialty: 'Neurologist',
    hospital: 'West Side Medical Center',
    address: '456 Oak Ave, City, State 12345',
    phone: '+1 (555) 234-5678',
    hours: 'Mon-Sat: 10AM-6PM',
    lat: 40.7180,
    lng: -74.0020,
    distance: '1.8 mi'
  },
  {
    id: 3,
    name: 'Dr. Emma Williams',
    specialty: 'Movement Disorder Specialist',
    hospital: 'Downtown Neurology Clinic',
    address: '789 Elm St, City, State 12345',
    phone: '+1 (555) 345-6789',
    hours: 'Tue-Fri: 8AM-4PM',
    lat: 40.7050,
    lng: -74.0100,
    distance: '3.1 mi'
  },
]

export default function ContactPage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [searchRadius, setSearchRadius] = useState(5)
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>(mockDoctors)

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          // Default location if geolocation fails
          setUserLocation({ lat: 40.7128, lng: -74.0060 })
        }
      )
    }
  }, [])

  useEffect(() => {
    // Filter doctors based on search radius
    const filtered = mockDoctors.filter((doctor) => {
      const distNum = parseFloat(doctor.distance)
      return distNum <= searchRadius
    })
    setFilteredDoctors(filtered)
  }, [searchRadius])

  return (
    <div className="min-h-screen bg-[#0B1220] page-transition">
      {/* Hero Section */}
      <section className="border-b border-[#1F2937]/30 bg-gradient-to-br from-[#0B1220] via-[#111827]/30 to-[#0B1220]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="animate-fade-in-up">
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
              Find Parkinson's Specialists
            </h1>
            <p className="text-lg text-[#9CA3AF] leading-relaxed">
              Locate qualified neurologists and movement disorder specialists near you. Use the interactive map to explore and select specialists in your area.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
        {/* Search Radius Control */}
        <div className="mb-8 animate-fade-in-up rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6 hover:shadow-lg hover:shadow-[#22D3EE]/10 transition-all" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#E5E7EB] flex items-center gap-2">
              <Navigation className="h-5 w-5 text-[#22D3EE]" />
              Search Radius
            </h3>
            <span className="text-2xl font-bold text-[#22D3EE]">{searchRadius} miles</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={searchRadius}
            onChange={(e) => setSearchRadius(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg bg-[#1F2937] accent-[#22D3EE] cursor-pointer"
          />
          <p className="text-xs text-[#9CA3AF] mt-3">Drag to adjust the search radius and discover specialists near you</p>
        </div>

        {/* Interactive Map Section */}
        <div className="mb-8 animate-fade-in-up rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm overflow-hidden" style={{ animationDelay: '0.2s' }}>
          <div className="h-96">
            <InteractiveMap
              doctors={filteredDoctors}
              userLocation={userLocation}
              onDoctorSelect={setSelectedDoctor}
              selectedDoctor={selectedDoctor}
            />
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-8 animate-fade-in-up grid gap-4 sm:grid-cols-3" style={{ animationDelay: '0.3s' }}>
          <div className="rounded-lg border border-[#22D3EE]/30 bg-gradient-to-br from-[#22D3EE]/10 to-[#06B6D4]/5 p-6 hover:shadow-lg hover:shadow-[#22D3EE]/20 transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#9CA3AF]">Specialists Found</p>
                <p className="text-3xl font-bold text-[#22D3EE] mt-2">{filteredDoctors.length}</p>
              </div>
              <Building className="h-8 w-8 text-[#22D3EE] opacity-50" />
            </div>
          </div>
          <div className="rounded-lg border border-[#8B5CF6]/30 bg-gradient-to-br from-[#8B5CF6]/10 to-[#A78BFA]/5 p-6 hover:shadow-lg hover:shadow-[#8B5CF6]/20 transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#9CA3AF]">Search Radius</p>
                <p className="text-3xl font-bold text-[#8B5CF6] mt-2">{searchRadius} mi</p>
              </div>
              <Navigation className="h-8 w-8 text-[#8B5CF6] opacity-50" />
            </div>
          </div>
          <div className="rounded-lg border border-[#06B6D4]/30 bg-gradient-to-br from-[#06B6D4]/10 to-[#0891B2]/5 p-6 hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#9CA3AF]">Your Location</p>
                <p className="text-3xl font-bold text-[#06B6D4] mt-2">Active</p>
              </div>
              <MapPin className="h-8 w-8 text-[#06B6D4] opacity-50" />
            </div>
          </div>
        </div>

        {/* Doctors List */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <h2 className="mb-2 text-2xl font-bold text-[#E5E7EB]">Specialists Nearby</h2>
          <p className="mb-6 text-[#9CA3AF]">
            {filteredDoctors.length} specialist{filteredDoctors.length !== 1 ? 's' : ''} available within {searchRadius} miles • Click on map or below to select
          </p>

          {filteredDoctors.length === 0 ? (
            <div className="rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-12 text-center">
              <MapPin className="mx-auto h-12 w-12 text-[#9CA3AF] mb-4" />
              <p className="text-lg text-[#E5E7EB] font-semibold">No specialists found</p>
              <p className="text-[#9CA3AF] mt-2">Try increasing the search radius to find more specialists in your area.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDoctors.map((doctor, idx) => (
                <button
                  key={doctor.id}
                  onClick={() => setSelectedDoctor(doctor)}
                  className="text-left animate-fade-in-up rounded-lg transition-all duration-300 transform hover:scale-105"
                  style={{ animationDelay: `${0.5 + idx * 0.05}s` }}
                >
                  <div
                    className={`h-full rounded-lg border backdrop-blur-sm p-6 transition-all ${
                      selectedDoctor?.id === doctor.id
                        ? "bg-[#22D3EE]/10 border-[#22D3EE] shadow-lg shadow-[#22D3EE]/20"
                        : "bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 border-[#1F2937]/40 hover:bg-[#111827]/95 hover:shadow-lg hover:shadow-[#22D3EE]/10"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-[#E5E7EB] flex items-center gap-2 line-clamp-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-[#22D3EE] animate-pulse flex-shrink-0" />
                          {doctor.name}
                        </h3>
                        <p className="text-xs text-[#9CA3AF] mt-1 line-clamp-1">{doctor.specialty}</p>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-[#22D3EE]/20 to-[#8B5CF6]/20 px-2 py-1 text-xs font-bold text-[#22D3EE] whitespace-nowrap ml-2">
                        {doctor.distance}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-xs opacity-80 hover:opacity-100 transition-opacity">
                        <Building className="h-3 w-3 flex-shrink-0 text-[#22D3EE] mt-0.5" />
                        <span className="text-[#9CA3AF] line-clamp-1">{doctor.hospital}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <Phone className="h-3 w-3 flex-shrink-0 text-[#22D3EE] mt-0.5" />
                        <a href={`tel:${doctor.phone}`} className="text-[#22D3EE] hover:underline font-medium transition-colors">
                          {doctor.phone}
                        </a>
                      </div>
                      <div className="flex items-start gap-2 text-xs opacity-80">
                        <Clock className="h-3 w-3 flex-shrink-0 text-[#22D3EE] mt-0.5" />
                        <span className="text-[#9CA3AF]">{doctor.hours}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-12 animate-fade-in-up rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6" style={{ animationDelay: '0.7s' }}>
          <h3 className="font-semibold text-[#E5E7EB] mb-3">How to use this map:</h3>
          <ul className="space-y-2 text-sm text-[#9CA3AF]">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
              <strong>Purple check mark:</strong> Your current location
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
              <strong>Cyan dots:</strong> Specialist locations
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
              <strong>Drag:</strong> Pan the map • <strong>Scroll:</strong> Zoom • <strong>Click:</strong> Select specialist
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
