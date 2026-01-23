import { configureStore } from '@reduxjs/toolkit'
import masterDataReducer from './masterDataSlice'
import dashboardReducer from './dashboardSlice'

export const store = configureStore({
  reducer: {
    masterData: masterDataReducer,
    dashboard: dashboardReducer
  },
  // Enable Redux DevTools in development
  devTools: process.env.NODE_ENV !== 'production'
})

export default store

