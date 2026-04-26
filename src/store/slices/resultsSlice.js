import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    analysisResults: null,
    isLoading: false,
    error: null,
};
const resultsSlice = createSlice({
    name: 'results',
    initialState,
    reducers: {
        setAnalysisResults: (state, action) => {
            state.analysisResults = action.payload;
            state.isLoading = false;
        },
        setIsLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.isLoading = false;
        },
        resetResults: (state) => {
            state.analysisResults = null;
            state.isLoading = false;
            state.error = null;
        },
    },
});
export const { setAnalysisResults, setIsLoading, setError, resetResults } = resultsSlice.actions;
export default resultsSlice.reducer;
