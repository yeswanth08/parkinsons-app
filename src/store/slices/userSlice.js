import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    age: null,
    gender: null,
    isFormSubmitted: false,
};
const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUserData: (state, action) => {
            state.age = action.payload.age;
            state.gender = action.payload.gender;
            state.isFormSubmitted = true;
        },
        resetUserData: (state) => {
            state.age = null;
            state.gender = null;
            state.isFormSubmitted = false;
        },
    },
});
export const { setUserData, resetUserData } = userSlice.actions;
export default userSlice.reducer;
