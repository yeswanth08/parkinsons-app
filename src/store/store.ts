import { configureStore } from '@reduxjs/toolkit'
import recordingReducer from './slices/recordingSlice'
import userReducer from './slices/userSlice'
import resultsReducer from './slices/resultsSlice'

export const store = configureStore({
  reducer: {
    recording: recordingReducer,
    user: userReducer,
    results: resultsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
