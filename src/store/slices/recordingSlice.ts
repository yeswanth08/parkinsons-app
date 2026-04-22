import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface RecordingState {
  isRecording: boolean
  audioURL: string | null
  recordingTime: number
  isAnalyzing: boolean
}

const initialState: RecordingState = {
  isRecording: false,
  audioURL: null,
  recordingTime: 0,
  isAnalyzing: false,
}

const recordingSlice = createSlice({
  name: 'recording',
  initialState,
  reducers: {
    startRecording: (state) => {
      state.isRecording = true
      state.recordingTime = 0
    },
    stopRecording: (state) => {
      state.isRecording = false
    },
    setAudioURL: (state, action: PayloadAction<string>) => {
      state.audioURL = action.payload
    },
    setRecordingTime: (state, action: PayloadAction<number>) => {
      state.recordingTime = action.payload
    },
    setIsAnalyzing: (state, action: PayloadAction<boolean>) => {
      state.isAnalyzing = action.payload
    },
    resetRecording: (state) => {
      state.isRecording = false
      state.audioURL = null
      state.recordingTime = 0
      state.isAnalyzing = false
    },
  },
})

export const {
  startRecording,
  stopRecording,
  setAudioURL,
  setRecordingTime,
  setIsAnalyzing,
  resetRecording,
} = recordingSlice.actions

export default recordingSlice.reducer
