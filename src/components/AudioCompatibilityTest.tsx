import { useState, useRef, useEffect } from 'react'
import { AlertCircle, Mic, Square, Volume2, CheckCircle2 } from 'lucide-react'

interface CompatibilityTestProps {
  onPass: () => void
  onCancel: () => void
}

const COMPATIBILITY_MAX_TIME = 3

export default function AudioCompatibilityTest({ onPass, onCancel }: CompatibilityTestProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error'
    messages: string[]
  } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationIdRef = useRef<number | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pcmBufRef = useRef<Uint8Array>(new Uint8Array(0))
  const isActiveRef = useRef(false)

  const TARGET_SR = 22050
  const WS_FRAME_BYTES = 320

  // Visualiser
  useEffect(() => {
    if (!isRecording) return
    let rafId: number
    const tryDraw = () => {
      if (!canvasRef.current || !analyzerRef.current) {
        rafId = requestAnimationFrame(tryDraw)
        return
      }
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!
      const analyser = analyzerRef.current
      const data = new Uint8Array(analyser.frequencyBinCount)
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
      if (next >= COMPATIBILITY_MAX_TIME) {
        stopAudio()
      } else {
        setRecordingTime(next)
      }
    }, 1000)
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [isRecording, recordingTime])

  const toInt16Bytes = (f32: Float32Array): Uint8Array => {
    const out = new Uint8Array(f32.length * 2)
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

  const stopAudio = async () => {
    if (!isActiveRef.current) return
    isActiveRef.current = false
    
    const ws = (window as any).__compatibilityWs
    if (ws?.readyState === WebSocket.OPEN) {
      shipChunks(ws, true)
      ws.send(JSON.stringify({ type: 'done' }))
    }
    
    processorRef.current?.disconnect()
    sourceRef.current?.disconnect()
    audioCtxRef.current?.close()
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
    
    setIsRecording(false)
    setIsAnalyzing(true)
  }

  const handleStartRecording = async () => {
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

      pcmBufRef.current = new Uint8Array(0)
      isActiveRef.current = true

      const wsBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/^http/, 'ws')
      const wsUrl = `${wsBase}/api/v1/detect/ws?age=65&sex=0`
      const ws = new WebSocket(wsUrl)
      ws.binaryType = 'arraybuffer'
      ;(window as any).__compatibilityWs = ws

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
        setIsRecording(true)
        setRecordingTime(0)
      }

      ws.onerror = () => { isActiveRef.current = false }
      ws.onclose = () => {}

      ws.onmessage = (evt) => {
        try {
          const result = JSON.parse(evt.data as string)
          const features = result.extractedVoiceFeatures || {}
          
          const hnr = features['HNR']
          const jitter = features['MDVP:Jitter(%)']
          const shimmer = features['MDVP:Shimmer']

          const errors: string[] = []
          let isValid = true

          if (hnr !== undefined && hnr !== null) {
            if (hnr < 8) {
              errors.push('Voice too noisy, find a quieter place')
              isValid = false
            } else if (hnr > 33) {
              errors.push('Unusually clean, check mic')
              isValid = false
            }
          }

          if (jitter !== undefined && jitter !== null) {
            if (jitter < 0.001) {
              errors.push('Signal too flat, speak naturally')
              isValid = false
            } else if (jitter > 0.030) {
              errors.push('Too much pitch variation, reduce background noise')
              isValid = false
            }
          }

          if (shimmer !== undefined && shimmer !== null) {
            if (shimmer < 0.010) {
              errors.push('Audio too weak')
              isValid = false
            } else if (shimmer > 0.150) {
              errors.push('Audio distorted')
              isValid = false
            }
          }

          setTestResult({
            status: isValid ? 'success' : 'error',
            messages: isValid 
              ? ['Audio compatibility test passed! Your microphone and environment are suitable.']
              : errors
          })
        } catch { /* parse error */ } finally {
          setIsAnalyzing(false)
        }
      }

    } catch {
      isActiveRef.current = false
      setTestResult({
        status: 'error',
        messages: ['Could not access microphone. Check permissions.']
      })
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    isActiveRef.current = false
    const ws = (window as any).__compatibilityWs
    ws?.close()
    processorRef.current?.disconnect()
    sourceRef.current?.disconnect()
    audioCtxRef.current?.close()
    streamRef.current?.getTracks().forEach(t => t.stop())
    pcmBufRef.current = new Uint8Array(0)
    
    setIsRecording(false)
    setRecordingTime(0)
    setTestResult(null)
    setIsAnalyzing(false)
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const progressPct = (recordingTime / COMPATIBILITY_MAX_TIME) * 100

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl border border-[#1F2937]/60 bg-gradient-to-br from-[#111827]/95 to-[#0B1220]/95 backdrop-blur-sm p-8 max-w-2xl w-full">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/20">
              <Mic className="h-5 w-5 text-[#22D3EE]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#E5E7EB]">Audio Compatibility Test</h2>
              <p className="text-xs text-[#6B7280]">Quick check before recording</p>
            </div>
          </div>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Say a clear, sustained "aaaah" vowel sound for a few seconds. We&apos;ll analyze your audio quality to ensure optimal recording conditions.
          </p>
        </div>

        {/* Mic button */}
        {!testResult && (
          <div className="mb-8 flex justify-center">
            <div className="relative h-40 w-40 flex items-center justify-center">
              {isRecording && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-[#22D3EE]/30 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-6 rounded-full border border-[#8B5CF6]/20 animate-ping" style={{ animationDuration: '2.4s', animationDelay: '0.3s' }} />
                </>
              )}

              {isRecording && (
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80" cy="80" r="76"
                    fill="none"
                    stroke="#22D3EE"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 76}`}
                    strokeDashoffset={`${2 * Math.PI * 76 * (1 - progressPct / 100)}`}
                    className="transition-all duration-1000"
                    opacity="0.6"
                  />
                </svg>
              )}

              <button
                onClick={isRecording ? stopAudio : handleStartRecording}
                disabled={isAnalyzing}
                className={`relative flex h-32 w-32 items-center justify-center rounded-full text-white transition-all duration-300 shadow-2xl disabled:cursor-not-allowed ${
                  isRecording
                    ? 'bg-gradient-to-br from-[#EF4444] to-[#DC2626] shadow-red-500/30'
                    : isAnalyzing
                      ? 'bg-gradient-to-br from-[#1F2937] to-[#111827] opacity-60'
                      : 'bg-gradient-to-br from-[#22D3EE] to-[#06B6D4] hover:from-[#06B6D4] hover:to-[#0891B2] shadow-[#22D3EE]/25 hover:scale-105'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {isRecording ? (
                    <>
                      <Square className="h-6 w-6" />
                      <span className="text-sm font-bold tracking-widest">{formatTime(recordingTime)}</span>
                      <span className="text-xs opacity-70">Recording…</span>
                    </>
                  ) : isAnalyzing ? (
                    <>
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="h-2 w-2 rounded-full bg-white animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                      <span className="text-xs opacity-70 mt-1">Testing…</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-7 w-7 animate-pulse" style={{ animationDuration: '2s' }} />
                      <span className="text-sm font-semibold">Start test</span>
                      <span className="text-xs opacity-70">Say aaaah</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Waveform while recording */}
        {isRecording && (
          <div className="mb-8 rounded-xl border border-[#1F2937]/60 bg-[#0B1220]/60 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="h-4 w-4 text-[#22D3EE] animate-pulse" />
              <span className="text-xs font-medium text-[#9CA3AF]">Recording audio…</span>
            </div>
            <canvas ref={canvasRef} width={600} height={100} className="w-full rounded-lg" />
          </div>
        )}

        {/* Result */}
        {testResult && (
          <div className={`mb-8 rounded-xl border p-4 ${
            testResult.status === 'success'
              ? 'border-[#22D3EE]/20 bg-[#22D3EE]/5'
              : 'border-red-500/20 bg-red-500/5'
          }`}>
            <div className="flex items-start gap-3">
              {testResult.status === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-[#22D3EE] flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                {testResult.messages.map((msg, idx) => (
                  <p key={idx} className={`text-sm ${testResult.status === 'success' ? 'text-[#9CA3AF]' : 'text-red-400'}`}>
                    {msg}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 flex-col sm:flex-row">
          {testResult ? (
            <>
              {testResult.status === 'success' ? (
                <>
                  <button
                    onClick={onPass}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-6 py-3 text-sm font-semibold text-[#0B1220] hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-[#22D3EE]/20"
                  >
                    Proceed to recording
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 rounded-xl border border-[#1F2937]/60 px-6 py-3 text-sm font-semibold text-[#E5E7EB] hover:bg-[#1F2937]/30 transition-all"
                  >
                    Test again
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleReset}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-6 py-3 text-sm font-semibold text-[#0B1220] hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-[#22D3EE]/20"
                  >
                    Try again
                  </button>
                  <button
                    onClick={onCancel}
                    className="flex-1 rounded-xl border border-[#1F2937]/60 px-6 py-3 text-sm font-semibold text-[#E5E7EB] hover:bg-[#1F2937]/30 transition-all"
                  >
                    Cancel
                  </button>
                </>
              )}
            </>
          ) : (
            <button
              onClick={onCancel}
              className="w-full rounded-xl border border-[#1F2937]/60 px-6 py-3 text-sm font-semibold text-[#E5E7EB] hover:bg-[#1F2937]/30 transition-all"
            >
              Skip compatibility test
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
