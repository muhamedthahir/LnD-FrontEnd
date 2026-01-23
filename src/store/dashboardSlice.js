import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { API_ENDPOINTS } from '../constants/constants'

// Async thunk to fetch courses
export const fetchDashboardCourses = createAsyncThunk(
  'dashboard/fetchCourses',
  async ({ apiBaseUrl, accessToken, forceRefresh = false }, { getState, rejectWithValue }) => {
    // Check if already loaded and not forcing refresh
    const state = getState()
    if (!forceRefresh && state.dashboard.coursesLoaded && state.dashboard.courses.length > 0) {
      return { courses: state.dashboard.courses, fromCache: true }
    }

    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.COURSES.LIST}?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }
      
      const data = await response.json()
      return { courses: data.courses || [], fromCache: false }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk to fetch administrations
export const fetchDashboardAdministrations = createAsyncThunk(
  'dashboard/fetchAdministrations',
  async ({ apiBaseUrl, accessToken, forceRefresh = false }, { getState, rejectWithValue }) => {
    // Check if already loaded and not forcing refresh
    const state = getState()
    if (!forceRefresh && state.dashboard.administrationsLoaded && state.dashboard.administrations.length > 0) {
      return { administrations: state.dashboard.administrations, fromCache: true }
    }

    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.ADMINISTRATIONS.LIST}?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch administrations')
      }
      
      const data = await response.json()
      return { administrations: data.administrations || [], fromCache: false }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const initialState = {
  // Courses data
  courses: [],
  coursesLoading: false,
  coursesError: null,
  coursesLoaded: false,
  coursesLastFetched: null,
  
  // Administrations data
  administrations: [],
  administrationsLoading: false,
  administrationsError: null,
  administrationsLoaded: false,
  administrationsLastFetched: null,
  
  // Course stats (calculated from courses)
  courseStats: {
    total: 0,
    published: 0,
    draft: 0,
    inProgress: 0
  },
  
  // Administration stats
  adminStats: {
    total: 0,
    published: 0,
    draft: 0
  }
}

// Helper function to calculate course stats
const calculateCourseStats = (courses) => {
  const stats = {
    total: courses.length,
    published: 0,
    draft: 0,
    inProgress: 0
  }
  
  courses.forEach(course => {
    if (course.status === 'published') {
      stats.published++
    } else if (course.status === 'draft') {
      stats.draft++
    } else if (course.status === 'in_progress') {
      stats.inProgress++
    }
  })
  
  return stats
}

// Helper function to calculate administration stats
const calculateAdminStats = (administrations) => {
  const stats = {
    total: administrations.length,
    published: 0,
    draft: 0
  }
  
  administrations.forEach(admin => {
    if (admin.status === 'published') {
      stats.published++
    } else if (admin.status === 'draft') {
      stats.draft++
    }
  })
  
  return stats
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // Clear dashboard data (on logout)
    clearDashboardData: (state) => {
      return initialState
    },
    // Invalidate courses cache
    invalidateCoursesCache: (state) => {
      state.coursesLoaded = false
    },
    // Invalidate administrations cache
    invalidateAdministrationsCache: (state) => {
      state.administrationsLoaded = false
    },
    // Invalidate all cache
    invalidateAllCache: (state) => {
      state.coursesLoaded = false
      state.administrationsLoaded = false
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Courses
      .addCase(fetchDashboardCourses.pending, (state) => {
        state.coursesLoading = true
        state.coursesError = null
      })
      .addCase(fetchDashboardCourses.fulfilled, (state, action) => {
        state.coursesLoading = false
        if (!action.payload.fromCache) {
          state.courses = action.payload.courses
          state.courseStats = calculateCourseStats(action.payload.courses)
          state.coursesLastFetched = Date.now()
        }
        state.coursesLoaded = true
      })
      .addCase(fetchDashboardCourses.rejected, (state, action) => {
        state.coursesLoading = false
        state.coursesError = action.payload
      })
      
      // Fetch Administrations
      .addCase(fetchDashboardAdministrations.pending, (state) => {
        state.administrationsLoading = true
        state.administrationsError = null
      })
      .addCase(fetchDashboardAdministrations.fulfilled, (state, action) => {
        state.administrationsLoading = false
        if (!action.payload.fromCache) {
          state.administrations = action.payload.administrations
          state.adminStats = calculateAdminStats(action.payload.administrations)
          state.administrationsLastFetched = Date.now()
        }
        state.administrationsLoaded = true
      })
      .addCase(fetchDashboardAdministrations.rejected, (state, action) => {
        state.administrationsLoading = false
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

// Selectors
export const selectCourses = (state) => state.dashboard.courses
export const selectCoursesLoading = (state) => state.dashboard.coursesLoading
export const selectCoursesLoaded = (state) => state.dashboard.coursesLoaded
export const selectCourseStats = (state) => state.dashboard.courseStats

export const selectAdministrations = (state) => state.dashboard.administrations
export const selectAdministrationsLoading = (state) => state.dashboard.administrationsLoading
export const selectAdministrationsLoaded = (state) => state.dashboard.administrationsLoaded
export const selectAdminStats = (state) => state.dashboard.adminStats

export default dashboardSlice.reducer

