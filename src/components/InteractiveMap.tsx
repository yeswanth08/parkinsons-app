import { useEffect, useRef, useState } from 'react'

interface Doctor {
  id: number
  lat: number
  lng: number
  name: string
  distance: string
  specialty: string
}

interface MapProps {
  doctors: Doctor[]
  userLocation: { lat: number; lng: number } | null
  onDoctorSelect: (doctor: Doctor) => void
  selectedDoctor: Doctor | null
}

export default function InteractiveMap({ doctors, userLocation, onDoctorSelect, selectedDoctor }: MapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !userLocation) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas DPI
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#0B1220')
    gradient.addColorStop(0.5, '#111827')
    gradient.addColorStop(1, '#0B1220')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.1)'
    ctx.lineWidth = 1
    const gridSize = 40

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Calculate map bounds
    const allLats = [userLocation.lat, ...doctors.map(d => d.lat)]
    const allLngs = [userLocation.lng, ...doctors.map(d => d.lng)]
    const minLat = Math.min(...allLats)
    const maxLat = Math.max(...allLats)
    const minLng = Math.min(...allLngs)
    const maxLng = Math.max(...allLngs)

    const latRange = maxLat - minLat || 0.01
    const lngRange = maxLng - minLng || 0.01
    const padding = 0.15

    // Project lat/lng to canvas coordinates
    const projectPoint = (lat: number, lng: number) => {
      const x = ((lng - minLng) / lngRange) * (width * 0.8) + (width * 0.1) + pan.x
      const y = height - ((lat - minLat) / latRange) * (height * 0.8) - (height * 0.1) + pan.y
      return { x: x * zoom, y: y * zoom }
    }

    // Draw doctors with animated glow
    doctors.forEach((doctor, idx) => {
      const { x, y } = projectPoint(doctor.lat, doctor.lng)
      const isSelected = selectedDoctor?.id === doctor.id
      const glow = Math.sin(Date.now() / 1000 + idx * 0.5) * 10 + 20

      // Glow effect
      ctx.fillStyle = isSelected ? 'rgba(34, 211, 238, 0.3)' : 'rgba(34, 211, 238, 0.15)'
      ctx.beginPath()
      ctx.arc(x, y, glow, 0, Math.PI * 2)
      ctx.fill()

      // Doctor marker
      ctx.fillStyle = isSelected ? '#22D3EE' : '#06B6D4'
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()

      // Border
      ctx.strokeStyle = '#E5E7EB'
      ctx.lineWidth = 2
      ctx.stroke()

      // Label
      if (isSelected) {
        ctx.fillStyle = '#E5E7EB'
        ctx.font = 'bold 12px Inter'
        ctx.textAlign = 'center'
        ctx.fillText(doctor.name.split(' ')[0], x, y - 20)
      }
    })

    // Draw user location
    if (userLocation) {
      const { x, y } = projectPoint(userLocation.lat, userLocation.lng)
      const userGlow = Math.sin(Date.now() / 800) * 15 + 25

      // Pulsing glow
      ctx.fillStyle = 'rgba(139, 92, 246, 0.2)'
      ctx.beginPath()
      ctx.arc(x, y, userGlow, 0, Math.PI * 2)
      ctx.fill()

      // User marker (star)
      ctx.fillStyle = '#8B5CF6'
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('✓', x, y)

      // Ring
      ctx.strokeStyle = '#8B5CF6'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, 12, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Draw connections for nearby doctors
    doctors.forEach(doctor => {
      const distance = parseFloat(doctor.distance)
      if (distance < 5) {
        const doctorPos = projectPoint(doctor.lat, doctor.lng)
        const userPos = projectPoint(userLocation.lat, userLocation.lng)

        ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)'
        ctx.lineWidth = 1
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(userPos.x, userPos.y)
        ctx.lineTo(doctorPos.x, doctorPos.y)
        ctx.stroke()
        ctx.setLineDash([])
      }
    })

    // Draw compass
    const compassSize = 40
    const compassX = width - 60
    const compassY = 50

    ctx.fillStyle = 'rgba(17, 24, 39, 0.8)'
    ctx.fillRect(compassX - 25, compassY - 25, 50, 50)
    ctx.strokeStyle = '#22D3EE'
    ctx.lineWidth = 2
    ctx.strokeRect(compassX - 25, compassY - 25, 50, 50)

    ctx.fillStyle = '#22D3EE'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('N', compassX, compassY - 10)

    ctx.requestAnimationFrame(() => {
      // Recursive animation loop
    })
  }, [doctors, userLocation, zoom, pan, selectedDoctor])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    setPan({ x: pan.x + dx, y: pan.y + dy })
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const newZoom = e.deltaY > 0 ? zoom * 0.9 : zoom * 1.1
    setZoom(Math.max(0.5, Math.min(newZoom, 3)))
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current || !userLocation) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // Check if clicked on a doctor marker
    doctors.forEach(doctor => {
      const { x, y } = projectToCanvas(doctor.lat, doctor.lng)
      const distance = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2)

      if (distance < 15) {
        onDoctorSelect(doctor)
      }
    })
  }

  const projectToCanvas = (lat: number, lng: number) => {
    if (!userLocation || !canvasRef.current) return { x: 0, y: 0 }

    const allLats = [userLocation.lat, ...doctors.map(d => d.lat)]
    const allLngs = [userLocation.lng, ...doctors.map(d => d.lng)]
    const minLat = Math.min(...allLats)
    const maxLat = Math.max(...allLats)
    const minLng = Math.min(...allLngs)
    const maxLng = Math.max(...allLngs)

    const latRange = maxLat - minLat || 0.01
    const lngRange = maxLng - minLng || 0.01

    const width = canvasRef.current.offsetWidth
    const height = canvasRef.current.offsetHeight

    const x = ((lng - minLng) / lngRange) * (width * 0.8) + (width * 0.1) + pan.x
    const y = height - ((lat - minLat) / latRange) * (height * 0.8) - (height * 0.1) + pan.y

    return { x: x * zoom, y: y * zoom }
  }

  return (
    <div className="relative w-full h-full rounded-lg border border-[#1F2937]/40 overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        className="w-full h-full cursor-move hover:cursor-grab active:cursor-grabbing"
      />
      <div className="absolute top-4 left-4 text-xs text-[#9CA3AF] bg-[#111827]/80 backdrop-blur-sm px-3 py-2 rounded">
        Zoom: {(zoom * 100).toFixed(0)}% | Drag: Pan | Scroll: Zoom | Click: Select Doctor
      </div>
    </div>
  )
}
