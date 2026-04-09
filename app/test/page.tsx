"use client"

import { useState, useRef, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Mic, Square, RotateCcw, Volume2 } from "lucide-react"
import { AnimatedVoiceWaves } from "@/components/illustrations"

interface WaveformData {
  frequency: number
  amplitude: number
}

export default function TestPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<{
    jitter: number
    shimmer: number
    hnr: number
    f0: number
    dda: number
    ppe: number
  } | null>(null)

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Create audio context for visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      dataArrayRef.current = dataArray

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const audioChunks: Blob[] = []
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Draw waveform
      drawWaveform(analyser, dataArray)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("Please allow microphone access to use this feature")
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Stop all tracks
      streamRef.current?.getTracks().forEach((track) => track.stop())
      audioContextRef.current?.close()
    }
  }

  // Draw animated waveform
  const drawWaveform = (analyser: AnalyserNode, dataArray: Uint8Array) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      if (!isRecording) return

      requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      // Clear canvas
      ctx.fillStyle = "rgb(248 249 250 / 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw frequency bars
      const barWidth = (canvas.width / dataArray.length) * 2.5
      let x = 0

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height

        // Gradient color - blue to mint
        const hue = 200 + (i / dataArray.length) * 80
        ctx.fillStyle = `hsl(${hue}, 70%, 55%)`
        ctx.globalAlpha = 0.8

        ctx.beginPath()
        ctx.moveTo(x, canvas.height)
        ctx.lineTo(x, canvas.height - barHeight)
        ctx.lineWidth = Math.max(1, barWidth)
        ctx.strokeStyle = `hsl(${hue}, 70%, 55%)`
        ctx.stroke()

        x += barWidth + 1
      }

      ctx.globalAlpha = 1
    }

    draw()
  }

  // Simulate voice analysis
  const analyzeVoice = async () => {
    setIsAnalyzing(true)
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Generate mock analysis results
    const results = {
      jitter: (Math.random() * 2).toFixed(2),
      shimmer: (Math.random() * 8).toFixed(2),
      hnr: (20 + Math.random() * 15).toFixed(2),
      f0: (120 + Math.random() * 80).toFixed(0),
      dda: (Math.random() * 20).toFixed(2),
      ppe: (Math.random() * 0.5).toFixed(3),
    }

    setAnalysisResults(results as any)
    setIsAnalyzing(false)
  }

  // Reset
  const reset = () => {
    setAudioURL(null)
    setAnalysisResults(null)
    setRecordingTime(0)
  }

  // Timer effect
  useEffect(() => {
    if (!isRecording) return

    const interval = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRecording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        {/* Hero Section */}
        <section className="border-b border-[#1F2937]/30 bg-gradient-to-br from-[#0B1220] via-[#111827]/50 to-[#0B1220]">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div className="grid gap-8 items-center md:grid-cols-2">
              <div className="animate-fade-in-up">
                <h1 className="mb-4 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
                  Voice Recording Test
                </h1>
                <p className="text-lg text-[#9CA3AF] leading-relaxed">
                  Record your voice for biomarker analysis. Find a quiet environment and speak naturally. Our AI will analyze your voice for potential Parkinson's Disease indicators.
                </p>
              </div>
              <div className="hidden md:flex justify-center animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                <div className="w-40 h-40">
                  <AnimatedVoiceWaves />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
          {/* Recording Instructions */}
          <Card className="mb-8 border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm hover-lift-animation">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#E5E7EB]">
                <AlertCircle className="h-5 w-5 text-[#22D3EE]" />
                Recording Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[#9CA3AF]">
              <p className="flex items-start gap-3"><span className="text-[#22D3EE] font-bold">1.</span> Find a quiet environment with minimal background noise</p>
              <p className="flex items-start gap-3"><span className="text-[#22D3EE] font-bold">2.</span> Use a good quality microphone for best results</p>
              <p className="flex items-start gap-3"><span className="text-[#22D3EE] font-bold">3.</span> Speak naturally and clearly (record for at least 10 seconds)</p>
              <p className="flex items-start gap-3"><span className="text-[#22D3EE] font-bold">4.</span> Avoid forced speech or shouting</p>
              <p className="flex items-start gap-3"><span className="text-[#22D3EE] font-bold">5.</span> Allow 2-3 seconds of silence at the end before stopping</p>
            </CardContent>
          </Card>

          {/* Animated Mic Button */}
          <div className="mb-12 flex justify-center">
            <div className="relative h-56 w-56 flex items-center justify-center">
              {/* Outer glow rings - only during recording */}
              {isRecording && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-mic-glow" />
                  <div className="absolute inset-8 rounded-full border-2 border-accent/25 animate-mic-pulse" />
                </>
              )}

              {/* Main Button with enhanced styling */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isAnalyzing}
                className={`relative flex h-48 w-48 items-center justify-center rounded-full text-primary-foreground transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRecording
                    ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-mic-pulse"
                    : "bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90 animate-mic-bounce"
                }`}
              >
                {/* Animated background shimmer effect */}
                {isRecording && (
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                  </div>
                )}

                <div className="relative z-10 flex flex-col items-center gap-3">
                  {isRecording ? (
                    <>
                      <div className="relative">
                        <Square className="h-8 w-8 animate-bounce" style={{ animationDuration: "1.2s" }} />
                        <div className="absolute inset-0 animate-pulse bg-white/20 rounded-sm" />
                      </div>
                      <span className="text-sm font-bold tracking-wider">{formatTime(recordingTime)}</span>
                      <span className="text-xs opacity-80">Recording...</span>
                    </>
                  ) : (
                    <>
                      <div className={`relative ${isRecording ? "" : "animate-bounce"}`} style={{ animationDuration: "2s" }}>
                        <Mic className="h-10 w-10" />
                        <div className="absolute inset-0 animate-pulse bg-white/20 rounded-full" />
                      </div>
                      <span className="text-sm font-semibold">Start Test</span>
                      <span className="text-xs opacity-80">Tap to begin</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Waveform Visualization */}
          {isRecording && (
            <Card className="mb-8 border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm animate-fade-in-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#E5E7EB]">
                  <Volume2 className="h-5 w-5 text-[#22D3EE] animate-pulse" />
                  Live Audio Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-[#1F2937]/60 bg-gradient-to-b from-[#111827]/50 to-[#0B1220]/50 p-2">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={200}
                    className="w-full rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recording Controls */}
          {audioURL && !isAnalyzing && !analysisResults && (
            <Card className="mb-8 border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm animate-fade-in-up hover-lift-animation">
              <CardHeader>
                <CardTitle className="text-[#E5E7EB] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" />
                  Recording Ready
                </CardTitle>
                <CardDescription className="text-[#9CA3AF]">Your voice has been recorded successfully</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-[#1F2937]/60 bg-[#0B1220]/60 p-4">
                  <audio controls className="w-full accent-[#22D3EE]">
                    <source src={audioURL} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
                <div className="flex gap-3 sm:flex-row flex-col">
                  <Button onClick={analyzeVoice} className="flex-1 bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] hover:from-[#06B6D4] hover:to-[#0891B2] text-[#0B1220] font-semibold transform transition-transform hover:scale-105">
                    Analyze Voice
                  </Button>
                  <Button onClick={reset} variant="outline" className="flex-1 border-[#1F2937]/60 text-[#E5E7EB] hover:bg-[#1F2937]/20">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Record Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {isAnalyzing && (
            <Card className="mb-8 border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm animate-fade-in-up">
              <CardHeader>
                <CardTitle className="text-[#E5E7EB]">Analyzing Voice...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-3 py-6">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-3 w-3 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysisResults && (
            <Card className="mb-8 border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm animate-fade-in-up hover-lift-animation">
              <CardHeader>
                <CardTitle className="text-[#E5E7EB]">Biomarker Analysis Results</CardTitle>
                <CardDescription className="text-[#9CA3AF]">Your voice analysis summary (for informational purposes only)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border border-[#22D3EE]/30 bg-gradient-to-br from-[#22D3EE]/10 to-[#06B6D4]/5 p-4 hover-lift-animation">
                    <p className="text-sm text-[#9CA3AF]">Jitter</p>
                    <p className="mt-2 text-2xl font-bold text-[#22D3EE] animate-glow-cyan">{analysisResults.jitter}%</p>
                    <p className="mt-1 text-xs text-[#6B7280]">Frequency variation</p>
                  </div>
                  <div className="rounded-lg border border-[#8B5CF6]/30 bg-gradient-to-br from-[#8B5CF6]/10 to-[#A78BFA]/5 p-4 hover-lift-animation">
                    <p className="text-sm text-[#9CA3AF]">Shimmer</p>
                    <p className="mt-2 text-2xl font-bold text-[#8B5CF6] animate-glow-purple">{analysisResults.shimmer} dB</p>
                    <p className="mt-1 text-xs text-[#6B7280]">Amplitude variation</p>
                  </div>
                  <div className="rounded-lg border border-[#06B6D4]/30 bg-gradient-to-br from-[#06B6D4]/10 to-[#0891B2]/5 p-4 hover-lift-animation">
                    <p className="text-sm text-[#9CA3AF]">HNR</p>
                    <p className="mt-2 text-2xl font-bold text-[#06B6D4]">{analysisResults.hnr} dB</p>
                    <p className="mt-1 text-xs text-[#6B7280]">Voice clarity</p>
                  </div>
                  <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-400/5 p-4 hover-lift-animation">
                    <p className="text-sm text-[#9CA3AF]">F0</p>
                    <p className="mt-2 text-2xl font-bold text-cyan-400">{analysisResults.f0} Hz</p>
                    <p className="mt-1 text-xs text-[#6B7280]">Fundamental frequency</p>
                  </div>
                  <div className="rounded-lg border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-teal-400/5 p-4 hover-lift-animation">
                    <p className="text-sm text-[#9CA3AF]">DDA</p>
                    <p className="mt-2 text-2xl font-bold text-teal-400">{analysisResults.dda}%</p>
                    <p className="mt-1 text-xs text-[#6B7280]">Delta amplitude</p>
                  </div>
                  <div className="rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-400/5 p-4 hover-lift-animation">
                    <p className="text-sm text-[#9CA3AF]">PPE</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-400">{analysisResults.ppe}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">Pitch perturbation</p>
                  </div>
                </div>

                <div className="mt-8 flex gap-3 sm:flex-row flex-col">
                  <a href="/report" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] hover:from-[#06B6D4] hover:to-[#0891B2] text-[#0B1220] font-semibold transform transition-transform hover:scale-105">
                      View Full Report
                    </Button>
                  </a>
                  <Button onClick={reset} variant="outline" className="flex-1 border-[#1F2937]/60 text-[#E5E7EB] hover:bg-[#1F2937]/20">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    New Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
