import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../store/store'
import {
  startRecording, stopRecording,
  setRecordingTime, setIsAnalyzing, resetRecording
} from '../store/slices/recordingSlice'
import { setAnalysisResults, setIsLoading, resetResults } from '../store/slices/resultsSlice'
import { resetUserData } from '../store/slices/userSlice'
import UserFormDialog from '../components/UserFormDialog'
import {
  AlertCircle, Mic, Square, RotateCcw, Volume2,
  Upload, FileAudio, CheckCircle2, XCircle, ArrowLeft,
  ChevronRight, Download
} from 'lucide-react'
import { OpenAPI, DefaultService } from '@yeswanth08/parkinsons-internal'
import type { ParkinsonsResponse } from '@yeswanth08/parkinsons-internal'

// Vite asset imports — resolves src/samples/ to correct bundled URLs at build time
const healthySampleUrl    = new URL('../samples/healthy_male_65.wav',    import.meta.url).href
const parkinsonsSampleUrl = new URL('../samples/parkinsons_male_65.wav', import.meta.url).href

OpenAPI.BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const MAX_RECORDING_TIME = 5
const TARGET_SR          = 22050
const WS_FRAME_BYTES     = 320
const ACCEPTED_TYPES     = ['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/mp4', 'audio/x-wav']
const ACCEPTED_EXT       = '.wav,.mp3,.ogg,.mp4'

// Physically plausible bounds for a human voice recording.
// NOT the UCI dataset min/max — those cover healthy+PD voices and are wrong for env checks.
// These only reject recordings where the signal is clearly non-voice (silence, pure noise).
//   F0 50-500Hz: human voice range, any age/sex including outliers
//   Jitter > 0.5: 50% cycle variation = pure noise, not a voice signal at all
//   Shimmer > 0.6: 60% amplitude variation = completely unstable, non-voice
//   HNR must be positive: negative means noise power exceeds harmonic power entirely
//   NHR > 0.5: UCI dataset max is 0.3148, so 0.5 is already very generous headroom
// ENV thresholds cross-referenced against UCI dataset stats + clinical voice norms.
// HNR:  UCI dataset min is 8.441 across all subjects (healthy+PD).
//       We use 5.0 as floor — below that, noise dominates regardless of voice.
// PPE:  UCI dataset max is 0.52784. >0.6 = pitch so erratic it's likely noise.
// NHR:  UCI dataset max is 0.31482. 0.4 gives generous real-world headroom.
const ENV_BOUNDS = {
  fo:    { lo: 50, hi: 500 },
  jitMax:  0.5,   // >50% jitter = noise, not voice
  shimMax: 0.6,   // >60% shimmer amplitude variation = non-voice
  hnrMin:  5.0,   // below UCI min (8.441) with ~3 dB headroom for real rooms
  nhrMax:  0.4,   // above UCI max (0.315) with headroom
  ppeMax:  0.6,   // above UCI max (0.528) with small headroom
}

function isEnvClean(features: Record<string, number | string>): boolean {
  const fo   = Number(features['MDVP:Fo(Hz)'])
  const jit  = Number(features['MDVP:Jitter(%)'])
  const shim = Number(features['MDVP:Shimmer'])
  const hnr  = Number(features['HNR'])
  const nhr  = Number(features['NHR'])
  const ppe  = Number(features['PPE'])

  // F0 = 0 → silence or pure noise, hard reject immediately
  if (fo === 0) return false

  const violations = [
    fo  < ENV_BOUNDS.fo.lo || fo > ENV_BOUNDS.fo.hi,
    jit  > ENV_BOUNDS.jitMax,
    shim > ENV_BOUNDS.shimMax,
    hnr  < ENV_BOUNDS.hnrMin,  // 4.76 < 5.0 → violation
    nhr  > ENV_BOUNDS.nhrMax,
    ppe  > ENV_BOUNDS.ppeMax,  // 0.62 > 0.6 → violation
  ].filter(Boolean).length

  // 2+ violations → noisy environment (your noisy room: HNR 4.76 + PPE 0.62 = 2)
  return violations < 2
}

function buildResultPayload(result: ParkinsonsResponse) {
  const f = result.extractedVoiceFeatures
  return {
    isHavingParkinsons: result.isHavingParkinsons ?? false,
    severity:           result.severity            ?? 0,
    suggestion:         result.suggestion          ?? '',
    jitter:  f?.['MDVP:Jitter(%)']  ?? '—',
    shimmer: f?.['MDVP:Shimmer']     ?? '—',
    hnr:     f?.['HNR']             ?? '—',
    f0:      f?.['MDVP:Fo(Hz)']     ?? 0,
    dda:     f?.['Shimmer:DDA']      ?? '—',
    ppe:     f?.['PPE']              ?? '—',
    // Auto-detect severity scale:
    // 0–1   → probability output from classifier  (multiply by 100)
    // 1–10  → UPDRS-like 0–10 scale               (multiply by 10)
    // 10–100→ already a percentage                 (use as-is)
    riskScore: (() => {
      const s = result.severity ?? 0
      if (s <= 1)   return Math.round(s * 100)
      if (s <= 10)  return Math.round(s * 10)
      return Math.min(100, Math.round(s))
    })(),
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

  const [file, setFile]               = useState<File | null>(null)
  const [dragging, setDragging]       = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzingLocal, setIsAnalyzingLocal] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [done, setDone]               = useState(false)

  const formatBytes = (b: number) =>
    b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`

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

  // ── Feature 2: reset user state + re-open form when a sample is downloaded
  const handleSampleDownload = () => {
    dispatch(resetUserData())
    setShowForm(true)
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

      {/* Back button — also resets user data so fresh demographics are entered */}
      <button
        onClick={() => { dispatch(resetUserData()); onBack() }}
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

        {/* ── Feature 2: Sample downloads ── */}
        <div className="mb-6 rounded-xl border border-[#1F2937]/80 bg-[#0B1220]/60 p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1F2937] flex-shrink-0 mt-0.5">
              <Download className="h-4 w-4 text-[#6B7280]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#E5E7EB]">No recording? Try a sample</p>
              <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">
                Download a test voice file to explore the system. Samples extracted from the{' '}
                <a
                  href="https://github.com/SJTU-YONGFU-RESEARCH-GRP/Parkinson-Patient-Speech-Dataset"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8B5CF6] hover:text-[#A78BFA] underline underline-offset-2 transition-colors"
                >
                  SJTU Parkinson Speech Dataset
                </a>
                .
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a
              href={healthySampleUrl}
              download
              onClick={handleSampleDownload}
              className="flex items-center gap-1.5 rounded-lg border border-[#22D3EE]/25 bg-[#22D3EE]/5 px-3 py-2 text-xs font-medium text-[#22D3EE] hover:bg-[#22D3EE]/10 hover:border-[#22D3EE]/40 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Healthy voice (Male, 65)
            </a>
            <a
              href={parkinsonsSampleUrl}
              download
              onClick={handleSampleDownload}
              className="flex items-center gap-1.5 rounded-lg border border-[#8B5CF6]/25 bg-[#8B5CF6]/5 px-3 py-2 text-xs font-medium text-[#8B5CF6] hover:bg-[#8B5CF6]/10 hover:border-[#8B5CF6]/40 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Parkinson's voice (Male, 65)
            </a>
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

// ─── Recording panel ──────────────────────────────────────────────────────────
function RecordingPanel({ onBack, onTestAgain }: { onBack: () => void; onTestAgain: () => void }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { isRecording, recordingTime, isAnalyzing } = useSelector(
    (state: RootState) => state.recording)
  const { isFormSubmitted, age, gender } = useSelector(
    (state: RootState) => state.user)
  const { analysisResults } = useSelector(
    (state: RootState) => state.results)

  const [showForm, setShowForm]   = useState(!isFormSubmitted)
  const [checklist, setChecklist] = useState({
    quiet: false, mic: false, posture: false, ready: false,
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
  // Ref mirror of recordingTime so timer setInterval never captures stale state
  const recordingTimeRef = useRef(0)
  const [badEnv, setBadEnv] = useState(false)
  const [wsError, setWsError] = useState<string | null>(null)

  // Keep ref in sync with redux state
  useEffect(() => { recordingTimeRef.current = recordingTime }, [recordingTime])

  // Visualiser — runs once when isRecording flips true
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

  // Timer — uses recordingTimeRef so the interval never has a stale closure
  useEffect(() => {
    if (!isRecording) return
    timerIntervalRef.current = setInterval(() => {
      const next = recordingTimeRef.current + 1
      if (next >= MAX_RECORDING_TIME) {
        stopAudio()
      } else {
        recordingTimeRef.current = next
        dispatch(setRecordingTime(next))
      }
    }, 1000)
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]) // intentionally omit recordingTime — ref handles it

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
    if (isActiveRef.current) return

    setWsError(null)
    setBadEnv(false)

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

      pcmBufRef.current        = new Uint8Array(0)
      isActiveRef.current      = true
      recordingTimeRef.current = 0

      // ── Start the UI immediately — don't wait for WS handshake ──
      dispatch(startRecording())
      dispatch(setRecordingTime(0))

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

      ws.onopen = () => { shipChunks(ws) }

      ws.onerror = () => {
        isActiveRef.current = false
        // Clean up audio hardware
        processorRef.current?.disconnect()
        sourceRef.current?.disconnect()
        audioCtxRef.current?.close()
        streamRef.current?.getTracks().forEach(t => t.stop())
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
        if (animationIdRef.current)   cancelAnimationFrame(animationIdRef.current)
        dispatch(stopRecording())
        dispatch(setIsAnalyzing(false))
        dispatch(setIsLoading(false))
        setWsError('Could not connect to the analysis server. Make sure the backend is running and try again.')
      }

      ws.onclose = () => {}

      ws.onmessage = (evt) => {
        try {
          const result   = JSON.parse(evt.data as string) as ParkinsonsResponse
          const features = result.extractedVoiceFeatures ?? {}

          if (!isEnvClean(features as Record<string, number | string>)) {
            setBadEnv(true)
            dispatch(resetRecording())
            dispatch(resetResults())
          } else {
            setBadEnv(false)
            dispatch(setAnalysisResults(buildResultPayload(result)))
          }
        } catch { /* parse error */ } finally {
          dispatch(setIsAnalyzing(false))
          dispatch(setIsLoading(false))
        }
      }

    } catch {
      isActiveRef.current = false
      setWsError('Could not access microphone. Please check your browser permissions and try again.')
    }
  }

  const handleReset = () => {
    setBadEnv(false)
    setWsError(null)
    isActiveRef.current = false
    wsRef.current?.close()
    processorRef.current?.disconnect()
    sourceRef.current?.disconnect()
    audioCtxRef.current?.close()
    streamRef.current?.getTracks().forEach(t => t.stop())
    pcmBufRef.current = new Uint8Array(0)
    onTestAgain()
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const progressPct = (recordingTime / MAX_RECORDING_TIME) * 100

  return (
    <>
      <UserFormDialog isOpen={showForm} onClose={() => setShowForm(false)} />

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

      {/* Pre-recording checklist */}
      {!isRecording && !isAnalyzing && !analysisResults && !badEnv && !wsError && (
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
            {([
              ['quiet',   "I'm in a quiet environment"],
              ['mic',     'Microphone is close and working'],
              ['posture', "I'll speak naturally at normal volume"],
              ['ready',   "I'm ready to hold a sustained vowel sound"],
            ] as const).map(([key, label]) => (
              <li key={key}>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checklist[key]}
                    onChange={e => setChecklist(c => ({ ...c, [key]: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                    checklist[key] ? 'bg-[#22D3EE] border-[#22D3EE]' : 'border-[#374151] group-hover:border-[#22D3EE]/40'
                  }`}>
                    {checklist[key] && <CheckCircle2 className="h-3 w-3 text-[#0B1220]" />}
                  </div>
                  <span className={`text-sm transition-colors ${checklist[key] ? 'text-[#E5E7EB]' : 'text-[#6B7280]'}`}>
                    {label}
                  </span>
                </label>
              </li>
            ))}
          </ul>

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
            disabled={isAnalyzing || (!isRecording && !allChecked && !analysisResults)}
            title={!allChecked && !isRecording && !analysisResults ? 'Complete the checklist first' : ''}
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
                  <Mic className={`h-9 w-9 ${allChecked ? 'animate-pulse' : ''}`} style={{ animationDuration: '2s' }} />
                  <span className="text-sm font-semibold">{allChecked ? 'Start test' : 'Check list'}</span>
                  <span className="text-xs opacity-70">{allChecked ? 'Click to begin' : 'first'}</span>
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

      {/* WS / mic error */}
      {wsError && !isRecording && !isAnalyzing && (
        <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 border border-red-500/20 flex-shrink-0 mt-0.5">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-300 mb-1">Connection error</h3>
              <p className="text-sm text-red-400/80 leading-relaxed mb-4">{wsError}</p>
              <button
                onClick={() => { setWsError(null); handleReset() }}
                className="rounded-xl border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/10 transition-all"
              >
                <RotateCcw className="inline mr-2 h-4 w-4" />Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bad environment warning */}
      {badEnv && !isRecording && !isAnalyzing && (
        <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/20 flex-shrink-0 mt-0.5">
              <AlertCircle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-300 mb-1">Noisy environment detected</h3>
              <p className="text-sm text-amber-400/80 leading-relaxed mb-4">
                Your recording contained significant background noise. The extracted voice features
                fall outside the expected range of the dataset, which could produce unreliable results.
                Please move to a quieter space and try again.
              </p>
              <ul className="space-y-1 mb-5 text-xs text-amber-400/70">
                <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-amber-400" />Turn off fans, AC, or music nearby</li>
                <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-amber-400" />Move away from open windows or crowds</li>
                <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-amber-400" />Hold the microphone 5–10 cm from your mouth</li>
              </ul>
              <button
                onClick={handleReset}
                className="rounded-xl border border-amber-500/30 px-5 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/10 transition-all"
              >
                <RotateCcw className="inline mr-2 h-4 w-4" />Try again in a quieter space
              </button>
            </div>
          </div>
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

      <section className="border-b border-[#1F2937]/30 bg-gradient-to-br from-[#0B1220] via-[#111827]/30 to-[#0B1220]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
            Voice Analysis Test
          </h1>
          <p className="text-lg text-[#9CA3AF] leading-relaxed max-w-2xl">
            {mode === null
              ? "Choose how you want to provide your voice sample for Parkinson's biomarker analysis."
              : mode === 'record'
                ? 'Record your voice in real time. Find a quiet environment and speak naturally.'
                : 'Upload a pre-recorded voice file for analysis. WAV, MP3, or OGG files accepted.'
            }
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        {mode === null && <ModeSelector onSelect={setMode} />}
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