import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AnalysisResults {
  jitter: number
  shimmer: number
  hnr: number
  f0: number
  dda: number
  ppe: number
  riskScore: number
  timestamp: string
}

export interface ResultsState {
  analysisResults: AnalysisResults | null
  isLoading: boolean
  error: string | null
}

const initialState: ResultsState = {
  analysisResults: null,
  isLoading: false,
  error: null,
}

const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    setAnalysisResults: (state, action: PayloadAction<AnalysisResults>) => {
      state.analysisResults = action.payload
      state.isLoading = false
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isLoading = false
    },
    resetResults: (state) => {
      state.analysisResults = null
      state.isLoading = false
      state.error = null
    },
  },
})

export const { setAnalysisResults, setIsLoading, setError, resetResults } = resultsSlice.actions
export default resultsSlice.reducer
