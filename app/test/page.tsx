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
        <section className="border-b border-border/50 bg-gradient-to-br from-background via-secondary/10 to-primary/5">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div className="grid gap-8 items-center md:grid-cols-2">
              <div className="animate-slide-up">
                <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
                  Voice Recording Test
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Record your voice for biomarker analysis. Find a quiet environment and speak naturally. Our AI will analyze your voice for potential Parkinson's Disease indicators.
                </p>
              </div>
              <div className="hidden md:flex justify-center animate-float-in" style={{ animationDelay: "0.2s" }}>
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
          <Card className="mb-8 border-border/50 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Recording Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. Find a quiet environment with minimal background noise</p>
              <p>2. Use a good quality microphone for best results</p>
              <p>3. Speak naturally and clearly (record for at least 10 seconds)</p>
              <p>4. Avoid forced speech or shouting</p>
              <p>5. Allow 2-3 seconds of silence at the end before stopping</p>
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
            <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-primary" />
                  Live Audio Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={200}
                  className="w-full rounded-lg border border-border/50 bg-slate-950/10"
                />
              </CardContent>
            </Card>
          )}

          {/* Recording Controls */}
          {audioURL && !isAnalyzing && !analysisResults && (
            <Card className="mb-8 border-border/50">
              <CardHeader>
                <CardTitle>Recording Ready</CardTitle>
                <CardDescription>Your voice has been recorded successfully</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <audio controls className="w-full rounded-lg bg-secondary/50 p-2">
                  <source src={audioURL} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
                <div className="flex gap-3 sm:flex-row flex-col">
                  <Button onClick={analyzeVoice} className="flex-1 bg-primary hover:bg-primary/90">
                    Analyze Voice
                  </Button>
                  <Button onClick={reset} variant="outline" className="flex-1">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Record Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {isAnalyzing && (
            <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Analyzing Voice...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-3 w-3 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {analysisResults && (
            <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Biomarker Analysis Results</CardTitle>
                <CardDescription>Your voice analysis summary (for informational purposes only)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm text-muted-foreground">Jitter</p>
                    <p className="mt-2 text-2xl font-bold text-primary">{analysisResults.jitter}%</p>
                    <p className="mt-1 text-xs text-muted-foreground">Frequency variation</p>
                  </div>
                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                    <p className="text-sm text-muted-foreground">Shimmer</p>
                    <p className="mt-2 text-2xl font-bold text-accent">{analysisResults.shimmer} dB</p>
                    <p className="mt-1 text-xs text-muted-foreground">Amplitude variation</p>
                  </div>
                  <div className="rounded-lg border border-blue-400/20 bg-blue-400/5 p-4">
                    <p className="text-sm text-muted-foreground">HNR</p>
                    <p className="mt-2 text-2xl font-bold text-blue-400">{analysisResults.hnr} dB</p>
                    <p className="mt-1 text-xs text-muted-foreground">Voice clarity</p>
                  </div>
                  <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4">
                    <p className="text-sm text-muted-foreground">F0</p>
                    <p className="mt-2 text-2xl font-bold text-cyan-400">{analysisResults.f0} Hz</p>
                    <p className="mt-1 text-xs text-muted-foreground">Fundamental frequency</p>
                  </div>
                  <div className="rounded-lg border border-teal-400/20 bg-teal-400/5 p-4">
                    <p className="text-sm text-muted-foreground">DDA</p>
                    <p className="mt-2 text-2xl font-bold text-teal-400">{analysisResults.dda}%</p>
                    <p className="mt-1 text-xs text-muted-foreground">Delta amplitude</p>
                  </div>
                  <div className="rounded-lg border border-green-400/20 bg-green-400/5 p-4">
                    <p className="text-sm text-muted-foreground">PPE</p>
                    <p className="mt-2 text-2xl font-bold text-green-400">{analysisResults.ppe}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Pitch perturbation</p>
                  </div>
                </div>

                <div className="mt-8 flex gap-3 sm:flex-row flex-col">
                  <a href="/report" className="flex-1">
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      View Full Report
                    </Button>
                  </a>
                  <Button onClick={reset} variant="outline" className="flex-1">
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
