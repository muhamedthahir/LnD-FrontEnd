import { configureStore } from '@reduxjs/toolkit'
import masterDataReducer from './masterDataSlice'

export const store = configureStore({
  reducer: {
    masterData: masterDataReducer
  },
  // Enable Redux DevTools in development
  devTools: process.env.NODE_ENV !== 'production'
})

export default store

