'use client'

import React from 'react'
import { Mic, Square } from 'lucide-react'

interface AnimatedMicButtonProps {
  isRecording: boolean
  isAnalyzing: boolean
  recordingTime: number
  onToggleRecording: () => void
  onReset: () => void
}

export function AnimatedMicButton({
  isRecording,
  isAnalyzing,
  recordingTime,
  onToggleRecording,
  onReset,
}: AnimatedMicButtonProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Main Mic Button */}
      <div className="relative">
        {/* Ripple rings - only during recording */}
        {isRecording && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-[#22D3EE]/40 animate-ripple" style={{ animationDelay: '0s' }} />
            <div className="absolute inset-0 rounded-full border-2 border-[#8B5CF6]/30 animate-ripple" style={{ animationDelay: '0.3s' }} />
          </>
        )}

        {/* Main Button */}
        <button
          onClick={isRecording ? onToggleRecording : onToggleRecording}
          disabled={isAnalyzing}
          className={`relative w-40 h-40 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-white shadow-2xl ${
            isRecording
              ? 'bg-gradient-to-br from-red-500 to-red-600 animate-recording-pulse'
              : 'bg-gradient-to-br from-[#22D3EE] to-[#06B6D4] hover:shadow-cyan-500/50 hover:scale-105'
          }`}
        >
          {/* Glow effect background */}
          <div className={`absolute inset-0 rounded-full opacity-0 ${isRecording ? 'animate-pulse' : ''}`} />

          {/* Icon and text container */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            {isRecording ? (
              <>
                <div className="relative">
                  <Square className="w-10 h-10 fill-white" strokeWidth={0} />
                  <div className="absolute inset-0 animate-pulse bg-white/20 rounded-sm" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold tracking-wider animate-glow-cyan">{formatTime(recordingTime)}</div>
                  <div className="text-xs opacity-90 mt-1">Recording...</div>
                </div>
              </>
            ) : (
              <>
                <div className="relative">
                  <Mic className="w-10 h-10 animate-float-smooth" strokeWidth={2.5} />
                  <div className="absolute inset-0 animate-pulse bg-white/20 rounded-full" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">Start Test</div>
                  <div className="text-xs opacity-75 mt-1">Tap to begin</div>
                </div>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Secondary Actions */}
      {recordingTime > 0 && !isRecording && (
        <button
          onClick={onReset}
          disabled={isAnalyzing}
          className="px-6 py-2 rounded-lg border border-[#1F2937] bg-[#111827] text-[#E5E7EB] hover:bg-[#1F2937] transition-all duration-300 text-sm font-medium disabled:opacity-50"
        >
          Reset Recording
        </button>
      )}

      {/* Status indicator */}
      {(isRecording || recordingTime > 0) && (
        <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
          <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#22D3EE]'}`} />
          {isRecording ? 'Listening...' : 'Ready to analyze'}
        </div>
      )}
    </div>
  )
}
