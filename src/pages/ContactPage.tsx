import { useState, useEffect } from 'react'
import { MapPin, Phone } from 'lucide-react'

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
  const [_, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
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
    <div className="min-h-screen bg-[#0B1220]">
      {/* Hero Section */}
      <section className="border-b border-[#1F2937]/30 bg-gradient-to-br from-[#0B1220] via-[#111827]/30 to-[#0B1220]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="animate-fade-in-up">
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
              Find Parkinson's Specialists
            </h1>
            <p className="text-lg text-[#9CA3AF]">
              Locate qualified neurologists and movement disorder specialists near you
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
        {/* Search Radius */}
        <div className="mb-8 rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#E5E7EB]">Search Radius</h3>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="20"
              value={searchRadius}
              onChange={(e) => setSearchRadius(parseInt(e.target.value))}
              className="flex-1 h-2 rounded-lg bg-[#1F2937] accent-[#22D3EE] cursor-pointer"
            />
            <span className="text-lg font-semibold text-[#E5E7EB] min-w-fit">{searchRadius} miles</span>
          </div>
        </div>

        {/* Map Area */}
        <div className="mb-8 rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6 h-80">
          <div className="w-full h-full bg-[#0B1220] rounded-lg border border-[#1F2937] flex items-center justify-center relative overflow-hidden">
            <canvas
              id="doctorMap"
              className="w-full h-full"
              width={800}
              height={400}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[#9CA3AF] pointer-events-none">
              <div className="text-center">
                <MapPin className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>Map visualization - {filteredDoctors.length} specialist{filteredDoctors.length !== 1 ? 's' : ''} found</p>
              </div>
            </div>
          </div>
        </div>

        {/* Doctors List */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-[#E5E7EB]">
            Specialists Nearby
          </h2>
          <p className="mb-6 text-[#9CA3AF]">
            {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found within {searchRadius} miles
          </p>

          {filteredDoctors.length === 0 ? (
            <div className="rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-12 text-center animate-fade-in-up">
              <MapPin className="mx-auto h-8 w-8 text-[#9CA3AF] mb-4" />
              <p className="text-[#9CA3AF]">No specialists found in your search radius. Try increasing the distance.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {filteredDoctors.map((doctor, idx) => (
                <button
                  key={doctor.id}
                  onClick={() => setSelectedDoctor(doctor)}
                  className="text-left animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div
                    className={`rounded-lg border backdrop-blur-sm transition-all cursor-pointer duration-300 transform hover:scale-105 h-full ${
                      selectedDoctor?.id === doctor.id
                        ? "bg-[#22D3EE]/10 border-[#22D3EE] shadow-lg shadow-[#22D3EE]/20"
                        : "bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 border-[#1F2937]/40 hover:bg-[#111827]/95 hover:shadow-lg"
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-[#E5E7EB] flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full bg-[#22D3EE] animate-pulse" />
                            {doctor.name}
                          </h3>
                          <p className="text-sm text-[#9CA3AF] mt-1">{doctor.specialty}</p>
                        </div>
                        <div className="rounded-lg bg-gradient-to-br from-[#22D3EE]/20 to-[#8B5CF6]/20 px-3 py-2 text-sm font-bold text-[#22D3EE] animate-pulse">
                          {doctor.distance}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-[#22D3EE] mt-0.5" />
                          <span className="text-[#9CA3AF]">{doctor.hospital}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-[#22D3EE] mt-0.5" />
                          <span className="text-[#9CA3AF]">{doctor.address}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Phone className="h-4 w-4 flex-shrink-0 text-[#22D3EE] mt-0.5" />
                          <a href={`tel:${doctor.phone}`} className="text-[#22D3EE] hover:underline font-medium transition-colors">
                            {doctor.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contact Form */}
        <div className="rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6">
          <h2 className="mb-6 text-2xl font-bold text-[#E5E7EB]">Contact Us</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#E5E7EB] mb-2">Name</label>
              <input
                type="text"
                placeholder="Your name"
                className="w-full rounded-lg border border-[#1F2937] bg-[#0B1220] px-4 py-2 text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#22D3EE] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#E5E7EB] mb-2">Email</label>
              <input
                type="email"
                placeholder="Your email"
                className="w-full rounded-lg border border-[#1F2937] bg-[#0B1220] px-4 py-2 text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#22D3EE] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#E5E7EB] mb-2">Message</label>
              <textarea
                placeholder="Your message"
                rows={4}
                className="w-full rounded-lg border border-[#1F2937] bg-[#0B1220] px-4 py-2 text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#22D3EE] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/20 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-6 py-3 text-base font-semibold text-[#0B1220] hover:from-[#06B6D4] hover:to-[#0891B2] transition-all transform hover:scale-105 shadow-lg shadow-[#22D3EE]/20"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
