import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { startRecording, stopRecording, setRecordingTime, setIsAnalyzing, resetRecording } from '../store/slices/recordingSlice';
import { setAnalysisResults, setIsLoading, resetResults } from '../store/slices/resultsSlice';
import { resetUserData } from '../store/slices/userSlice';
import UserFormDialog from '../components/UserFormDialog';
import { AlertCircle, Mic, Square, RotateCcw, Volume2, Upload, FileAudio, CheckCircle2, XCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import { OpenAPI, DefaultService } from '@yeswanth08/parkinsons-internal';
OpenAPI.BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const MAX_RECORDING_TIME = 5;
const TARGET_SR = 22050;
const WS_FRAME_BYTES = 320;
const ACCEPTED_TYPES = ['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/mp4', 'audio/x-wav'];
const ACCEPTED_EXT = '.wav,.mp3,.ogg,.mp4';
function buildResultPayload(result) {
    const f = result.extractedVoiceFeatures;
    return {
        isHavingParkinsons: result.isHavingParkinsons ?? false,
        severity: result.severity ?? 0,
        suggestion: result.suggestion ?? '',
        jitter: f?.['MDVP:Jitter(%)'] ?? '—',
        shimmer: f?.['MDVP:Shimmer'] ?? '—',
        hnr: f?.['HNR'] ?? '—',
        f0: f?.['MDVP:Fo(Hz)'] ?? 0,
        dda: f?.['Shimmer:DDA'] ?? '—',
        ppe: f?.['PPE'] ?? '—',
        riskScore: result.severity ? Math.round(result.severity * 10) : 0,
        timestamp: new Date().toISOString(),
    };
}
function ModeSelector({ onSelect }) {
    return (_jsxs("div", { className: "grid sm:grid-cols-2 gap-6", children: [_jsxs("button", { onClick: () => onSelect('record'), className: "group relative overflow-hidden rounded-2xl border border-[#1F2937]/60 bg-gradient-to-br from-[#111827]/90 to-[#0B1220]/90 p-8 text-left transition-all duration-300 hover:border-[#22D3EE]/40 hover:shadow-[0_0_40px_rgba(34,211,238,0.08)] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40", children: [_jsx("div", { className: "absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#22D3EE]/5 blur-2xl transition-all group-hover:bg-[#22D3EE]/10" }), _jsxs("div", { className: "relative z-10", children: [_jsx("div", { className: "mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE]/20 to-[#06B6D4]/10 border border-[#22D3EE]/20", children: _jsx(Mic, { className: "h-7 w-7 text-[#22D3EE]" }) }), _jsx("h3", { className: "mb-2 text-lg font-semibold text-[#E5E7EB]", children: "Record voice" }), _jsx("p", { className: "mb-6 text-sm text-[#6B7280] leading-relaxed", children: "Record directly using your microphone. A pre-recording checklist ensures best accuracy." }), _jsx("ul", { className: "space-y-2 mb-6", children: ['Real-time streaming', 'Guided checklist', '5-second capture'].map(t => (_jsxs("li", { className: "flex items-center gap-2 text-xs text-[#9CA3AF]", children: [_jsx("div", { className: "h-1 w-1 rounded-full bg-[#22D3EE]" }), t] }, t))) }), _jsxs("div", { className: "flex items-center gap-1 text-sm font-medium text-[#22D3EE]", children: ["Start recording", _jsx(ChevronRight, { className: "h-4 w-4 transition-transform group-hover:translate-x-1" })] })] })] }), _jsxs("button", { onClick: () => onSelect('upload'), className: "group relative overflow-hidden rounded-2xl border border-[#1F2937]/60 bg-gradient-to-br from-[#111827]/90 to-[#0B1220]/90 p-8 text-left transition-all duration-300 hover:border-[#8B5CF6]/40 hover:shadow-[0_0_40px_rgba(139,92,246,0.08)] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40", children: [_jsx("div", { className: "absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#8B5CF6]/5 blur-2xl transition-all group-hover:bg-[#8B5CF6]/10" }), _jsxs("div", { className: "relative z-10", children: [_jsx("div", { className: "mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#7C3AED]/10 border border-[#8B5CF6]/20", children: _jsx(Upload, { className: "h-7 w-7 text-[#8B5CF6]" }) }), _jsx("h3", { className: "mb-2 text-lg font-semibold text-[#E5E7EB]", children: "Upload recording" }), _jsx("p", { className: "mb-6 text-sm text-[#6B7280] leading-relaxed", children: "Already have a voice recording? Upload it directly for instant analysis." }), _jsx("ul", { className: "space-y-2 mb-6", children: ['WAV · MP3 · OGG', 'Any recording length', 'Drag & drop support'].map(t => (_jsxs("li", { className: "flex items-center gap-2 text-xs text-[#9CA3AF]", children: [_jsx("div", { className: "h-1 w-1 rounded-full bg-[#8B5CF6]" }), t] }, t))) }), _jsxs("div", { className: "flex items-center gap-1 text-sm font-medium text-[#8B5CF6]", children: ["Upload file", _jsx(ChevronRight, { className: "h-4 w-4 transition-transform group-hover:translate-x-1" })] })] })] })] }));
}
function UploadPanel({ onBack, onTestAgain, }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isFormSubmitted, age, gender } = useSelector((s) => s.user);
    const [showForm, setShowForm] = useState(!isFormSubmitted);
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzingLocal, setIsAnalyzingLocal] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);
    const formatBytes = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;
    const handleFile = (f) => {
        if (!ACCEPTED_TYPES.includes(f.type)) {
            setError('Unsupported format. Please upload a WAV, MP3, or OGG file.');
            return;
        }
        setError(null);
        setFile(f);
        setDone(false);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f)
            handleFile(f);
    };
    const handleAnalyze = async () => {
        if (!file)
            return;
        if (!isFormSubmitted) {
            setShowForm(true);
            return;
        }
        setIsUploading(true);
        setIsAnalyzingLocal(true);
        setError(null);
        dispatch(setIsLoading(true));
        const sex = gender?.toLowerCase() === 'male' ? 0 : 1;
        try {
            const result = await DefaultService.detectUpload({
                age: age,
                sex,
                formData: { audio: file },
            });
            dispatch(setAnalysisResults(buildResultPayload(result)));
            setDone(true);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
            setError(msg);
        }
        finally {
            setIsUploading(false);
            setIsAnalyzingLocal(false);
            dispatch(setIsLoading(false));
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(UserFormDialog, { isOpen: showForm, onClose: () => setShowForm(false) }), _jsxs("button", { onClick: onBack, className: "mb-8 flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#E5E7EB] transition-colors", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), "Choose different method"] }), _jsxs("div", { className: "rounded-2xl border border-[#1F2937]/60 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-8", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/20", children: _jsx(Upload, { className: "h-5 w-5 text-[#8B5CF6]" }) }), _jsxs("div", { children: [_jsx("h2", { className: "font-semibold text-[#E5E7EB]", children: "Upload voice recording" }), _jsx("p", { className: "text-xs text-[#6B7280]", children: "WAV \u00B7 MP3 \u00B7 OGG \u00B7 any duration" })] })] }), !file ? (_jsxs("label", { onDragOver: e => { e.preventDefault(); setDragging(true); }, onDragLeave: () => setDragging(false), onDrop: handleDrop, className: `flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200 ${dragging
                            ? 'border-[#8B5CF6] bg-[#8B5CF6]/5 scale-[1.01]'
                            : 'border-[#1F2937] hover:border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/5'}`, children: [_jsx("div", { className: `flex h-16 w-16 items-center justify-center rounded-2xl border transition-all ${dragging ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/10' : 'border-[#1F2937] bg-[#111827]'}`, children: _jsx(FileAudio, { className: `h-7 w-7 transition-colors ${dragging ? 'text-[#8B5CF6]' : 'text-[#4B5563]'}` }) }), _jsxs("div", { children: [_jsx("p", { className: "text-[#E5E7EB] font-medium mb-1", children: dragging ? 'Drop to upload' : 'Drop your audio file here' }), _jsx("p", { className: "text-sm text-[#6B7280]", children: "or click to browse" })] }), _jsx("span", { className: "rounded-lg border border-[#2D3748] bg-[#1A2233] px-4 py-2 text-xs text-[#9CA3AF] hover:border-[#8B5CF6]/40 transition-colors", children: "Browse files" }), _jsx("input", { type: "file", accept: ACCEPTED_EXT, className: "hidden", onChange: e => e.target.files?.[0] && handleFile(e.target.files[0]) })] })) : (
                    /* File selected card */
                    _jsxs("div", { className: "rounded-xl border border-[#8B5CF6]/25 bg-[#8B5CF6]/5 p-5", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/20 flex-shrink-0", children: _jsx(FileAudio, { className: "h-6 w-6 text-[#8B5CF6]" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "font-medium text-[#E5E7EB] truncate", children: file.name }), _jsx("p", { className: "text-xs text-[#6B7280] mt-0.5", children: formatBytes(file.size) })] })] }), _jsx("button", { onClick: () => { setFile(null); setDone(false); setError(null); }, className: "flex-shrink-0 rounded-lg p-1.5 text-[#6B7280] hover:text-[#E5E7EB] hover:bg-[#1F2937]/60 transition-colors", children: _jsx(XCircle, { className: "h-5 w-5" }) })] }), _jsxs("label", { className: "mt-4 flex cursor-pointer items-center gap-2 text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors w-fit", children: [_jsx(RotateCcw, { className: "h-3 w-3" }), "Choose different file", _jsx("input", { type: "file", accept: ACCEPTED_EXT, className: "hidden", onChange: e => e.target.files?.[0] && handleFile(e.target.files[0]) })] })] })), error && (_jsxs("div", { className: "mt-4 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4", children: [_jsx(AlertCircle, { className: "h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-sm text-red-400", children: error })] })), isAnalyzingLocal && (_jsxs("div", { className: "mt-6 rounded-xl border border-[#1F2937]/60 bg-[#111827]/60 p-6", children: [_jsx("div", { className: "flex justify-center gap-2 mb-3", children: [0, 1, 2].map(i => (_jsx("div", { className: "h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] animate-bounce", style: { animationDelay: `${i * 0.15}s` } }, i))) }), _jsx("p", { className: "text-center text-sm text-[#9CA3AF]", children: "Analysing your recording\u2026" }), _jsx("p", { className: "text-center text-xs text-[#6B7280] mt-1", children: "Running feature extraction and ML pipeline" })] })), done && !isAnalyzingLocal && (_jsxs("div", { className: "mt-6 rounded-xl border border-[#22D3EE]/20 bg-[#22D3EE]/5 p-5", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" }), _jsx("p", { className: "font-semibold text-[#E5E7EB]", children: "Analysis complete" })] }), _jsx("p", { className: "text-sm text-[#9CA3AF] mb-5", children: "Your recording has been analysed. Click below to view the full report." }), _jsxs("div", { className: "flex gap-3 flex-col sm:flex-row", children: [_jsx("button", { onClick: () => navigate('/report'), className: "flex-1 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-6 py-3 text-sm font-semibold text-[#0B1220] hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-[#22D3EE]/20", children: "View report" }), _jsxs("button", { onClick: onTestAgain, className: "flex-1 rounded-xl border border-[#1F2937]/60 px-6 py-3 text-sm font-semibold text-[#E5E7EB] hover:bg-[#1F2937]/30 transition-all", children: [_jsx(RotateCcw, { className: "inline mr-2 h-4 w-4" }), "Test again"] })] })] })), file && !done && !isAnalyzingLocal && (_jsx("button", { onClick: handleAnalyze, disabled: isUploading, className: "mt-6 w-full rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] px-6 py-3.5 text-sm font-semibold text-white hover:opacity-90 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-[#8B5CF6]/20", children: isUploading ? 'Uploading…' : 'Analyse recording' }))] })] }));
}
// ─── Recording panel (existing logic, componentised) ─────────────────────────
function RecordingPanel({ onBack, onTestAgain }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isRecording, recordingTime, isAnalyzing } = useSelector((state) => state.recording);
    const { isFormSubmitted, age, gender } = useSelector((state) => state.user);
    const { analysisResults } = useSelector((state) => state.results);
    const [showForm, setShowForm] = useState(!isFormSubmitted);
    const [checklist, setChecklist] = useState({
        quiet: false,
        mic: false,
        posture: false,
        ready: false,
    });
    const allChecked = Object.values(checklist).every(Boolean);
    const wsRef = useRef(null);
    const streamRef = useRef(null);
    const audioCtxRef = useRef(null);
    const processorRef = useRef(null);
    const sourceRef = useRef(null);
    const analyzerRef = useRef(null);
    const canvasRef = useRef(null);
    const animationIdRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const pcmBufRef = useRef(new Uint8Array(0));
    const isActiveRef = useRef(false);
    // Visualiser
    useEffect(() => {
        if (!isRecording)
            return;
        let rafId;
        const tryDraw = () => {
            if (!canvasRef.current || !analyzerRef.current) {
                rafId = requestAnimationFrame(tryDraw);
                return;
            }
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const analyser = analyzerRef.current;
            const data = new Uint8Array(analyser.frequencyBinCount);
            const draw = () => {
                if (!isActiveRef.current)
                    return;
                analyser.getByteFrequencyData(data);
                ctx.fillStyle = '#0B1220';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                const bw = (canvas.width / data.length) * 2.5;
                let x = 0;
                for (let i = 0; i < data.length; i++) {
                    const h = (data[i] / 255) * canvas.height;
                    ctx.fillStyle = `hsl(${(i / data.length) * 60 + 180},100%,50%)`;
                    ctx.fillRect(x, canvas.height - h, bw, h);
                    x += bw + 1;
                }
                animationIdRef.current = requestAnimationFrame(draw);
            };
            draw();
        };
        tryDraw();
        return () => {
            cancelAnimationFrame(rafId);
            if (animationIdRef.current)
                cancelAnimationFrame(animationIdRef.current);
        };
    }, [isRecording]);
    // Timer
    useEffect(() => {
        if (!isRecording)
            return;
        timerIntervalRef.current = setInterval(() => {
            const next = recordingTime + 1;
            if (next >= MAX_RECORDING_TIME) {
                stopAudio();
            }
            else {
                dispatch(setRecordingTime(next));
            }
        }, 1000);
        return () => clearInterval(timerIntervalRef.current);
    }, [isRecording, recordingTime]);
    const toInt16Bytes = (f32) => {
        const out = new Uint8Array(f32.length * 2);
        const view = new DataView(out.buffer);
        for (let i = 0; i < f32.length; i++) {
            const s = Math.max(-1, Math.min(1, f32[i]));
            view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }
        return out;
    };
    const shipChunks = (ws, final = false) => {
        const buf = pcmBufRef.current;
        let offset = 0;
        while (offset + WS_FRAME_BYTES <= buf.length) {
            const frame = new Uint8Array(WS_FRAME_BYTES);
            frame.set(buf.subarray(offset, offset + WS_FRAME_BYTES));
            ws.send(frame.buffer);
            offset += WS_FRAME_BYTES;
        }
        if (final && offset < buf.length) {
            const tail = new Uint8Array(buf.length - offset);
            tail.set(buf.subarray(offset));
            ws.send(tail.buffer);
            offset = buf.length;
        }
        pcmBufRef.current = buf.slice(offset);
    };
    const stopAudio = () => {
        if (!isActiveRef.current)
            return;
        isActiveRef.current = false;
        const ws = wsRef.current;
        if (ws?.readyState === WebSocket.OPEN) {
            shipChunks(ws, true);
            ws.send(JSON.stringify({ type: 'done' }));
        }
        processorRef.current?.disconnect();
        sourceRef.current?.disconnect();
        audioCtxRef.current?.close();
        streamRef.current?.getTracks().forEach(t => t.stop());
        if (timerIntervalRef.current)
            clearInterval(timerIntervalRef.current);
        if (animationIdRef.current)
            cancelAnimationFrame(animationIdRef.current);
        dispatch(stopRecording());
        dispatch(setIsAnalyzing(true));
        dispatch(setIsLoading(true));
    };
    const handleStartRecording = async () => {
        if (!isFormSubmitted) {
            setShowForm(true);
            return;
        }
        if (isActiveRef.current)
            return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    noiseSuppression: true,
                    echoCancellation: true,
                    autoGainControl: true,
                    channelCount: 1,
                    sampleRate: TARGET_SR,
                }
            });
            streamRef.current = stream;
            const audioCtx = new AudioContext({ sampleRate: TARGET_SR });
            audioCtxRef.current = audioCtx;
            if (audioCtx.state === 'suspended')
                await audioCtx.resume();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyzerRef.current = analyser;
            const source = audioCtx.createMediaStreamSource(stream);
            sourceRef.current = source;
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            source.connect(analyser);
            source.connect(processor);
            processor.connect(audioCtx.destination);
            pcmBufRef.current = new Uint8Array(0);
            isActiveRef.current = true;
            const sex = gender?.toLowerCase() === 'male' ? 0 : 1;
            const wsBase = OpenAPI.BASE.replace(/^http/, 'ws');
            const wsUrl = `${wsBase}/api/v1/detect/ws?age=${age}&sex=${sex}`;
            const ws = new WebSocket(wsUrl);
            ws.binaryType = 'arraybuffer';
            wsRef.current = ws;
            processor.onaudioprocess = (e) => {
                if (!isActiveRef.current)
                    return;
                const raw = e.inputBuffer.getChannelData(0);
                const pcm = toInt16Bytes(raw);
                const merged = new Uint8Array(pcmBufRef.current.length + pcm.length);
                merged.set(pcmBufRef.current);
                merged.set(pcm, pcmBufRef.current.length);
                pcmBufRef.current = merged;
                if (ws.readyState === WebSocket.OPEN)
                    shipChunks(ws);
            };
            ws.onopen = () => {
                shipChunks(ws);
                dispatch(startRecording());
                dispatch(setRecordingTime(0));
            };
            ws.onerror = () => { isActiveRef.current = false; };
            ws.onclose = () => { };
            ws.onmessage = (evt) => {
                try {
                    const result = JSON.parse(evt.data);
                    dispatch(setAnalysisResults(buildResultPayload(result)));
                }
                catch { /* parse error */ }
                finally {
                    dispatch(setIsAnalyzing(false));
                    dispatch(setIsLoading(false));
                }
            };
        }
        catch {
            isActiveRef.current = false;
            alert('Could not access microphone. Check permissions.');
        }
    };
    const handleReset = () => {
        // Clean up all audio resources
        isActiveRef.current = false;
        wsRef.current?.close();
        processorRef.current?.disconnect();
        sourceRef.current?.disconnect();
        audioCtxRef.current?.close();
        streamRef.current?.getTracks().forEach(t => t.stop());
        pcmBufRef.current = new Uint8Array(0);
        // Delegate full state reset + form re-show to parent
        onTestAgain();
    };
    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const progressPct = (recordingTime / MAX_RECORDING_TIME) * 100;
    return (_jsxs(_Fragment, { children: [_jsx(UserFormDialog, { isOpen: showForm, onClose: () => setShowForm(false) }), !isRecording && !isAnalyzing && !analysisResults && (_jsxs("button", { onClick: onBack, className: "mb-8 flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#E5E7EB] transition-colors", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), "Choose different method"] })), !isRecording && !isAnalyzing && !analysisResults && (_jsxs("div", { className: "mb-8 rounded-2xl border border-[#1F2937]/60 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-5", children: [_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-[#22D3EE]/10 border border-[#22D3EE]/20", children: _jsx(CheckCircle2, { className: "h-4 w-4 text-[#22D3EE]" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-[#E5E7EB] text-sm", children: "Before you record" }), _jsx("p", { className: "text-xs text-[#6B7280]", children: "Check all items for best accuracy" })] })] }), _jsxs("ul", { className: "space-y-3 mb-5", children: [_jsx("li", { children: _jsxs("label", { className: "flex items-center gap-3 cursor-pointer group", children: [_jsx("input", { type: "checkbox", checked: checklist.quiet, onChange: e => setChecklist(c => ({ ...c, quiet: e.target.checked })), className: "sr-only" }), _jsx("div", { className: `h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${checklist.quiet ? 'bg-[#22D3EE] border-[#22D3EE]' : 'border-[#374151] group-hover:border-[#22D3EE]/40'}`, children: checklist.quiet && _jsx(CheckCircle2, { className: "h-3 w-3 text-[#0B1220]" }) }), _jsx("span", { className: `text-sm transition-colors ${checklist.quiet ? 'text-[#E5E7EB]' : 'text-[#6B7280]'}`, children: "I'm in a quiet environment" })] }) }), _jsx("li", { children: _jsxs("label", { className: "flex items-center gap-3 cursor-pointer group", children: [_jsx("input", { type: "checkbox", checked: checklist.mic, onChange: e => setChecklist(c => ({ ...c, mic: e.target.checked })), className: "sr-only" }), _jsx("div", { className: `h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${checklist.mic ? 'bg-[#22D3EE] border-[#22D3EE]' : 'border-[#374151] group-hover:border-[#22D3EE]/40'}`, children: checklist.mic && _jsx(CheckCircle2, { className: "h-3 w-3 text-[#0B1220]" }) }), _jsx("span", { className: `text-sm transition-colors ${checklist.mic ? 'text-[#E5E7EB]' : 'text-[#6B7280]'}`, children: "Microphone is close and working" })] }) }), _jsx("li", { children: _jsxs("label", { className: "flex items-center gap-3 cursor-pointer group", children: [_jsx("input", { type: "checkbox", checked: checklist.posture, onChange: e => setChecklist(c => ({ ...c, posture: e.target.checked })), className: "sr-only" }), _jsx("div", { className: `h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${checklist.posture ? 'bg-[#22D3EE] border-[#22D3EE]' : 'border-[#374151] group-hover:border-[#22D3EE]/40'}`, children: checklist.posture && _jsx(CheckCircle2, { className: "h-3 w-3 text-[#0B1220]" }) }), _jsx("span", { className: `text-sm transition-colors ${checklist.posture ? 'text-[#E5E7EB]' : 'text-[#6B7280]'}`, children: "I'll speak naturally at normal volume" })] }) }), _jsx("li", { children: _jsxs("label", { className: "flex items-center gap-3 cursor-pointer group", children: [_jsx("input", { type: "checkbox", checked: checklist.ready, onChange: e => setChecklist(c => ({ ...c, ready: e.target.checked })), className: "sr-only" }), _jsx("div", { className: `h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${checklist.ready ? 'bg-[#22D3EE] border-[#22D3EE]' : 'border-[#374151] group-hover:border-[#22D3EE]/40'}`, children: checklist.ready && _jsx(CheckCircle2, { className: "h-3 w-3 text-[#0B1220]" }) }), _jsx("span", { className: `text-sm transition-colors ${checklist.ready ? 'text-[#E5E7EB]' : 'text-[#6B7280]'}`, children: "I'm ready to hold a sustained vowel sound" })] }) })] }), _jsx("div", { className: "h-1 w-full rounded-full bg-[#1F2937] overflow-hidden", children: _jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] transition-all duration-300", style: { width: `${Object.values(checklist).filter(Boolean).length * 25}%` } }) }), _jsxs("p", { className: "text-xs text-[#6B7280] mt-2", children: [Object.values(checklist).filter(Boolean).length, " of 4 items checked"] })] })), _jsx("div", { className: "mb-10 flex justify-center", children: _jsxs("div", { className: "relative h-56 w-56 flex items-center justify-center", children: [isRecording && (_jsxs(_Fragment, { children: [_jsx("div", { className: "absolute inset-0 rounded-full border-2 border-[#22D3EE]/30 animate-ping", style: { animationDuration: '2s' } }), _jsx("div", { className: "absolute inset-6 rounded-full border border-[#8B5CF6]/20 animate-ping", style: { animationDuration: '2.4s', animationDelay: '0.3s' } })] })), isRecording && (_jsx("svg", { className: "absolute inset-0 w-full h-full -rotate-90", viewBox: "0 0 224 224", children: _jsx("circle", { cx: "112", cy: "112", r: "106", fill: "none", stroke: "#22D3EE", strokeWidth: "2", strokeLinecap: "round", strokeDasharray: `${2 * Math.PI * 106}`, strokeDashoffset: `${2 * Math.PI * 106 * (1 - progressPct / 100)}`, className: "transition-all duration-1000", opacity: "0.6" }) })), _jsx("button", { onClick: isRecording ? stopAudio : handleStartRecording, disabled: isAnalyzing || (!isRecording && !allChecked && !analysisResults), title: !allChecked && !isRecording && !analysisResults ? 'Complete the checklist first' : '', className: `relative flex h-44 w-44 items-center justify-center rounded-full text-white transition-all duration-300 shadow-2xl disabled:cursor-not-allowed ${isRecording
                                ? 'bg-gradient-to-br from-[#EF4444] to-[#DC2626] shadow-red-500/30'
                                : allChecked || analysisResults
                                    ? 'bg-gradient-to-br from-[#22D3EE] to-[#06B6D4] hover:from-[#06B6D4] hover:to-[#0891B2] shadow-[#22D3EE]/25 hover:scale-105'
                                    : 'bg-gradient-to-br from-[#1F2937] to-[#111827] opacity-60 shadow-none'}`, children: _jsx("div", { className: "flex flex-col items-center gap-2", children: isRecording ? (_jsxs(_Fragment, { children: [_jsx(Square, { className: "h-8 w-8" }), _jsx("span", { className: "text-base font-bold tracking-widest", children: formatTime(recordingTime) }), _jsx("span", { className: "text-xs opacity-70", children: "Recording\u2026" })] })) : isAnalyzing ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex gap-1", children: [0, 1, 2].map(i => (_jsx("div", { className: "h-2 w-2 rounded-full bg-white animate-bounce", style: { animationDelay: `${i * 0.15}s` } }, i))) }), _jsx("span", { className: "text-xs opacity-70 mt-1", children: "Processing\u2026" })] })) : (_jsxs(_Fragment, { children: [_jsx(Mic, { className: `h-9 w-9 ${allChecked ? 'animate-pulse' : ''}`, style: { animationDuration: '2s' } }), _jsx("span", { className: "text-sm font-semibold", children: allChecked ? 'Start test' : 'Check list' }), _jsx("span", { className: "text-xs opacity-70", children: allChecked ? 'Click to begin' : 'first' })] })) }) })] }) }), isRecording && (_jsxs("div", { className: "mb-8 rounded-2xl border border-[#1F2937]/60 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(Volume2, { className: "h-4 w-4 text-[#22D3EE] animate-pulse" }), _jsx("span", { className: "text-sm font-medium text-[#E5E7EB]", children: "Streaming to server\u2026" }), _jsxs("div", { className: "ml-auto flex items-center gap-1.5", children: [_jsx("div", { className: "h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" }), _jsx("span", { className: "text-xs text-red-400", children: "LIVE" })] })] }), _jsx("canvas", { ref: canvasRef, width: 800, height: 180, className: "w-full rounded-lg" })] })), isAnalyzing && !isRecording && (_jsxs("div", { className: "mb-8 rounded-2xl border border-[#1F2937]/60 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 p-12 text-center", children: [_jsx("div", { className: "flex justify-center gap-2 mb-4", children: [0, 1, 2].map(i => (_jsx("div", { className: "h-3 w-3 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] animate-bounce", style: { animationDelay: `${i * 0.2}s` } }, i))) }), _jsx("p", { className: "text-[#9CA3AF]", children: "Processing your voice\u2026" }), _jsx("p", { className: "text-xs text-[#6B7280] mt-2", children: "Running feature extraction and ML pipeline" })] })), analysisResults && !isRecording && !isAnalyzing && (_jsxs("div", { className: "mb-8 rounded-2xl border border-[#22D3EE]/20 bg-gradient-to-br from-[#111827]/80 to-[#0B1220]/80 backdrop-blur-sm p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" }), _jsx("h3", { className: "font-semibold text-[#E5E7EB]", children: "Analysis complete" })] }), _jsx("p", { className: "text-sm text-[#9CA3AF] mb-6", children: "Your voice has been analysed successfully. Click below to view your full report." }), _jsxs("div", { className: "flex gap-3 sm:flex-row flex-col", children: [_jsx("button", { onClick: () => navigate('/report'), className: "flex-1 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-6 py-3 text-sm font-semibold text-[#0B1220] hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-[#22D3EE]/20", children: "View report" }), _jsxs("button", { onClick: handleReset, className: "flex-1 rounded-xl border border-[#1F2937]/60 px-6 py-3 text-sm font-semibold text-[#E5E7EB] hover:bg-[#1F2937]/20 transition-all", children: [_jsx(RotateCcw, { className: "inline mr-2 h-4 w-4" }), "Test again"] })] })] }))] }));
}
// ─── Main page ────────────────────────────────────────────────────────────────
export default function TestPage() {
    const dispatch = useDispatch();
    const { isFormSubmitted } = useSelector((state) => state.user);
    const [showForm, setShowForm] = useState(!isFormSubmitted);
    const [mode, setMode] = useState(null);
    // Wipe everything — results, recording state, user form — then show mode selector + form
    const handleTestAgain = () => {
        dispatch(resetResults());
        dispatch(resetRecording());
        dispatch(resetUserData());
        setMode(null);
        setShowForm(true);
    };
    return (_jsxs("div", { className: "min-h-screen bg-[#0B1220]", children: [_jsx(UserFormDialog, { isOpen: showForm, onClose: () => setShowForm(false) }), _jsx("section", { className: "border-b border-[#1F2937]/30 bg-gradient-to-br from-[#0B1220] via-[#111827]/30 to-[#0B1220]", children: _jsxs("div", { className: "mx-auto max-w-7xl px-6 py-16 sm:py-20", children: [_jsx("h1", { className: "mb-3 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl", children: "Voice Analysis Test" }), _jsx("p", { className: "text-lg text-[#9CA3AF] leading-relaxed max-w-2xl", children: mode === null
                                ? 'Choose how you want to provide your voice sample for Parkinson\'s biomarker analysis.'
                                : mode === 'record'
                                    ? 'Record your voice in real time. Find a quiet environment and speak naturally.'
                                    : 'Upload a pre-recorded voice file for analysis. WAV, MP3, or OGG files accepted.' })] }) }), _jsxs("div", { className: "mx-auto max-w-4xl px-6 py-12 sm:py-16", children: [mode === null && (_jsx(ModeSelector, { onSelect: setMode })), mode === 'record' && (_jsx(RecordingPanel, { onBack: () => setMode(null), onTestAgain: handleTestAgain })), mode === 'upload' && (_jsx(UploadPanel, { onBack: () => setMode(null), onTestAgain: handleTestAgain }))] })] }));
}
