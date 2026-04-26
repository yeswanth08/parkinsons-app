import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'
import { MapPin, Phone, AlertCircle, Navigation, Clock, ExternalLink } from 'lucide-react'

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
}

export default function ContactPage() {
  const { analysisResults } = useSelector((state: RootState) => state.results)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [searchRadius, setSearchRadius] = useState(5)
  const [nearbyDoctors, setNearbyDoctors] = useState<(Doctor & { distance: string })[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Fetches real neurologists / movement disorder specialists using the
   * OpenStreetMap Overpass API — completely free, no API key required.
   *
   * Strategy:
   *  1. Primary query: nodes/ways tagged with neurology-related healthcare tags
   *  2. Fallback query: broader healthcare=doctor nodes, filtered client-side
   *     by neurology/parkinson keywords in any tag value
   */
  const fetchNearbyDoctors = async (lat: number, lng: number, radius = searchRadius) => {
    setLoading(true)
    setFetchError(null)

    const radiusMeters = radius * 1609.34 // miles → meters

    const primaryQuery = `
      [out:json][timeout:30];
      (
        node["healthcare:speciality"~"neurology|movement_disorder",i](around:${radiusMeters},${lat},${lng});
        way["healthcare:speciality"~"neurology|movement_disorder",i](around:${radiusMeters},${lat},${lng});
        node["healthcare"="doctor"]["speciality"~"neurology",i](around:${radiusMeters},${lat},${lng});
        node["amenity"~"clinic|hospital"]["name"~"neurol|parkinson",i](around:${radiusMeters},${lat},${lng});
        node["healthcare"="doctor"]["name"~"neurol|parkinson",i](around:${radiusMeters},${lat},${lng});
      );
      out body center;
    `

    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: primaryQuery,
      })
      if (!res.ok) throw new Error(`Overpass API error: ${res.status}`)

      const data = await res.json()
      let elements: any[] = data.elements ?? []

      // Fallback: broader healthcare search, filter by keyword client-side
      if (elements.length === 0) {
        const fallbackQuery = `
          [out:json][timeout:30];
          (
            node["healthcare"="doctor"](around:${radiusMeters},${lat},${lng});
            node["amenity"="doctors"](around:${radiusMeters},${lat},${lng});
            node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
          );
          out body center;
        `
        const fbRes = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: fallbackQuery,
        })
        const fbData = await fbRes.json()
        elements = (fbData.elements ?? []).filter((el: any) => {
          const combined = Object.values(el.tags ?? {}).join(' ').toLowerCase()
          return (
            combined.includes('neurol') ||
            combined.includes('parkinson') ||
            combined.includes('movement') ||
            combined.includes('brain')
          )
        })
      }

      const doctors = elements
        .map((el: any, idx: number) => {
          const tags = el.tags ?? {}
          const elLat = el.lat ?? el.center?.lat
          const elLng = el.lon ?? el.center?.lon
          if (!elLat || !elLng) return null

          return {
            id: el.id ?? idx,
            name:
              tags.name ??
              tags['name:en'] ??
              tags['operator'] ??
              `Specialist ${idx + 1}`,
            specialty:
              tags['healthcare:speciality'] ??
              tags['speciality'] ??
              tags['specialty'] ??
              'Neurologist / Movement Disorder Specialist',
            hospital: tags['operator'] ?? tags['brand'] ?? '',
            address:
              [
                tags['addr:housenumber'],
                tags['addr:street'],
                tags['addr:city'],
                tags['addr:state'],
                tags['addr:postcode'],
              ]
                .filter(Boolean)
                .join(', ') || 'Address not listed',
            phone:
              tags.phone ??
              tags['contact:phone'] ??
              tags['contact:mobile'] ??
              'Phone not listed',
            hours: tags.opening_hours ?? 'Hours not listed',
            lat: elLat,
            lng: elLng,
            distance: calculateDistance(lat, lng, elLat, elLng).toFixed(1),
          } as Doctor & { distance: string }
        })
        .filter(Boolean)
        .sort(
          (a, b) => parseFloat(a!.distance) - parseFloat(b!.distance)
        ) as (Doctor & { distance: string })[]

      setNearbyDoctors(doctors)

      if (doctors.length === 0) {
        setFetchError(
          'No specialists found in your area via OpenStreetMap. ' +
          'OSM data may be sparse here — try increasing the radius.'
        )
      }
    } catch (err: any) {
      console.error('Overpass API fetch failed:', err)
      setFetchError('Failed to fetch specialists. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Re-fetch when radius slider changes
  useEffect(() => {
    if (userLocation && analysisResults) {
      fetchNearbyDoctors(userLocation.lat, userLocation.lng, searchRadius)
    }
  }, [searchRadius])

  // Inject Leaflet CSS once
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
  }, [])

  // Init Leaflet map
  useEffect(() => {
    if (!analysisResults || !userLocation || !mapRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet' as any)).default ?? (await import('leaflet' as any))

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }

      const map = L.map(mapRef.current!).setView([userLocation.lat, userLocation.lng], 13)
      leafletMapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      const userIcon = L.divIcon({
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#22D3EE;border:3px solid #fff;box-shadow:0 0 0 3px #22D3EE55;"></div>`,
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Your Location</b>')

      updateMarkers(L, map, nearbyDoctors)
    }

    initMap()

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [analysisResults, userLocation])

  // Update markers when doctors / selection changes
  useEffect(() => {
    if (!leafletMapRef.current || !userLocation) return
    import('leaflet' as any).then((mod) => {
      const L = mod.default ?? mod
      updateMarkers(L, leafletMapRef.current, nearbyDoctors)
    })
  }, [nearbyDoctors, selectedDoctor])

  const updateMarkers = (L: any, map: any, doctors: (Doctor & { distance: string })[]) => {
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    doctors.forEach(doctor => {
      const isSelected = selectedDoctor?.id === doctor.id
      const icon = L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${
          isSelected ? '#8B5CF6' : '#F59E0B'
        };border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })

      const marker = L.marker([doctor.lat, doctor.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:160px">
            <b style="color:#1F2937">${doctor.name}</b><br/>
            <span style="color:#6B7280;font-size:12px">${doctor.specialty}</span><br/>
            <span style="color:#6B7280;font-size:12px">${doctor.distance} miles away</span>
          </div>
        `)

      markersRef.current.push(marker)
    })
  }

  // Geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude }
        setUserLocation(loc)
        if (analysisResults) fetchNearbyDoctors(loc.lat, loc.lng)
      },
      () => {
        const defaultLoc = { lat: 40.7128, lng: -74.006 } // NYC fallback
        setUserLocation(defaultLoc)
        if (analysisResults) fetchNearbyDoctors(defaultLoc.lat, defaultLoc.lng)
      }
    )
  }, [analysisResults])

  const hasCompletedAnalysis = !!analysisResults

  return (
    <div className="min-h-screen bg-[#0B1220]">
      {/* Header */}
      <section className="border-b border-[#1F2937]/30 bg-gradient-to-br from-[#0B1220] via-[#111827]/30 to-[#0B1220]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="animate-fade-in-up">
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
              Find Parkinson's Specialists
            </h1>
            <p className="text-lg text-[#9CA3AF]">
              Locate qualified neurologists and movement disorder specialists near you
            </p>
            {!hasCompletedAnalysis && (
              <div className="mt-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-sm p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-200">
                  Complete a voice analysis test first to access the real-time specialist locator
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
        {!hasCompletedAnalysis ? (
          /* ── Locked state ── */
          <div className="rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-16 text-center animate-fade-in-up">
            <MapPin className="mx-auto h-12 w-12 text-[#9CA3AF] mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-[#E5E7EB] mb-2">Voice Analysis Required</h3>
            <p className="text-[#9CA3AF] mb-6">
              Complete a voice test to unlock the real-time specialist locator feature.
            </p>
            <a
              href="/test"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-8 py-3 text-base font-semibold text-[#0B1220] hover:from-[#06B6D4] hover:to-[#0891B2] transition-all transform hover:scale-105 shadow-lg shadow-[#22D3EE]/20"
            >
              <Navigation className="h-4 w-4" />
              Go to Voice Test
            </a>
          </div>
        ) : (
          <>
            {/* ── Search Radius Slider ── */}
            <div className="mb-8 rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6">
              <h3 className="mb-4 text-lg font-semibold text-[#E5E7EB]">Search Radius</h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                  className="flex-1 h-2 rounded-lg bg-[#1F2937] accent-[#22D3EE] cursor-pointer"
                />
                <span className="text-lg font-semibold text-[#E5E7EB] min-w-fit">
                  {searchRadius} miles
                </span>
              </div>
            </div>

            {/* ── Leaflet Map ── */}
            <div className="mb-8 rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-4">
              <div
                ref={mapRef}
                style={{ height: '360px', borderRadius: '8px', zIndex: 0 }}
                className="w-full"
              />
              <p className="text-xs text-[#6B7280] mt-2 text-center">
                Map data ©{' '}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#22D3EE] hover:underline"
                >
                  OpenStreetMap
                </a>{' '}
                contributors &nbsp;·&nbsp;
                <span className="text-[#22D3EE]">●</span> You &nbsp;
                <span className="text-yellow-400">●</span> Specialists
              </p>
            </div>

            {/* ── Doctors List ── */}
            <div className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-[#E5E7EB]">Specialists Nearby</h2>

              {/* Loading spinner */}
              {loading && (
                <div className="flex items-center gap-3 text-[#9CA3AF] py-4">
                  <svg
                    className="animate-spin h-5 w-5 text-[#22D3EE]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Searching for specialists via OpenStreetMap...
                </div>
              )}

              {/* Count */}
              {!loading && (
                <p className="mb-6 text-[#9CA3AF]">
                  {nearbyDoctors.length} specialist
                  {nearbyDoctors.length !== 1 ? 's' : ''} found within {searchRadius} miles
                </p>
              )}

              {/* Error / empty state */}
              {!loading && fetchError && (
                <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-200">{fetchError}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 pl-8">
                    <a
                      href="https://www.google.com/maps/search/neurologist+near+me"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[#22D3EE] hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Search Google Maps
                    </a>
                    <a
                      href="https://www.practo.com/search/doctors?results_type=doctor&q=%5B%7B%22word%22%3A%22neurologist%22%7D%5D"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[#22D3EE] hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Search Practo
                    </a>
                  </div>
                </div>
              )}

              {/* Doctor cards */}
              {!loading && nearbyDoctors.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2">
                  {nearbyDoctors.map((doctor, idx) => (
                    <button
                      key={doctor.id}
                      onClick={() => setSelectedDoctor(doctor)}
                      className="text-left animate-fade-in-up"
                      style={{ animationDelay: `${idx * 0.08}s` }}
                    >
                      <div
                        className={`rounded-lg border backdrop-blur-sm transition-all cursor-pointer duration-300 transform hover:scale-105 h-full ${
                          selectedDoctor?.id === doctor.id
                            ? 'bg-[#22D3EE]/10 border-[#22D3EE] shadow-lg shadow-[#22D3EE]/20'
                            : 'bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 border-[#1F2937]/40 hover:bg-[#111827]/95 hover:shadow-lg'
                        }`}
                      >
                        <div className="p-6">
                          {/* Name + distance badge */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 pr-3">
                              <h3 className="text-lg font-semibold text-[#E5E7EB] flex items-center gap-2">
                                <span className="inline-block h-2 w-2 rounded-full bg-[#22D3EE] animate-pulse flex-shrink-0" />
                                {doctor.name}
                              </h3>
                              <p className="text-sm text-[#9CA3AF] mt-1 capitalize">
                                {doctor.specialty}
                              </p>
                            </div>
                            <div className="rounded-lg bg-gradient-to-br from-[#22D3EE]/20 to-[#8B5CF6]/20 px-3 py-2 text-sm font-bold text-[#22D3EE] flex-shrink-0">
                              {doctor.distance} mi
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-2">
                            {doctor.hospital && (
                              <div className="flex items-start gap-2 text-sm">
                                <MapPin className="h-4 w-4 flex-shrink-0 text-[#22D3EE] mt-0.5" />
                                <span className="text-[#9CA3AF]">{doctor.hospital}</span>
                              </div>
                            )}
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="h-4 w-4 flex-shrink-0 text-[#22D3EE] mt-0.5" />
                              <span className="text-[#9CA3AF]">{doctor.address}</span>
                            </div>
                            {doctor.phone !== 'Phone not listed' && (
                              <div className="flex items-start gap-2 text-sm">
                                <Phone className="h-4 w-4 flex-shrink-0 text-[#22D3EE] mt-0.5" />
                                <a
                                  href={`tel:${doctor.phone}`}
                                  className="text-[#22D3EE] hover:underline font-medium"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {doctor.phone}
                                </a>
                              </div>
                            )}
                            {doctor.hours !== 'Hours not listed' && (
                              <div className="flex items-start gap-2 text-sm">
                                <Clock className="h-4 w-4 flex-shrink-0 text-[#22D3EE] mt-0.5" />
                                <span className="text-[#9CA3AF]">{doctor.hours}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}