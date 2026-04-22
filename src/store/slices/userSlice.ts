import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UserState {
  age: number | null
  gender: 'male' | 'female' | 'other' | null
  isFormSubmitted: boolean
}

const initialState: UserState = {
  age: null,
  gender: null,
  isFormSubmitted: false,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData: (state, action: PayloadAction<{ age: number; gender: 'male' | 'female' | 'other' }>) => {
      state.age = action.payload.age
      state.gender = action.payload.gender
      state.isFormSubmitted = true
    },
    resetUserData: (state) => {
      state.age = null
      state.gender = null
      state.isFormSubmitted = false
    },
  },
})

export const { setUserData, resetUserData } = userSlice.actions
export default userSlice.reducer
