import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    isRecording: false,
    audioURL: null,
    recordingTime: 0,
    isAnalyzing: false,
};
const recordingSlice = createSlice({
    name: 'recording',
    initialState,
    reducers: {
        startRecording: (state) => {
            state.isRecording = true;
            state.recordingTime = 0;
        },
        stopRecording: (state) => {
            state.isRecording = false;
        },
        setAudioURL: (state, action) => {
            state.audioURL = action.payload;
        },
        setRecordingTime: (state, action) => {
            state.recordingTime = action.payload;
        },
        setIsAnalyzing: (state, action) => {
            state.isAnalyzing = action.payload;
        },
        resetRecording: (state) => {
            state.isRecording = false;
            state.audioURL = null;
            state.recordingTime = 0;
            state.isAnalyzing = false;
        },
    },
});
export const { startRecording, stopRecording, setAudioURL, setRecordingTime, setIsAnalyzing, resetRecording, } = recordingSlice.actions;
export default recordingSlice.reducer;
