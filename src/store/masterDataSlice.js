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
    // =====================================================
    // TAGS
    // =====================================================
    addTag: (state, action) => {
      state.tags.push(action.payload)
    },
    updateTag: (state, action) => {
      const index = state.tags.findIndex(t => t.id === action.payload.id)
      if (index !== -1) {
        state.tags[index] = action.payload
      }
    },
    removeTag: (state, action) => {
      state.tags = state.tags.filter(t => t.id !== action.payload)
    },
    
    // =====================================================
    // CATEGORIES
    // =====================================================
    addCategory: (state, action) => {
      state.categories.push(action.payload)
    },
    updateCategory: (state, action) => {
      const index = state.categories.findIndex(c => c.id === action.payload.id)
      if (index !== -1) {
        state.categories[index] = action.payload
      }
    },
    removeCategory: (state, action) => {
      state.categories = state.categories.filter(c => c.id !== action.payload)
    },
    
    // =====================================================
    // INSTITUTIONS
    // =====================================================
    addInstitution: (state, action) => {
      state.institutions.push(action.payload)
    },
    updateInstitution: (state, action) => {
      const index = state.institutions.findIndex(i => i.id === action.payload.id)
      if (index !== -1) {
        state.institutions[index] = action.payload
      }
    },
    removeInstitution: (state, action) => {
      state.institutions = state.institutions.filter(i => i.id !== action.payload)
    },
    setInstitutions: (state, action) => {
      state.institutions = action.payload
      state.institutionsLoaded = true
    },
    
    // =====================================================
    // QUESTION BANKS
    // =====================================================
    addQuestionBank: (state, action) => {
      state.questionBanks.push(action.payload)
    },
    updateQuestionBank: (state, action) => {
      const index = state.questionBanks.findIndex(qb => qb.id === action.payload.id)
      if (index !== -1) {
        state.questionBanks[index] = action.payload
      }
    },
    removeQuestionBank: (state, action) => {
      state.questionBanks = state.questionBanks.filter(qb => qb.id !== action.payload)
    },
    setQuestionBanks: (state, action) => {
      state.questionBanks = action.payload
      state.questionBanksLoaded = true
    },
    
    // =====================================================
    // LANGUAGES
    // =====================================================
    addLanguage: (state, action) => {
      state.languages.push(action.payload)
    },
    updateLanguage: (state, action) => {
      const index = state.languages.findIndex(l => l.id === action.payload.id)
      if (index !== -1) {
        state.languages[index] = action.payload
      }
    },
    removeLanguage: (state, action) => {
      state.languages = state.languages.filter(l => l.id !== action.payload)
    },
    
    // =====================================================
    // LEVELS
    // =====================================================
    addLevel: (state, action) => {
      state.levels.push(action.payload)
    },
    updateLevel: (state, action) => {
      const index = state.levels.findIndex(l => l.id === action.payload.id)
      if (index !== -1) {
        state.levels[index] = action.payload
      }
    },
    removeLevel: (state, action) => {
      state.levels = state.levels.filter(l => l.id !== action.payload)
    },
    
    // =====================================================
    // STATUSES
    // =====================================================
    addStatus: (state, action) => {
      state.statuses.push(action.payload)
    },
    updateStatus: (state, action) => {
      const index = state.statuses.findIndex(s => s.id === action.payload.id)
      if (index !== -1) {
        state.statuses[index] = action.payload
      }
    },
    removeStatus: (state, action) => {
      state.statuses = state.statuses.filter(s => s.id !== action.payload)
    },
    
    // =====================================================
    // QUESTION TYPES
    // =====================================================
    addQuestionType: (state, action) => {
      state.questionTypes.push(action.payload)
    },
    updateQuestionType: (state, action) => {
      const index = state.questionTypes.findIndex(qt => qt.id === action.payload.id)
      if (index !== -1) {
        state.questionTypes[index] = action.payload
      }
    },
    removeQuestionType: (state, action) => {
      state.questionTypes = state.questionTypes.filter(qt => qt.id !== action.payload)
    },
    
    // =====================================================
    // UTILITY ACTIONS
    // =====================================================
    // Clear all master data (on logout)
    clearMasterData: (state) => {
      return initialState
    },
    // Force refresh flag
    invalidateCache: (state) => {
      state.isLoaded = false
      state.questionBanksLoaded = false
      state.institutionsLoaded = false
    },
    // Refresh specific data type
    invalidateInstitutions: (state) => {
      state.institutionsLoaded = false
    },
    invalidateQuestionBanks: (state) => {
      state.questionBanksLoaded = false
    },
    invalidateMasterData: (state) => {
      state.isLoaded = false
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
        // Don't set error for 403/Forbidden - user just doesn't have permission
        if (action.payload && !action.payload.includes('403') && !action.payload.includes('Forbidden')) {
          state.institutionsError = action.payload
        } else {
          // For 403 errors, just mark as loaded with empty array
          state.institutions = []
          state.institutionsLoaded = true
        }
      })
  }
})

export const { 
  // Tags
  addTag, updateTag, removeTag,
  // Categories
  addCategory, updateCategory, removeCategory,
  // Institutions
  addInstitution, updateInstitution, removeInstitution, setInstitutions,
  // Question Banks
  addQuestionBank, updateQuestionBank, removeQuestionBank, setQuestionBanks,
  // Languages
  addLanguage, updateLanguage, removeLanguage,
  // Levels
  addLevel, updateLevel, removeLevel,
  // Statuses
  addStatus, updateStatus, removeStatus,
  // Question Types
  addQuestionType, updateQuestionType, removeQuestionType,
  // Utility
  clearMasterData, invalidateCache, invalidateInstitutions, invalidateQuestionBanks, invalidateMasterData
} = masterDataSlice.actions

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

