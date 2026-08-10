import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { API_ENDPOINTS } from '../constants/constants'

export const fetchAdminDashboardStats = createAsyncThunk(
  'dashboard/fetchAdminStats',
  async ({ apiBaseUrl, accessToken, forceRefresh = false }, { getState, rejectWithValue }) => {
    const state = getState()
    if (!forceRefresh && state.dashboard.statsLoaded) {
      return { fromCache: true }
    }

    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.DASHBOARD.ADMIN_STATS}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }

      const data = await response.json()
      return {
        courseStats: data.courseStats || { total: 0, published: 0, draft: 0, inProgress: 0 },
        adminStats: data.adminStats || { total: 0, published: 0, draft: 0 },
        recentAdministrations: data.recentAdministrations || [],
        fromCache: false
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Legacy thunks kept for callers that still refresh individual sections
export const fetchDashboardCourses = createAsyncThunk(
  'dashboard/fetchCourses',
  async (params, { dispatch }) => {
    await dispatch(fetchAdminDashboardStats(params))
    return { fromCache: true }
  }
)

export const fetchDashboardAdministrations = createAsyncThunk(
  'dashboard/fetchAdministrations',
  async (params, { dispatch }) => {
    await dispatch(fetchAdminDashboardStats(params))
    return { fromCache: true }
  }
)

const initialState = {
  courses: [],
  coursesLoading: false,
  coursesError: null,
  coursesLoaded: false,
  coursesLastFetched: null,

  administrations: [],
  administrationsLoading: false,
  administrationsError: null,
  administrationsLoaded: false,
  administrationsLastFetched: null,

  statsLoading: false,
  statsLoaded: false,
  statsError: null,

  courseStats: {
    total: 0,
    published: 0,
    draft: 0,
    inProgress: 0
  },

  adminStats: {
    total: 0,
    published: 0,
    draft: 0
  }
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardData: () => initialState,
    invalidateCoursesCache: (state) => {
      state.coursesLoaded = false
      state.statsLoaded = false
    },
    invalidateAdministrationsCache: (state) => {
      state.administrationsLoaded = false
      state.statsLoaded = false
    },
    invalidateAllCache: (state) => {
      state.coursesLoaded = false
      state.administrationsLoaded = false
      state.statsLoaded = false
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboardStats.pending, (state) => {
        state.statsLoading = true
        state.coursesLoading = true
        state.administrationsLoading = true
        state.statsError = null
      })
      .addCase(fetchAdminDashboardStats.fulfilled, (state, action) => {
        state.statsLoading = false
        state.coursesLoading = false
        state.administrationsLoading = false

        if (!action.payload.fromCache) {
          state.courseStats = action.payload.courseStats
          state.adminStats = action.payload.adminStats
          state.administrations = action.payload.recentAdministrations
          state.coursesLastFetched = Date.now()
          state.administrationsLastFetched = Date.now()
        }

        state.statsLoaded = true
        state.coursesLoaded = true
        state.administrationsLoaded = true
      })
      .addCase(fetchAdminDashboardStats.rejected, (state, action) => {
        state.statsLoading = false
        state.coursesLoading = false
        state.administrationsLoading = false
        state.statsError = action.payload
        state.coursesError = action.payload
        state.administrationsError = action.payload
      })
  }
})

export const {
  clearDashboardData,
  invalidateCoursesCache,
  invalidateAdministrationsCache,
  invalidateAllCache
} = dashboardSlice.actions

export const selectCourses = (state) => state.dashboard.courses
export const selectCoursesLoading = (state) => state.dashboard.coursesLoading
export const selectCoursesLoaded = (state) => state.dashboard.coursesLoaded
export const selectCourseStats = (state) => state.dashboard.courseStats

export const selectAdministrations = (state) => state.dashboard.administrations
export const selectAdministrationsLoading = (state) => state.dashboard.administrationsLoading
export const selectAdministrationsLoaded = (state) => state.dashboard.administrationsLoaded
export const selectAdminStats = (state) => state.dashboard.adminStats

export default dashboardSlice.reducer
