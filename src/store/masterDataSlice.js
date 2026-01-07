import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { API_ENDPOINTS } from '../constants/constants'

// Async thunk to fetch all master data
export const fetchMasterData = createAsyncThunk(
  'masterData/fetchAll',
  async ({ apiBaseUrl, accessToken }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.MASTER_DATA.ALL}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch master data')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk to fetch question banks
export const fetchQuestionBanks = createAsyncThunk(
  'masterData/fetchQuestionBanks',
  async ({ apiBaseUrl, accessToken }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.QUESTION_BANKS.LIST}?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch question banks')
      }
      
      const data = await response.json()
      return data.questionBanks || []
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk to fetch institutions
export const fetchInstitutions = createAsyncThunk(
  'masterData/fetchInstitutions',
  async ({ apiBaseUrl, accessToken, signal }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.INSTITUTIONS.ALL}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        },
        signal
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch institutions')
      }
      
      const data = await response.json()
      return data.institutions || data || []
    } catch (error) {
      // Don't treat abort as an error
      if (error.name === 'AbortError') {
        return rejectWithValue('Request cancelled')
      }
      return rejectWithValue(error.message)
    }
  }
)

const initialState = {
  // Master data
  levels: [],
  statuses: [],
  questionTypes: [],
  languages: [],
  categories: [],
  tags: [],
  
  // Related data
  questionBanks: [],
  institutions: [],
  
  // Loading states
  loading: false,
  questionBanksLoading: false,
  institutionsLoading: false,
  
  // Error states
  error: null,
  questionBanksError: null,
  institutionsError: null,
  
  // Track if data has been loaded
  isLoaded: false,
  questionBanksLoaded: false,
  institutionsLoaded: false,
  
  // Last fetch timestamp
  lastFetched: null
}

const masterDataSlice = createSlice({
  name: 'masterData',
  initialState,
  reducers: {
    // Add a new tag
    addTag: (state, action) => {
      state.tags.push(action.payload)
    },
    // Add a new category
    addCategory: (state, action) => {
      state.categories.push(action.payload)
    },
    // Clear all master data (on logout)
    clearMasterData: (state) => {
      return initialState
    },
    // Force refresh flag
    invalidateCache: (state) => {
      state.isLoaded = false
      state.questionBanksLoaded = false
      state.institutionsLoaded = false
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Master Data
      .addCase(fetchMasterData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMasterData.fulfilled, (state, action) => {
        state.loading = false
        state.levels = action.payload.levels || []
        state.statuses = action.payload.statuses || []
        state.questionTypes = action.payload.questionTypes || []
        state.languages = action.payload.languages || []
        state.categories = action.payload.categories || []
        state.tags = action.payload.tags || []
        state.isLoaded = true
        state.lastFetched = Date.now()
      })
      .addCase(fetchMasterData.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch Question Banks
      .addCase(fetchQuestionBanks.pending, (state) => {
        state.questionBanksLoading = true
        state.questionBanksError = null
      })
      .addCase(fetchQuestionBanks.fulfilled, (state, action) => {
        state.questionBanksLoading = false
        state.questionBanks = action.payload
        state.questionBanksLoaded = true
      })
      .addCase(fetchQuestionBanks.rejected, (state, action) => {
        state.questionBanksLoading = false
        state.questionBanksError = action.payload
      })
      
      // Fetch Institutions
      .addCase(fetchInstitutions.pending, (state) => {
        state.institutionsLoading = true
        state.institutionsError = null
      })
      .addCase(fetchInstitutions.fulfilled, (state, action) => {
        state.institutionsLoading = false
        state.institutions = action.payload
        state.institutionsLoaded = true
      })
      .addCase(fetchInstitutions.rejected, (state, action) => {
        state.institutionsLoading = false
        state.institutionsError = action.payload
      })
  }
})

export const { addTag, addCategory, clearMasterData, invalidateCache } = masterDataSlice.actions

// Selectors
export const selectMasterData = (state) => state.masterData
export const selectLevels = (state) => state.masterData.levels
export const selectStatuses = (state) => state.masterData.statuses
export const selectQuestionTypes = (state) => state.masterData.questionTypes
export const selectLanguages = (state) => state.masterData.languages
export const selectCategories = (state) => state.masterData.categories
export const selectTags = (state) => state.masterData.tags
export const selectQuestionBanks = (state) => state.masterData.questionBanks
export const selectInstitutions = (state) => state.masterData.institutions
export const selectIsLoaded = (state) => state.masterData.isLoaded
export const selectIsLoading = (state) => state.masterData.loading

export default masterDataSlice.reducer

