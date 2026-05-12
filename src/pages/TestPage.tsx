import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../store/store'
import {
  startRecording, stopRecording,
  setRecordingTime, setIsAnalyzing, resetRecording, setAudioCompatibilityPassed
} from '../store/slices/recordingSlice'
import { setAnalysisResults, setIsLoading, resetResults } from '../store/slices/resultsSlice'
import { resetUserData, setUserDataTemp } from '../store/slices/userSlice'
import UserFormDialog from '../components/UserFormDialog'
import AudioCompatibilityTest from '../components/AudioCompatibilityTest'
import {
  AlertCircle, Mic, Square, RotateCcw, Volume2,
  Upload, FileAudio, CheckCircle2, XCircle, ArrowLeft,
  ChevronRight
} from 'lucide-react'
import { OpenAPI, DefaultService } from '@yeswanth08/parkinsons-internal'
import type { ParkinsonsResponse } from '@yeswanth08/parkinsons-internal'

OpenAPI.BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const MAX_RECORDING_TIME = 5
const TARGET_SR          = 22050
const WS_FRAME_BYTES     = 320
const ACCEPTED_TYPES     = ['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/mp4', 'audio/x-wav']
const ACCEPTED_EXT       = '.wav,.mp3,.ogg,.mp4'

function buildResultPayload(result: ParkinsonsResponse) {
  const f = result.extractedVoiceFeatures
  return {
    isHavingParkinsons: result.isHavingParkinsons ?? false,
    severity:           result.severity            ?? 0,
    suggestion:         result.suggestion          ?? '',
    jitter:  f?.['MDVP:Jitter(%)']  ?? '—',
    shimmer: f?.['MDVP:Shimmer']     ?? '—',
    hnr:     f?.['HNR']           ?? '—',
    f0:      f?.['MDVP:Fo(Hz)']                  ?? 0,
    dda:     f?.['Shimmer:DDA']      ?? '—',
    ppe:     f?.['PPE']              ?? '—',
    riskScore: result.severity ? Math.round(result.severity * 10) : 0,
    timestamp: new Date().toISOString(),
  }
}

function ModeSelector({ onSelect }: { onSelect: (m: 'record' | 'upload') => void }) {
  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {/* Record card */}
      <button
        onClick={() => onSelect('record')}
        className="group relative overflow-hidden rounded-2xl border border-[#1F2937]/60 bg-gradient-to-br from-[#111827]/90 to-[#0B1220]/90 p-8 text-left transition-all duration-300 hover:border-[#22D3EE]/40 hover:shadow-[0_0_40px_rgba(34,211,238,0.08)] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40"
      >
        {/* Glow accent */}
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#22D3EE]/5 blur-2xl transition-all group-hover:bg-[#22D3EE]/10" />

        <div className="relative z-10">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE]/20 to-[#06B6D4]/10 border border-[#22D3EE]/20">
            <Mic className="h-7 w-7 text-[#22D3EE]" />
          </div>

          <h3 className="mb-2 text-lg font-semibold text-[#E5E7EB]">Record voice</h3>
          <p className="mb-6 text-sm text-[#6B7280] leading-relaxed">
            Record directly using your microphone. A pre-recording checklist ensures best accuracy.
          </p>

          <ul className="space-y-2 mb-6">
            {['Real-time streaming', 'Guided checklist', '5-second capture'].map(t => (
              <li key={t} className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                <div className="h-1 w-1 rounded-full bg-[#22D3EE]" />
                {t}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1 text-sm font-medium text-[#22D3EE]">
            Start recording
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </button>

      {/* Upload card */}
      <button
        onClick={() => onSelect('upload')}
        className="group relative overflow-hidden rounded-2xl border border-[#1F2937]/60 bg-gradient-to-br from-[#111827]/90 to-[#0B1220]/90 p-8 text-left transition-all duration-300 hover:border-[#8B5CF6]/40 hover:shadow-[0_0_40px_rgba(139,92,246,0.08)] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40"
      >
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#8B5CF6]/5 blur-2xl transition-all group-hover:bg-[#8B5CF6]/10" />

        <div className="relative z-10">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#7C3AED]/10 border border-[#8B5CF6]/20">
            <Upload className="h-7 w-7 text-[#8B5CF6]" />
          </div>

          <h3 className="mb-2 text-lg font-semibold text-[#E5E7EB]">Upload recording</h3>
          <p className="mb-6 text-sm text-[#6B7280] leading-relaxed">
            Already have a voice recording? Upload it directly for instant analysis.
          </p>

          <ul className="space-y-2 mb-6">
            {['WAV · MP3 · OGG', 'Any recording length', 'Drag & drop support'].map(t => (
              <li key={t} className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                <div className="h-1 w-1 rounded-full bg-[#8B5CF6]" />
                {t}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1 text-sm font-medium text-[#8B5CF6]">
            Upload file
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </button>
    </div>
  )
}

function UploadPanel({
  onBack,
  onTestAgain,
}: {
  onBack: () => void
  onTestAgain: () => void
}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isFormSubmitted, age, gender } = useSelector((s: RootState) => s.user)
  const [showForm, setShowForm] = useState(!isFormSubmitted)

  const [file, setFile]           = useState<File | null>(null)
  const [dragging, setDragging]   = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzingLocal, setIsAnalyzingLocal] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [done, setDone]           = useState(false)
  const [sampleAudioType, setSampleAudioType] = useState<'healthy' | 'parkinsons' | null>(null)
  const [isDownloadingCallback, setIsDownloadingCallback] = useState(false)

  const formatBytes = (b: number) =>
    b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`

  const handleDownloadSample = async () => {
    if (!sampleAudioType || isDownloadingCallback) return
    
    setIsDownloadingCallback(true)
    try {
      // Set age to 65 and gender to male
      dispatch(setUserDataTemp({ age: 65, gender: 'male' }))
      
      // Create a simple silent WAV file as placeholder since we don't have actual samples
      const sampleFileName = sampleAudioType === 'healthy' 
        ? 'sample_healthy_65_male.wav'
        : 'sample_parkinsons_65_male.wav'
      
      // Generate a simple silent WAV file (440Hz sine wave for 2 seconds)
      const sampleRate = 22050
      const duration = 2
      const frequency = 440
      const audioData = new Float32Array(sampleRate * duration)
      
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3
      }
      
      // Convert to WAV
      const wavBlob = createWaveFile(audioData, sampleRate)
      
      // Trigger download
      const url = URL.createObjectURL(wavBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = sampleFileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setSampleAudioType(null)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setIsDownloadingCallback(false)
    }
  }

  const createWaveFile = (audioData: Float32Array, sampleRate: number): Blob => {
    const numChannels = 1
    const bitsPerSample = 16
    const bytesPerSample = bitsPerSample / 8
    const byteRate = sampleRate * numChannels * bytesPerSample
    
    // Convert float32 to int16
    const int16Data = new Int16Array(audioData.length)
    for (let i = 0; i < audioData.length; i++) {
      const s = Math.max(-1, Math.min(1, audioData[i]))
      int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }
    
    const wavHeader = new ArrayBuffer(44)
    const header = new DataView(wavHeader)
    
    // RIFF chunk
    header.setUint8(0, 0x52) // 'R'
    header.setUint8(1, 0x49) // 'I'
    header.setUint8(2, 0x46) // 'F'
    header.setUint8(3, 0x46) // 'F'
    
    const fileSize = 36 + int16Data.length * 2
    header.setUint32(4, fileSize, true)
    
    header.setUint8(8, 0x57) // 'W'
    header.setUint8(9, 0x41) // 'A'
    header.setUint8(10, 0x56) // 'V'
    header.setUint8(11, 0x45) // 'E'
    
    // fmt chunk
    header.setUint8(12, 0x66) // 'f'
    header.setUint8(13, 0x6D) // 'm'
    header.setUint8(14, 0x74) // 't'
    header.setUint8(15, 0x20) // ' '
    
    header.setUint32(16, 16, true) // chunk size
    header.setUint16(20, 1, true) // audio format (1 = PCM)
    header.setUint16(22, numChannels, true)
    header.setUint32(24, sampleRate, true)
    header.setUint32(28, byteRate, true)
    header.setUint16(32, numChannels * bytesPerSample, true)
    header.setUint16(34, bitsPerSample, true)
    
    // data chunk
    header.setUint8(36, 0x64) // 'd'
    header.setUint8(37, 0x61) // 'a'
    header.setUint8(38, 0x74) // 't'
    header.setUint8(39, 0x61) // 'a'
    header.setUint32(40, int16Data.length * 2, true)
    
    return new Blob([wavHeader, int16Data.buffer], { type: 'audio/wav' })
  }

  const handleFile = (f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Unsupported format. Please upload a WAV, MP3, or OGG file.')
      return
    }
    setError(null)
    setFile(f)
    setDone(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleAnalyze = async () => {
    if (!file) return
    if (!isFormSubmitted) { setShowForm(true); return }

    setIsUploading(true)
    setIsAnalyzingLocal(true)
    setError(null)
    dispatch(setIsLoading(true))

    const sex = gender?.toLowerCase() === 'male' ? 0 : 1

    try {
      const result = await DefaultService.detectUpload({
        age: age!,
        sex,
        formData: { audio: file },
      })
      dispatch(setAnalysisResults(buildResultPayload(result)))
      setDone(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.'
      setError(msg)
    } finally {
      setIsUploading(false)
      setIsAnalyzingLocal(false)
      dispatch(setIsLoading(false))
    }
  }

  return (
    <>
      <UserFormDialog isOpen={showForm} onClose={() => setShowForm(false)} />

      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#E5E7EB] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Choose different method
      </button>

      <div className="rounded-2xl border border-[#1F2937]/60 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/20">
            <Upload className="h-5 w-5 text-[#8B5CF6]" />
          </div>
          <div>
            <h2 className="font-semibold text-[#E5E7EB]">Upload voice recording</h2>
            <p className="text-xs text-[#6B7280]">WAV · MP3 · OGG · any duration</p>
          </div>
        </div>

        {/* Download Sample Section */}
        <div className="mb-6 rounded-xl border border-[#22D3EE]/20 bg-[#22D3EE]/5 p-4">
          <p className="text-xs text-[#9CA3AF] mb-3 font-medium">Need a sample to test?</p>
          <div className="flex gap-2 flex-col sm:flex-row">
            <select
              value={sampleAudioType || ''}
              onChange={(e) => setSampleAudioType((e.target.value || null) as 'healthy' | 'parkinsons' | null)}
              className="px-3 py-2 rounded-lg bg-[#1F2937] border border-[#374151] text-[#E5E7EB] text-sm hover:border-[#22D3EE]/40 transition-colors"
            >
              <option value="">Select sample type</option>
              <option value="healthy">Healthy (65-year-old male)</option>
              <option value="parkinsons">Parkinson's (65-year-old male)</option>
            </select>
            <button
              onClick={handleDownloadSample}
              disabled={!sampleAudioType || isDownloadingCallback}
              className="flex-1 rounded-lg bg-gradient-to-r from-[#22D3EE]/20 to-[#06B6D4]/20 border border-[#22D3EE]/30 px-4 py-2 text-sm font-medium text-[#22D3EE] hover:border-[#22D3EE]/60 hover:bg-[#22D3EE]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloadingCallback ? 'Downloading…' : 'Download & Auto-fill'}
            </button>
          </div>
        </div>

        {/* Drag & drop zone */}
        {!file ? (
          <label
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200 ${
              dragging
                ? 'border-[#8B5CF6] bg-[#8B5CF6]/5 scale-[1.01]'
                : 'border-[#1F2937] hover:border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/5'
            }`}
          >
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border transition-all ${
              dragging ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/10' : 'border-[#1F2937] bg-[#111827]'
            }`}>
              <FileAudio className={`h-7 w-7 transition-colors ${dragging ? 'text-[#8B5CF6]' : 'text-[#4B5563]'}`} />
            </div>
            <div>
              <p className="text-[#E5E7EB] font-medium mb-1">
                {dragging ? 'Drop to upload' : 'Drop your audio file here'}
              </p>
              <p className="text-sm text-[#6B7280]">or click to browse</p>
            </div>
            <span className="rounded-lg border border-[#2D3748] bg-[#1A2233] px-4 py-2 text-xs text-[#9CA3AF] hover:border-[#8B5CF6]/40 transition-colors">
              Browse files
            </span>
            <input
              type="file"
              accept={ACCEPTED_EXT}
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        ) : (
          /* File selected card */
          <div className="rounded-xl border border-[#8B5CF6]/25 bg-[#8B5CF6]/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/20 flex-shrink-0">
                  <FileAudio className="h-6 w-6 text-[#8B5CF6]" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[#E5E7EB] truncate">{file.name}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{formatBytes(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => { setFile(null); setDone(false); setError(null) }}
                className="flex-shrink-0 rounded-lg p-1.5 text-[#6B7280] hover:text-[#E5E7EB] hover:bg-[#1F2937]/60 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Replace button */}
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors w-fit">
              <RotateCcw className="h-3 w-3" />
              Choose different file
              <input
                type="file"
                accept={ACCEPTED_EXT}
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Processing indicator */}
        {isAnalyzingLocal && (
          <div className="mt-6 rounded-xl border border-[#1F2937]/60 bg-[#111827]/60 p-6">
            <div className="flex justify-center gap-2 mb-3">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-center text-sm text-[#9CA3AF]">Analysing your recording…</p>
            <p className="text-center text-xs text-[#6B7280] mt-1">Running feature extraction and ML pipeline</p>
          </div>
        )}

        {/* Success state */}
        {done && !isAnalyzingLocal && (
          <div className="mt-6 rounded-xl border border-[#22D3EE]/20 bg-[#22D3EE]/5 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" />
              <p className="font-semibold text-[#E5E7EB]">Analysis complete</p>
            </div>
            <p className="text-sm text-[#9CA3AF] mb-5">
              Your recording has been analysed. Click below to view the full report.
            </p>
            <div className="flex gap-3 flex-col sm:flex-row">
              <button
                onClick={() => navigate('/report')}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-6 py-3 text-sm font-semibold text-[#0B1220] hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-[#22D3EE]/20"
              >
                View report
              </button>
              <button
                onClick={onTestAgain}
                className="flex-1 rounded-xl border border-[#1F2937]/60 px-6 py-3 text-sm font-semibold text-[#E5E7EB] hover:bg-[#1F2937]/30 transition-all"
              >
                <RotateCcw className="inline mr-2 h-4 w-4" />Test again
              </button>
            </div>
          </div>
        )}

        {/* Analyse button */}
        {file && !done && !isAnalyzingLocal && (
          <button
            onClick={handleAnalyze}
            disabled={isUploading}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] px-6 py-3.5 text-sm font-semibold text-white hover:opacity-90 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-[#8B5CF6]/20"
          >
            {isUploading ? 'Uploading…' : 'Analyse recording'}
          </button>
        )}
      </div>
    </>
  )
}

// ─── Recording panel (existing logic, componentised) ─────────────────────────
function RecordingPanel({ onBack, onTestAgain }: { onBack: () => void; onTestAgain: () => void }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { isRecording, recordingTime, isAnalyzing, audioCompatibilityPassed } = useSelector(
    (state: RootState) => state.recording)
  const { isFormSubmitted, age, gender } = useSelector(
    (state: RootState) => state.user)
  const { analysisResults } = useSelector(
    (state: RootState) => state.results)

  const [showForm, setShowForm]     = useState(!isFormSubmitted)
  const [showCompatibilityTest, setShowCompatibilityTest] = useState(false)
  const [checklist, setChecklist]   = useState({
    quiet: false,
    mic: false,
    posture: false,
    ready: false,
  })
  const allChecked = Object.values(checklist).every(Boolean)

  const wsRef            = useRef<WebSocket | null>(null)
  const streamRef        = useRef<MediaStream | null>(null)
  const audioCtxRef      = useRef<AudioContext | null>(null)
  const processorRef     = useRef<ScriptProcessorNode | null>(null)
  const sourceRef        = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyzerRef      = useRef<AnalyserNode | null>(null)
  const canvasRef        = useRef<HTMLCanvasElement>(null)
  const animationIdRef   = useRef<number | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pcmBufRef        = useRef<Uint8Array>(new Uint8Array(0))
  const isActiveRef      = useRef(false)

  // Visualiser
  useEffect(() => {
    if (!isRecording) return
    let rafId: number
    const tryDraw = () => {
      if (!canvasRef.current || !analyzerRef.current) {
        rafId = requestAnimationFrame(tryDraw)
        return
      }
      const canvas   = canvasRef.current
      const ctx      = canvas.getContext('2d')!
      const analyser = analyzerRef.current
      const data     = new Uint8Array(analyser.frequencyBinCount)
      const draw = () => {
        if (!isActiveRef.current) return
        analyser.getByteFrequencyData(data)
        ctx.fillStyle = '#0B1220'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        const bw = (canvas.width / data.length) * 2.5
        let x = 0
        for (let i = 0; i < data.length; i++) {
          const h = (data[i] / 255) * canvas.height
          ctx.fillStyle = `hsl(${(i / data.length) * 60 + 180},100%,50%)`
          ctx.fillRect(x, canvas.height - h, bw, h)
          x += bw + 1
        }
        animationIdRef.current = requestAnimationFrame(draw)
      }
      draw()
    }
    tryDraw()
    return () => {
      cancelAnimationFrame(rafId)
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
    }
  }, [isRecording])

  // Timer
  useEffect(() => {
    if (!isRecording) return
    timerIntervalRef.current = setInterval(() => {
      const next = recordingTime + 1
      if (next >= MAX_RECORDING_TIME) {
        stopAudio()
      } else {
        dispatch(setRecordingTime(next))
      }
    }, 1000)
    return () => clearInterval(timerIntervalRef.current!)
  }, [isRecording, recordingTime])

  const toInt16Bytes = (f32: Float32Array): Uint8Array => {
    const out  = new Uint8Array(f32.length * 2)
    const view = new DataView(out.buffer)
    for (let i = 0; i < f32.length; i++) {
      const s = Math.max(-1, Math.min(1, f32[i]))
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }
    return out
  }

  const shipChunks = (ws: WebSocket, final = false) => {
    const buf = pcmBufRef.current
    let offset = 0
    while (offset + WS_FRAME_BYTES <= buf.length) {
      const frame = new Uint8Array(WS_FRAME_BYTES)
      frame.set(buf.subarray(offset, offset + WS_FRAME_BYTES))
      ws.send(frame.buffer)
      offset += WS_FRAME_BYTES
    }
    if (final && offset < buf.length) {
      const tail = new Uint8Array(buf.length - offset)
      tail.set(buf.subarray(offset))
      ws.send(tail.buffer)
      offset = buf.length
    }
    pcmBufRef.current = buf.slice(offset)
  }

  const stopAudio = () => {
    if (!isActiveRef.current) return
    isActiveRef.current = false
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      shipChunks(ws, true)
      ws.send(JSON.stringify({ type: 'done' }))
    }
    processorRef.current?.disconnect()
    sourceRef.current?.disconnect()
    audioCtxRef.current?.close()
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    if (animationIdRef.current)   cancelAnimationFrame(animationIdRef.current)
    dispatch(stopRecording())
    dispatch(setIsAnalyzing(true))
    dispatch(setIsLoading(true))
  }

  const handleStartRecording = async () => {
    if (!isFormSubmitted) { setShowForm(true); return }
    if (!audioCompatibilityPassed) { setShowCompatibilityTest(true); return }
    if (isActiveRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: TARGET_SR,
        }
      })
      streamRef.current = stream

      const audioCtx = new AudioContext({ sampleRate: TARGET_SR })
      audioCtxRef.current = audioCtx
      if (audioCtx.state === 'suspended') await audioCtx.resume()

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyzerRef.current = analyser

      const source = audioCtx.createMediaStreamSource(stream)
      sourceRef.current = source

      const processor = audioCtx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      source.connect(analyser)
      source.connect(processor)
      processor.connect(audioCtx.destination)

      pcmBufRef.current   = new Uint8Array(0)
      isActiveRef.current = true

      const sex    = gender?.toLowerCase() === 'male' ? 0 : 1
      const wsBase = (OpenAPI.BASE as string).replace(/^http/, 'ws')
      const wsUrl  = `${wsBase}/api/v1/detect/ws?age=${age}&sex=${sex}`
      const ws     = new WebSocket(wsUrl)
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws

      processor.onaudioprocess = (e) => {
        if (!isActiveRef.current) return
        const raw = e.inputBuffer.getChannelData(0)
        const pcm = toInt16Bytes(raw)
        const merged = new Uint8Array(pcmBufRef.current.length + pcm.length)
        merged.set(pcmBufRef.current)
        merged.set(pcm, pcmBufRef.current.length)
        pcmBufRef.current = merged
        if (ws.readyState === WebSocket.OPEN) shipChunks(ws)
      }

      ws.onopen = () => {
        shipChunks(ws)
        dispatch(startRecording())
        dispatch(setRecordingTime(0))
      }

      ws.onerror = () => { isActiveRef.current = false }
      ws.onclose = () => {}

      ws.onmessage = (evt) => {
        try {
          const result = JSON.parse(evt.data as string) as ParkinsonsResponse
          dispatch(setAnalysisResults(buildResultPayload(result)))
        } catch { /* parse error */ } finally {
          dispatch(setIsAnalyzing(false))
          dispatch(setIsLoading(false))
        }
      }

    } catch {
      isActiveRef.current = false
      alert('Could not access microphone. Check permissions.')
    }
  }

  const handleReset = () => {
    // Clean up all audio resources
    isActiveRef.current = false
    wsRef.current?.close()
    processorRef.current?.disconnect()
    sourceRef.current?.disconnect()
    audioCtxRef.current?.close()
    streamRef.current?.getTracks().forEach(t => t.stop())
    pcmBufRef.current = new Uint8Array(0)
    // Reset compatibility test state
    dispatch(setAudioCompatibilityPassed(false))
    // Delegate full state reset + form re-show to parent
    onTestAgain()
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const progressPct = (recordingTime / MAX_RECORDING_TIME) * 100

  return (
    <>
      <UserFormDialog isOpen={showForm} onClose={() => setShowForm(false)} />
      {showCompatibilityTest && (
        <AudioCompatibilityTest
          onPass={() => {
            dispatch(setAudioCompatibilityPassed(true))
            setShowCompatibilityTest(false)
          }}
          onCancel={() => setShowCompatibilityTest(false)}
        />
      )}

      {/* Back button */}
      {!isRecording && !isAnalyzing && !analysisResults && (
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#E5E7EB] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Choose different method
        </button>
      )}

      {/* Pre-recording checklist — only shown before first recording */}
      {!isRecording && !isAnalyzing && !analysisResults && (
        <div className="mb-8 rounded-2xl border border-[#1F2937]/60 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#22D3EE]/10 border border-[#22D3EE]/20">
              <CheckCircle2 className="h-4 w-4 text-[#22D3EE]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#E5E7EB] text-sm">Before you record</h3>
              <p className="text-xs text-[#6B7280]">Check all items for best accuracy</p>
            </div>
          </div>

          <ul className="space-y-3 mb-5">
            <li>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checklist.quiet}
                  onChange={e => setChecklist(c => ({ ...c, quiet: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                  checklist.quiet ? 'bg-[#22D3EE] border-[#22D3EE]' : 'border-[#374151] group-hover:border-[#22D3EE]/40'
                }`}>
                  {checklist.quiet && <CheckCircle2 className="h-3 w-3 text-[#0B1220]" />}
                </div>
                <span className={`text-sm transition-colors ${checklist.quiet ? 'text-[#E5E7EB]' : 'text-[#6B7280]'}`}>
                  I'm in a quiet environment
                </span>
              </label>
            </li>
            <li>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checklist.mic}
                  onChange={e => setChecklist(c => ({ ...c, mic: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                  checklist.mic ? 'bg-[#22D3EE] border-[#22D3EE]' : 'border-[#374151] group-hover:border-[#22D3EE]/40'
                }`}>
                  {checklist.mic && <CheckCircle2 className="h-3 w-3 text-[#0B1220]" />}
                </div>
                <span className={`text-sm transition-colors ${checklist.mic ? 'text-[#E5E7EB]' : 'text-[#6B7280]'}`}>
                  Microphone is close and working
                </span>
              </label>
            </li>
            <li>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checklist.posture}
                  onChange={e => setChecklist(c => ({ ...c, posture: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                  checklist.posture ? 'bg-[#22D3EE] border-[#22D3EE]' : 'border-[#374151] group-hover:border-[#22D3EE]/40'
                }`}>
                  {checklist.posture && <CheckCircle2 className="h-3 w-3 text-[#0B1220]" />}
                </div>
                <span className={`text-sm transition-colors ${checklist.posture ? 'text-[#E5E7EB]' : 'text-[#6B7280]'}`}>
                  I'll speak naturally at normal volume
                </span>
              </label>
            </li>
            <li>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checklist.ready}
                  onChange={e => setChecklist(c => ({ ...c, ready: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                  checklist.ready ? 'bg-[#22D3EE] border-[#22D3EE]' : 'border-[#374151] group-hover:border-[#22D3EE]/40'
                }`}>
                  {checklist.ready && <CheckCircle2 className="h-3 w-3 text-[#0B1220]" />}
                </div>
                <span className={`text-sm transition-colors ${checklist.ready ? 'text-[#E5E7EB]' : 'text-[#6B7280]'}`}>
                  I'm ready to hold a sustained vowel sound
                </span>
              </label>
            </li>
          </ul>

          {/* Progress bar */}
          <div className="h-1 w-full rounded-full bg-[#1F2937] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] transition-all duration-300"
              style={{ width: `${Object.values(checklist).filter(Boolean).length * 25}%` }}
            />
          </div>
          <p className="text-xs text-[#6B7280] mt-2">
            {Object.values(checklist).filter(Boolean).length} of 4 items checked
          </p>
        </div>
      )}

      {/* Mic button */}
      <div className="mb-10 flex justify-center">
        <div className="relative h-56 w-56 flex items-center justify-center">
          {isRecording && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-[#22D3EE]/30 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-6 rounded-full border border-[#8B5CF6]/20 animate-ping" style={{ animationDuration: '2.4s', animationDelay: '0.3s' }} />
            </>
          )}

          {/* Progress ring when recording */}
          {isRecording && (
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 224 224">
              <circle
                cx="112" cy="112" r="106"
                fill="none"
                stroke="#22D3EE"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 106}`}
                strokeDashoffset={`${2 * Math.PI * 106 * (1 - progressPct / 100)}`}
                className="transition-all duration-1000"
                opacity="0.6"
              />
            </svg>
          )}

          <button
            onClick={isRecording ? stopAudio : handleStartRecording}
            disabled={isAnalyzing || (!isRecording && (!allChecked || !audioCompatibilityPassed) && !analysisResults)}
            title={!allChecked && !isRecording && !analysisResults ? 'Complete the checklist first' : !audioCompatibilityPassed && !isRecording && !analysisResults ? 'Run audio compatibility test first' : ''}
            className={`relative flex h-44 w-44 items-center justify-center rounded-full text-white transition-all duration-300 shadow-2xl disabled:cursor-not-allowed ${
              isRecording
                ? 'bg-gradient-to-br from-[#EF4444] to-[#DC2626] shadow-red-500/30'
                : allChecked || analysisResults
                  ? 'bg-gradient-to-br from-[#22D3EE] to-[#06B6D4] hover:from-[#06B6D4] hover:to-[#0891B2] shadow-[#22D3EE]/25 hover:scale-105'
                  : 'bg-gradient-to-br from-[#1F2937] to-[#111827] opacity-60 shadow-none'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              {isRecording ? (
                <>
                  <Square className="h-8 w-8" />
                  <span className="text-base font-bold tracking-widest">{formatTime(recordingTime)}</span>
                  <span className="text-xs opacity-70">Recording…</span>
                </>
              ) : isAnalyzing ? (
                <>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="h-2 w-2 rounded-full bg-white animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                    ))}
                  </div>
                  <span className="text-xs opacity-70 mt-1">Processing…</span>
                </>
              ) : (
                <>
                  <Mic className={`h-9 w-9 ${allChecked && audioCompatibilityPassed ? 'animate-pulse' : ''}`} style={{ animationDuration: '2s' }} />
                  <span className="text-sm font-semibold">{!audioCompatibilityPassed ? 'Test audio' : allChecked ? 'Start test' : 'Check list'}</span>
                  <span className="text-xs opacity-70">{!audioCompatibilityPassed ? 'first' : allChecked ? 'Click to begin' : 'first'}</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Waveform while recording */}
      {isRecording && (
        <div className="mb-8 rounded-2xl border border-[#1F2937]/60 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="h-4 w-4 text-[#22D3EE] animate-pulse" />
            <span className="text-sm font-medium text-[#E5E7EB]">Streaming to server…</span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs text-red-400">LIVE</span>
            </div>
          </div>
          <canvas ref={canvasRef} width={800} height={180} className="w-full rounded-lg" />
        </div>
      )}

      {/* Spinner while Python processes */}
      {isAnalyzing && !isRecording && (
        <div className="mb-8 rounded-2xl border border-[#1F2937]/60 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 p-12 text-center">
          <div className="flex justify-center gap-2 mb-4">
            {[0,1,2].map(i => (
              <div key={i} className="h-3 w-3 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <p className="text-[#9CA3AF]">Processing your voice…</p>
          <p className="text-xs text-[#6B7280] mt-2">Running feature extraction and ML pipeline</p>
        </div>
      )}

      {/* Result ready */}
      {analysisResults && !isRecording && !isAnalyzing && (
        <div className="mb-8 rounded-2xl border border-[#22D3EE]/20 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" />
            <h3 className="font-semibold text-[#E5E7EB]">Analysis complete</h3>
          </div>
          <p className="text-sm text-[#9CA3AF] mb-6">
            Your voice has been analysed successfully. Click below to view your full report.
          </p>
          <div className="flex gap-3 sm:flex-row flex-col">
            <button
              onClick={() => navigate('/report')}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-6 py-3 text-sm font-semibold text-[#0B1220] hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-[#22D3EE]/20"
            >
              View report
            </button>
            <button
              onClick={handleReset}
              className="flex-1 rounded-xl border border-[#1F2937]/60 px-6 py-3 text-sm font-semibold text-[#E5E7EB] hover:bg-[#1F2937]/20 transition-all"
            >
              <RotateCcw className="inline mr-2 h-4 w-4" />Test again
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TestPage() {
  const dispatch = useDispatch()
  const { isFormSubmitted } = useSelector((state: RootState) => state.user)
  const [showForm, setShowForm] = useState(!isFormSubmitted)
  const [mode, setMode] = useState<'record' | 'upload' | null>(null)

  // Wipe everything — results, recording state, user form — then show mode selector + form
  const handleTestAgain = () => {
    dispatch(resetResults())
    dispatch(resetRecording())
    dispatch(resetUserData())
    setMode(null)
    setShowForm(true)
  }

  return (
    <div className="min-h-screen bg-[#0B1220]">
      <UserFormDialog isOpen={showForm} onClose={() => setShowForm(false)} />

      {/* Hero */}
      <section className="border-b border-[#1F2937]/30 bg-gradient-to-br from-[#0B1220] via-[#111827]/30 to-[#0B1220]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
            Voice Analysis Test
          </h1>
          <p className="text-lg text-[#9CA3AF] leading-relaxed max-w-2xl">
            {mode === null
              ? 'Choose how you want to provide your voice sample for Parkinson\'s biomarker analysis.'
              : mode === 'record'
                ? 'Record your voice in real time. Find a quiet environment and speak naturally.'
                : 'Upload a pre-recorded voice file for analysis. WAV, MP3, or OGG files accepted.'
            }
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        {mode === null && (
          <ModeSelector onSelect={setMode} />
        )}
        {mode === 'record' && (
          <RecordingPanel onBack={() => setMode(null)} onTestAgain={handleTestAgain} />
        )}
        {mode === 'upload' && (
          <UploadPanel onBack={() => setMode(null)} onTestAgain={handleTestAgain} />
        )}
      </div>
    </div>
  )
}
