import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../store/store'
import { startRecording, stopRecording, setAudioURL, setRecordingTime, setIsAnalyzing, resetRecording } from '../store/slices/recordingSlice'
import { setAnalysisResults, setIsLoading } from '../store/slices/resultsSlice'
import UserFormDialog from '../components/UserFormDialog'
import { AlertCircle, Mic, Square, RotateCcw, Volume2 } from 'lucide-react'

const MAX_RECORDING_TIME = 10 // 10 seconds

export default function TestPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isRecording, audioURL, recordingTime, isAnalyzing } = useSelector((state: RootState) => state.recording)
  const { isFormSubmitted, age, gender } = useSelector((state: RootState) => state.user)
  const { analysisResults } = useSelector((state: RootState) => state.results)

  const [showForm, setShowForm] = useState(!isFormSubmitted)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const animationIdRef = useRef<number | null>(null)

  // Timer effect
  useEffect(() => {
    if (!isRecording) return

    timerIntervalRef.current = setInterval(() => {
      const newTime = recordingTime + 1

      if (newTime > MAX_RECORDING_TIME) {
        handleStopRecording()
      }

      dispatch(setRecordingTime(newTime))
    }, 1000)

    return () => clearInterval(timerIntervalRef.current!)
  }, [isRecording, recordingTime])

  // Canvas animation effect
  useEffect(() => {
    if (isRecording && canvasRef.current && analyzerRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!
      const analyser = analyzerRef.current
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const animate = () => {
        analyser.getByteFrequencyData(dataArray)

        ctx.fillStyle = '#0B1220'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const barWidth = (canvas.width / dataArray.length) * 2.5
        let x = 0

        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height

          const hue = (i / dataArray.length * 60) + 180
          ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

          x += barWidth + 1
        }

        animationIdRef.current = requestAnimationFrame(animate)
      }

      animate()
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [isRecording])

  const handleStartRecording = async () => {
    if (!isFormSubmitted) {
      setShowForm(true)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Create audio context for visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      analyzerRef.current = analyser
      analyser.fftSize = 256

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' })
        const url = URL.createObjectURL(audioBlob)
        dispatch(setAudioURL(url))

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      dispatch(startRecording())
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access your microphone. Please check permissions.')
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      dispatch(stopRecording())

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }

  const handleAnalyzeVoice = async () => {
    if (!audioURL || !age || !gender) return

    dispatch(setIsLoading(true))

    try {
      // Simulate API call with mock results
      // In production, send audioURL, age, and gender to backend
      const mockResults = {
        jitter: (Math.random() * 2 + 0.5).toFixed(2),
        shimmer: (Math.random() * 8 + 2).toFixed(2),
        hnr: (Math.random() * 15 + 15).toFixed(2),
        f0: Math.floor(Math.random() * 100 + 100),
        dda: (Math.random() * 8 + 1).toFixed(2),
        ppe: (Math.random() * 0.5 + 0.1).toFixed(3),
        riskScore: Math.floor(Math.random() * 100),
        timestamp: new Date().toISOString(),
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      dispatch(setAnalysisResults(mockResults))
      dispatch(setIsLoading(false))
    } catch (error) {
      console.error('Error analyzing voice:', error)
      dispatch(setIsLoading(false))
    }
  }

  const handleReset = () => {
    dispatch(resetRecording())
  }

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-[#0B1220]">
      <UserFormDialog isOpen={showForm} onClose={() => setShowForm(false)} />

      {/* Hero Section */}
      <section className="border-b border-[#1F2937]/30 bg-gradient-to-br from-[#0B1220] via-[#111827]/30 to-[#0B1220]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="animate-fade-in-up">
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Voice Recording Test
            </h1>
            <p className="text-lg text-[#9CA3AF] leading-relaxed">
              Record your voice for biomarker analysis. Find a quiet environment and speak naturally. Your recording is limited to {MAX_RECORDING_TIME} seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        {/* Instructions Card */}
        <div className="mb-8 rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6 hover:shadow-lg hover:shadow-[#22D3EE]/10 transition-all">
          <div className="flex gap-4">
            <AlertCircle className="h-6 w-6 flex-shrink-0 text-[#22D3EE]" />
            <div className="flex-1">
              <h3 className="font-semibold text-[#E5E7EB] mb-3">Recording Instructions</h3>
              <ul className="space-y-2 text-sm text-[#9CA3AF]">
                <li className="flex items-start gap-3">
                  <span className="text-[#22D3EE] font-bold">1.</span> Find a quiet environment
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#22D3EE] font-bold">2.</span> Use a good quality microphone
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#22D3EE] font-bold">3.</span> Speak naturally for 10 seconds
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#22D3EE] font-bold">4.</span> Avoid forced speech or shouting
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Animated Mic Button */}
        <div className="mb-12 flex justify-center">
          <div className="relative h-56 w-56 flex items-center justify-center">
            {isRecording && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-[#22D3EE]/30 animate-recording-pulse" />
                <div className="absolute inset-8 rounded-full border-2 border-[#8B5CF6]/25 animate-ripple" />
              </>
            )}

            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={isAnalyzing}
              className={`relative flex h-48 w-48 items-center justify-center rounded-full text-white transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed ${
                isRecording
                  ? "bg-gradient-to-br from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] animate-recording-pulse"
                  : "bg-gradient-to-br from-[#22D3EE] to-[#06B6D4] hover:from-[#06B6D4] hover:to-[#0891B2]"
              }`}
            >
              {isRecording && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                </div>
              )}

              <div className="relative z-10 flex flex-col items-center gap-3">
                {isRecording ? (
                  <>
                    <div className="relative">
                      <Square className="h-8 w-8 animate-bounce" style={{ animationDuration: '1.2s' }} />
                      <div className="absolute inset-0 animate-pulse bg-white/20 rounded-sm" />
                    </div>
                    <span className="text-sm font-bold tracking-wider">{formatTime(recordingTime)}</span>
                    <span className="text-xs opacity-80">Recording...</span>
                  </>
                ) : (
                  <>
                    <div className="relative animate-bounce" style={{ animationDuration: '2s' }}>
                      <Mic className="h-10 w-10" />
                      <div className="absolute inset-0 animate-pulse bg-white/20 rounded-full" />
                    </div>
                    <span className="text-sm font-semibold">Start Test</span>
                    <span className="text-xs opacity-80">Click to begin</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Waveform Visualization */}
        {isRecording && (
          <div className="mb-8 rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <Volume2 className="h-5 w-5 text-[#22D3EE] animate-pulse" />
              <h3 className="text-lg font-semibold text-[#E5E7EB]">Live Audio Visualization</h3>
            </div>
            <div className="rounded-lg border border-[#1F2937]/60 bg-gradient-to-b from-[#111827]/50 to-[#0B1220]/50 p-2">
              <canvas
                ref={canvasRef}
                width={800}
                height={200}
                className="w-full rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Audio Playback */}
        {audioURL && !isAnalyzing && !analysisResults && (
          <div className="mb-8 rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6 animate-fade-in-up hover:shadow-lg hover:shadow-[#22D3EE]/10 transition-all">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" />
              <h3 className="text-lg font-semibold text-[#E5E7EB]">Recording Ready</h3>
            </div>
            <p className="text-sm text-[#9CA3AF] mb-4">Your voice has been recorded successfully</p>

            <div className="rounded-lg border border-[#1F2937]/60 bg-[#0B1220]/60 p-4 mb-6">
              <audio controls className="w-full accent-[#22D3EE]">
                <source src={audioURL} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            </div>

            <div className="flex gap-3 sm:flex-row flex-col">
              <button
                onClick={handleAnalyzeVoice}
                className="flex-1 rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-6 py-3 text-base font-semibold text-[#0B1220] hover:from-[#06B6D4] hover:to-[#0891B2] transition-all transform hover:scale-105 shadow-lg shadow-[#22D3EE]/20"
              >
                Analyze Voice
              </button>
              <button
                onClick={handleReset}
                className="flex-1 rounded-lg border border-[#1F2937]/60 bg-transparent px-6 py-3 text-base font-semibold text-[#E5E7EB] hover:bg-[#1F2937]/20 transition-all"
              >
                <RotateCcw className="inline mr-2 h-4 w-4" />
                Record Again
              </button>
            </div>
          </div>
        )}

        {/* Analysis Loading */}
        {isAnalyzing && (
          <div className="mb-8 rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-12 animate-fade-in-up">
            <div className="flex justify-center gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-3 w-3 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            <p className="text-center mt-4 text-[#9CA3AF]">Analyzing your voice...</p>
          </div>
        )}

        {/* Results */}
        {analysisResults && (
          <div className="mb-8 rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6 animate-fade-in-up hover:shadow-lg hover:shadow-[#22D3EE]/10 transition-all">
            <h3 className="text-xl font-semibold text-[#E5E7EB] mb-6">Biomarker Analysis Results</h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              <div className="rounded-lg border border-[#22D3EE]/30 bg-gradient-to-br from-[#22D3EE]/10 to-[#06B6D4]/5 p-4 hover:shadow-lg hover:shadow-[#22D3EE]/20 transition-all transform hover:scale-105">
                <p className="text-sm text-[#9CA3AF]">Jitter</p>
                <p className="mt-2 text-2xl font-bold text-[#22D3EE]">{analysisResults.jitter}%</p>
              </div>
              <div className="rounded-lg border border-[#8B5CF6]/30 bg-gradient-to-br from-[#8B5CF6]/10 to-[#A78BFA]/5 p-4 hover:shadow-lg hover:shadow-[#8B5CF6]/20 transition-all transform hover:scale-105">
                <p className="text-sm text-[#9CA3AF]">Shimmer</p>
                <p className="mt-2 text-2xl font-bold text-[#8B5CF6]">{analysisResults.shimmer} dB</p>
              </div>
              <div className="rounded-lg border border-[#06B6D4]/30 bg-gradient-to-br from-[#06B6D4]/10 to-[#0891B2]/5 p-4 hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all transform hover:scale-105">
                <p className="text-sm text-[#9CA3AF]">HNR</p>
                <p className="mt-2 text-2xl font-bold text-[#06B6D4]">{analysisResults.hnr} dB</p>
              </div>
            </div>

            <div className="flex gap-3 sm:flex-row flex-col">
              <button
                onClick={() => navigate('/report')}
                className="flex-1 rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-6 py-3 text-base font-semibold text-[#0B1220] hover:from-[#06B6D4] hover:to-[#0891B2] transition-all transform hover:scale-105 shadow-lg shadow-[#22D3EE]/20"
              >
                View Full Report
              </button>
              <button
                onClick={handleReset}
                className="flex-1 rounded-lg border border-[#1F2937]/60 bg-transparent px-6 py-3 text-base font-semibold text-[#E5E7EB] hover:bg-[#1F2937]/20 transition-all"
              >
                <RotateCcw className="inline mr-2 h-4 w-4" />
                New Test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
