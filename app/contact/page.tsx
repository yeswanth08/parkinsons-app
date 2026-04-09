"use client"

import { useState, useEffect, useRef } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, Clock, AlertCircle, Locate, Search } from "lucide-react"
import { AnimatedDoctorIllustration, AnimatedLocationPin } from "@/components/illustrations"

interface Doctor {
  id: number
  name: string
  specialty: string
  hospital: string
  lat: number
  lng: number
  distance: number
  phone: string
  address: string
  hours: string
}

// Mock doctor data (in real app, this would come from an API)
const mockDoctors: Doctor[] = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    specialty: "Neurologist",
    hospital: "City Medical Center",
    lat: 40.7128,
    lng: -74.006,
    distance: 1.2,
    phone: "+1 (555) 123-4567",
    address: "123 Park Ave, New York, NY 10016",
    hours: "Mon-Fri: 9am-5pm"
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    specialty: "Movement Disorder Specialist",
    hospital: "Metropolitan Hospital",
    lat: 40.758,
    lng: -73.9855,
    distance: 2.5,
    phone: "+1 (555) 234-5678",
    address: "456 5th Ave, New York, NY 10017",
    hours: "Mon-Sat: 8am-6pm"
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    specialty: "Neurologist",
    hospital: "Presbyterian Hospital",
    lat: 40.768,
    lng: -73.9776,
    distance: 3.1,
    phone: "+1 (555) 345-6789",
    address: "789 Madison Ave, New York, NY 10065",
    hours: "Tue-Fri: 10am-4pm"
  },
  {
    id: 4,
    name: "Dr. James Wilson",
    specialty: "Movement Disorder Specialist",
    hospital: "Riverside Medical Center",
    lat: 40.7484,
    lng: -73.9857,
    distance: 1.8,
    phone: "+1 (555) 456-7890",
    address: "321 West St, New York, NY 10014",
    hours: "Mon-Fri: 9am-5pm, Sat: 10am-2pm"
  }
]

export default function ContactPage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [searchRadius, setSearchRadius] = useState(5)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Get user location
  const getUserLocation = () => {
    setLocationError(null)
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })

        // Calculate distances from user to doctors
        const doctorsWithDistance = mockDoctors.map((doctor) => ({
          ...doctor,
          distance: calculateDistance(latitude, longitude, doctor.lat, doctor.lng)
        }))

        // Sort by distance
        doctorsWithDistance.sort((a, b) => a.distance - b.distance)
        setDoctors(doctorsWithDistance)
      },
      (error) => {
        setLocationError(`Error: ${error.message}`)
      }
    )
  }

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959 // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return parseFloat((R * c).toFixed(1))
  }

  // Draw map
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Draw background
    ctx.fillStyle = "rgb(248 249 250)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = "rgba(0, 0, 0, 0.05)"
    ctx.lineWidth = 1
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvas.width, i)
      ctx.stroke()
    }

    // Calculate bounds
    const allPoints = userLocation
      ? [userLocation, ...doctors]
      : doctors

    const minLat = Math.min(...allPoints.map((p) => p.lat))
    const maxLat = Math.max(...allPoints.map((p) => p.lat))
    const minLng = Math.min(...allPoints.map((p) => p.lng))
    const maxLng = Math.max(...allPoints.map((p) => p.lng))

    const padding = 0.1
    const latRange = maxLat - minLat || 0.1
    const lngRange = maxLng - minLng || 0.1

    // Draw doctors
    doctors.forEach((doctor) => {
      const x = ((doctor.lng - (minLng - padding * lngRange)) / (lngRange + 2 * padding * lngRange)) * canvas.width
      const y = ((maxLat + padding * latRange - doctor.lat) / (latRange + 2 * padding * latRange)) * canvas.height

      // Doctor marker
      ctx.fillStyle = selectedDoctor?.id === doctor.id ? "#3b82f6" : "#81c3f7"
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = "#fff"
      ctx.lineWidth = 2
      ctx.stroke()
    })

    // Draw user location
    if (userLocation) {
      const x = ((userLocation.lng - (minLng - padding * lngRange)) / (lngRange + 2 * padding * lngRange)) * canvas.width
      const y = ((maxLat + padding * latRange - userLocation.lat) / (latRange + 2 * padding * latRange)) * canvas.height

      ctx.fillStyle = "#00d084"
      ctx.beginPath()
      ctx.arc(x, y, 10, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = "#fff"
      ctx.lineWidth = 2
      ctx.stroke()

      // Add outline pulse
      ctx.strokeStyle = "rgba(0, 208, 132, 0.5)"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(x, y, 15, 0, Math.PI * 2)
      ctx.stroke()
    }
  }, [userLocation, doctors, selectedDoctor])

  const filteredDoctors = doctors.filter((doc) => doc.distance <= searchRadius)

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        {/* Hero Section */}
        <section className="border-b border-border/50 bg-gradient-to-br from-background via-secondary/10 to-accent/5">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div className="grid gap-8 items-center md:grid-cols-2">
              <div className="animate-slide-up">
                <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
                  Find Parkinson&apos;s Specialists
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Locate qualified neurologists and movement disorder specialists near you. Use geolocation to discover the best doctors in your area.
                </p>
              </div>
              <div className="hidden md:flex justify-center animate-float-in" style={{ animationDelay: "0.2s" }}>
                <div className="w-48 h-48">
                  <AnimatedDoctorIllustration />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
          {/* Location Permission */}
          {!userLocation && (
            <Card className="mb-8 border-border/50 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Locate className="h-5 w-5 text-primary" />
                  Enable Location Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To find doctors near you, please enable location access. We use your location only to calculate distances to nearby specialists.
                </p>
                <Button onClick={getUserLocation} className="gap-2 bg-primary hover:bg-primary/90">
                  <Locate className="h-4 w-4" />
                  Get My Location
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {locationError && (
            <Card className="mb-8 border-border/50 bg-red-50/50 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  Location Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{locationError}</p>
              </CardContent>
            </Card>
          )}

          {/* Map Section */}
          {userLocation && (
            <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Interactive Map
                </CardTitle>
                <CardDescription>Green marker shows your location, blue markers show doctors</CardDescription>
              </CardHeader>
              <CardContent>
                <canvas
                  ref={canvasRef}
                  className="w-full rounded-lg border border-border/50 bg-white dark:bg-slate-950"
                  style={{ height: "400px" }}
                />
                <div className="mt-4 flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search radius (miles):</span>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(Number(e.target.value))}
                      className="w-32"
                    />
                    <span className="text-sm font-semibold text-foreground">{searchRadius} mi</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Specialists Nearby
            </h2>
            <p className="mb-6 text-muted-foreground">
              {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? "s" : ""} found within {searchRadius} miles
            </p>

            {filteredDoctors.length === 0 ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-slide-up">
                <CardContent className="py-12 text-center">
                  <MapPin className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No specialists found in your search radius. Try increasing the distance.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {filteredDoctors.map((doctor, idx) => (
                  <button
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className="text-left animate-float-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <Card
                      className={`border-border/50 backdrop-blur-sm transition-all cursor-pointer duration-300 transform hover:scale-105 ${
                        selectedDoctor?.id === doctor.id
                          ? "bg-primary/10 border-primary shadow-lg shadow-primary/20"
                          : "bg-card/50 hover:bg-card/80 hover:shadow-lg"
                      }`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                              {doctor.name}
                            </CardTitle>
                            <CardDescription className="mt-1">{doctor.specialty}</CardDescription>
                          </div>
                          <div className="rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 px-3 py-2 text-sm font-bold text-primary animate-pulse">
                            {doctor.distance} mi
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-start gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity">
                          <Building className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                          <span className="text-muted-foreground">{doctor.hospital}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                          <span className="text-muted-foreground">{doctor.address}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Phone className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                          <a href={`tel:${doctor.phone}`} className="text-primary hover:underline font-medium transition-colors">
                            {doctor.phone}
                          </a>
                        </div>
                        <div className="flex items-start gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity">
                          <Clock className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                          <span className="text-muted-foreground">{doctor.hours}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Need More Help?</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">Call Us</span>
                </div>
                <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                <p className="text-xs text-muted-foreground">Mon-Fri, 9am-5pm EST</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">Email Us</span>
                </div>
                <p className="text-sm text-muted-foreground">support@neurovox.app</p>
                <p className="text-xs text-muted-foreground">We&apos;ll respond within 24 hours</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">Emergency</span>
                </div>
                <p className="text-sm text-muted-foreground">Call 911 (US)</p>
                <p className="text-xs text-muted-foreground">For immediate medical attention</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </main>
  )
}

// Building icon component since it's not in lucide-react by default
function Building(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
