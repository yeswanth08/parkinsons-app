'use client'

import React, { useEffect, useRef } from 'react'

interface WaveformVisualizationProps {
  isRecording: boolean
  audioContext?: AudioContext
}

export function WaveformVisualization({ isRecording, audioContext }: WaveformVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const draw = () => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      const centerY = height / 2

      // Clear canvas with dark background
      ctx.fillStyle = 'transparent'
      ctx.clearRect(0, 0, width, height)

      if (isRecording && analyserRef.current && dataArrayRef.current) {
        // Get frequency data
        analyserRef.current.getByteFrequencyData(dataArrayRef.current)

        // Draw waveform bars
        const barCount = 60
        const barWidth = width / barCount
        const data = dataArrayRef.current

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * data.length)
          const value = data[dataIndex] / 255

          // Gradient colors: cyan to purple
          const hue = 180 + (value * 60) // Cyan (180) to Purple (240)
          ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
          ctx.globalAlpha = 0.7 + value * 0.3

          const barHeight = value * height * 0.8
          ctx.fillRect(i * barWidth + 2, centerY - barHeight / 2, barWidth - 4, barHeight)
        }

        ctx.globalAlpha = 1
      } else if (!isRecording) {
        // Draw smooth wave when not recording
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)'
        ctx.lineWidth = 2
        ctx.beginPath()

        for (let i = 0; i < width; i++) {
          const y =
            centerY +
            Math.sin((i / width) * Math.PI * 4 + Date.now() / 500) * (height * 0.2)
          if (i === 0) {
            ctx.moveTo(i, y)
          } else {
            ctx.lineTo(i, y)
          }
        }

        ctx.stroke()
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRecording])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-32 rounded-lg border border-[#1F2937]/50 bg-gradient-to-b from-[#111827]/50 to-[#0B1220]/50"
    />
  )
}

export function initializeWaveformAnalyzer(stream: MediaStream) {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const analyser = audioContext.createAnalyser()
  const source = audioContext.createMediaStreamSource(stream)

  analyser.fftSize = 256
  source.connect(analyser)

  const dataArray = new Uint8Array(analyser.frequencyBinCount)

  return { audioContext, analyser, dataArray }
}
