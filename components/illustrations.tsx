"use client"

import React from "react"

// Animated Doctor Icon
export function AnimatedDoctorIllustration() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        @keyframes float-doctor {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .doctor-container {
          animation: float-doctor 3s ease-in-out infinite;
        }
      `}</style>

      <g className="doctor-container">
        {/* Head */}
        <circle cx="100" cy="50" r="20" fill="#fdbcb4" stroke="#f59e8f" strokeWidth="2" />

        {/* Hair */}
        <path
          d="M 80 40 Q 80 25 100 25 Q 120 25 120 40"
          fill="#3d3d3d"
          stroke="#3d3d3d"
          strokeWidth="2"
        />

        {/* Eyes */}
        <circle cx="95" cy="48" r="2" fill="#000" />
        <circle cx="105" cy="48" r="2" fill="#000" />

        {/* Smile */}
        <path
          d="M 95 52 Q 100 54 105 52"
          stroke="#ff6b6b"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Doctor coat */}
        <rect x="75" y="70" width="50" height="45" rx="5" fill="#fff" stroke="#e0e0e0" strokeWidth="2" />

        {/* Red cross on coat */}
        <rect x="95" y="80" width="3" height="15" fill="#ff4444" />
        <rect x="88" y="87" width="15" height="3" fill="#ff4444" />

        {/* Arms */}
        <rect x="50" y="75" width="25" height="10" rx="5" fill="#fdbcb4" />
        <rect x="125" y="75" width="25" height="10" rx="5" fill="#fdbcb4" />

        {/* Stethoscope */}
        <circle cx="55" cy="85" r="8" fill="none" stroke="#00b4d8" strokeWidth="2" />
        <path
          d="M 55 93 Q 50 105 45 115"
          stroke="#00b4d8"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M 55 93 Q 60 105 65 115"
          stroke="#00b4d8"
          strokeWidth="2"
          fill="none"
        />

        {/* Legs */}
        <rect x="90" y="115" width="6" height="20" fill="#2c2c2c" />
        <rect x="104" y="115" width="6" height="20" fill="#2c2c2c" />

        {/* Shoes */}
        <rect x="88" y="135" width="10" height="6" rx="2" fill="#1a1a1a" />
        <rect x="102" y="135" width="10" height="6" rx="2" fill="#1a1a1a" />
      </g>
    </svg>
  )
}

// Animated Brain Icon
export function AnimatedBrainIllustration() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        @keyframes pulse-brain {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        .brain-container {
          animation: pulse-brain 2s ease-in-out infinite;
        }
        @keyframes glow-lines {
          0%, 100% { stroke-opacity: 0.4; }
          50% { stroke-opacity: 1; }
        }
        .glow-path {
          animation: glow-lines 2s ease-in-out infinite;
        }
      `}</style>

      <g className="brain-container">
        {/* Brain outline */}
        <path
          d="M 60 80 Q 50 70 50 60 Q 50 40 70 35 Q 85 33 100 35 Q 115 33 130 35 Q 150 40 150 60 Q 150 70 140 80 Q 135 90 130 100 Q 125 110 100 120 Q 75 110 70 100 Q 65 90 60 80"
          fill="#62b4c8"
          stroke="#4a8fa8"
          strokeWidth="2"
          opacity="0.8"
        />

        {/* Brain folds */}
        <path
          d="M 85 50 Q 85 65 90 75"
          stroke="#4a8fa8"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M 100 48 Q 100 65 100 80"
          stroke="#4a8fa8"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M 115 50 Q 115 65 110 75"
          stroke="#4a8fa8"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />

        {/* Glowing connection lines */}
        <line x1="70" y1="90" x2="100" y2="110" stroke="#46d7b7" strokeWidth="2" className="glow-path" />
        <line x1="130" y1="90" x2="100" y2="110" stroke="#46d7b7" strokeWidth="2" className="glow-path" />

        {/* Neural nodes */}
        <circle cx="70" cy="90" r="4" fill="#46d7b7" opacity="0.8" />
        <circle cx="130" cy="90" r="4" fill="#46d7b7" opacity="0.8" />
        <circle cx="100" cy="110" r="5" fill="#46d7b7" opacity="0.9" />
      </g>
    </svg>
  )
}

// Animated Voice Waves
export function AnimatedVoiceWaves() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        @keyframes wave1 {
          0%, 100% { r: 20; opacity: 1; }
          100% { r: 50; opacity: 0; }
        }
        @keyframes wave2 {
          0%, 100% { r: 20; opacity: 1; }
          100% { r: 55; opacity: 0; }
        }
        .wave-1 { animation: wave1 2s ease-out infinite; }
        .wave-2 { animation: wave2 2.4s ease-out infinite 0.4s; }
      `}</style>

      {/* Microphone */}
      <rect x="85" y="120" width="30" height="40" rx="8" fill="#62b4c8" stroke="#4a8fa8" strokeWidth="2" />
      <circle cx="100" cy="110" r="18" fill="#62b4c8" stroke="#4a8fa8" strokeWidth="2" />
      <rect x="97" y="155" width="6" height="20" fill="#4a8fa8" />

      {/* Sound waves */}
      <circle
        cx="100"
        cy="100"
        r="20"
        fill="none"
        stroke="#46d7b7"
        strokeWidth="2"
        className="wave-1"
      />
      <circle
        cx="100"
        cy="100"
        r="20"
        fill="none"
        stroke="#46d7b7"
        strokeWidth="2"
        className="wave-2"
      />
    </svg>
  )
}

// Animated Report/Chart Icon
export function AnimatedReportIllustration() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        @keyframes chart-rise {
          0% { height: 20px; }
          100% { height: 60px; }
        }
        .bar-1 { animation: chart-rise 1.5s ease-in-out infinite; }
        .bar-2 { animation: chart-rise 1.5s ease-in-out infinite 0.2s; }
        .bar-3 { animation: chart-rise 1.5s ease-in-out infinite 0.4s; }
      `}</style>

      {/* Document background */}
      <rect x="40" y="30" width="120" height="140" rx="8" fill="#fff" stroke="#e0e0e0" strokeWidth="2" />

      {/* Document lines */}
      <line x1="50" y1="50" x2="150" y2="50" stroke="#d0d0d0" strokeWidth="1.5" />
      <line x1="50" y1="60" x2="130" y2="60" stroke="#d0d0d0" strokeWidth="1" />

      {/* Chart bars */}
      <g className="bar-1">
        <rect x="60" y="100" width="15" height="20" fill="#62b4c8" rx="2" />
      </g>
      <g className="bar-2">
        <rect x="85" y="85" width="15" height="35" fill="#46d7b7" rx="2" />
      </g>
      <g className="bar-3">
        <rect x="110" y="95" width="15" height="25" fill="#ffa600" rx="2" />
      </g>

      {/* Bottom text lines */}
      <line x1="50" y1="140" x2="150" y2="140" stroke="#d0d0d0" strokeWidth="1" />
      <line x1="50" y1="150" x2="130" y2="150" stroke="#d0d0d0" strokeWidth="1" />
    </svg>
  )
}

// Animated Location Pin
export function AnimatedLocationPin() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        @keyframes pin-bounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .pin-container {
          animation: pin-bounce 2s ease-in-out infinite;
        }
        @keyframes pin-pulse {
          0%, 100% { r: 8; }
          50% { r: 12; }
        }
        .pulse-circle {
          animation: pin-pulse 1.5s ease-in-out infinite;
        }
      `}</style>

      <g className="pin-container">
        {/* Pin shape */}
        <path
          d="M 100 40 C 85 40 75 50 75 65 C 75 85 100 130 100 130 C 100 130 125 85 125 65 C 125 50 115 40 100 40"
          fill="#ff6b6b"
          stroke="#ff4444"
          strokeWidth="2"
        />

        {/* Pin dot */}
        <circle cx="100" cy="65" r="8" fill="#fff" />
        <circle cx="100" cy="65" r="8" fill="none" stroke="#ff6b6b" strokeWidth="1.5" className="pulse-circle" />
      </g>
    </svg>
  )
}
