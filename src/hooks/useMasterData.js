import { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useApi } from '../contexts/ApiContext'
import {
  fetchMasterData,
  fetchQuestionBanks,
  fetchInstitutions,
  selectMasterData,
  selectIsLoaded,
  selectIsLoading,
  clearMasterData,
  invalidateCache
} from '../store/masterDataSlice'

/**
 * Custom hook to manage master data loading and access
 * Usage:
 *   const { masterData, loadMasterData, isLoaded, isLoading } = useMasterData()
 */
export function useMasterData() {
  const dispatch = useDispatch()
  const { apiBaseUrl, accessToken } = useApi()
  
  const masterData = useSelector(selectMasterData)
  const isLoaded = useSelector(selectIsLoaded)
  const isLoading = useSelector(selectIsLoading)

  // Load master data if not already loaded
  const loadMasterData = useCallback(async (force = false) => {
    if (!apiBaseUrl) return
    
    // Check if we need to load (not loaded or force refresh)
    if (!isLoaded || force) {
      await dispatch(fetchMasterData({ apiBaseUrl, accessToken }))
    }
  }, [dispatch, apiBaseUrl, accessToken, isLoaded])

  // Load question banks
  const loadQuestionBanks = useCallback(async (force = false) => {
    if (!apiBaseUrl) return
    
    if (!masterData.questionBanksLoaded || force) {
      await dispatch(fetchQuestionBanks({ apiBaseUrl, accessToken }))
    }
  }, [dispatch, apiBaseUrl, accessToken, masterData.questionBanksLoaded])

  // Load institutions (only for admin users)
  const loadInstitutions = useCallback(async (force = false, signal = null) => {
    if (!apiBaseUrl) return
    
    // Check if user is admin before fetching institutions
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        const effectiveRole = user?.email === 'mdfaridh142002@gmail.com' ? 'skillvantix_admin' : user?.role
        const isAdmin = effectiveRole === 'primary_admin' || effectiveRole === 'college_admin' || effectiveRole === 'skillvantix_admin'
        
        if (!isAdmin) {
          // User is not admin, skip fetching institutions
          return
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      // If we can't check role, skip fetching to avoid 403 errors
      return
    }
    
    if (!masterData.institutionsLoaded || force) {
      await dispatch(fetchInstitutions({ apiBaseUrl, accessToken, signal }))
    }
  }, [dispatch, apiBaseUrl, accessToken, masterData.institutionsLoaded])

  // Load all data needed after login
  const loadAllData = useCallback(async () => {
    if (!apiBaseUrl) return
    
    // Check if user is admin before fetching institutions
    let shouldFetchInstitutions = false
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        const effectiveRole = user?.email === 'mdfaridh142002@gmail.com' ? 'skillvantix_admin' : user?.role
        shouldFetchInstitutions = effectiveRole === 'primary_admin' || effectiveRole === 'college_admin' || effectiveRole === 'skillvantix_admin'
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      // If we can't check role, don't fetch institutions
      shouldFetchInstitutions = false
    }
    
    // Load master data and question banks in parallel
    const promises = [
      dispatch(fetchMasterData({ apiBaseUrl, accessToken })),
      dispatch(fetchQuestionBanks({ apiBaseUrl, accessToken }))
    ]
    
    // Only fetch institutions if user is admin
    if (shouldFetchInstitutions) {
      promises.push(dispatch(fetchInstitutions({ apiBaseUrl, accessToken })))
    }
    
    await Promise.all(promises)
  }, [dispatch, apiBaseUrl, accessToken])

  // Clear all data (call on logout)
  const clearAllData = useCallback(() => {
    dispatch(clearMasterData())
  }, [dispatch])

  // Force refresh all data
  const refreshAllData = useCallback(async () => {
    dispatch(invalidateCache())
    await loadAllData()
  }, [dispatch, loadAllData])

  return {
    // Data
    masterData,
    levels: masterData.levels,
    statuses: masterData.statuses,
    questionTypes: masterData.questionTypes,
    languages: masterData.languages,
    categories: masterData.categories,
    tags: masterData.tags,
    questionBanks: masterData.questionBanks,
    institutions: masterData.institutions,
    
    // Status
    isLoaded,
    isLoading,
    error: masterData.error,
    
    // Actions
    loadMasterData,
    loadQuestionBanks,
    loadInstitutions,
    loadAllData,
    clearAllData,
    refreshAllData
  }
}

/**
 * Hook that auto-loads master data on mount if not already loaded
 */
export function useAutoLoadMasterData() {
  const { loadMasterData, isLoaded, isLoading } = useMasterData()
  const { apiBaseUrl, accessToken } = useApi()

  useEffect(() => {
    if (apiBaseUrl && accessToken && !isLoaded && !isLoading) {
      loadMasterData()
    }
  }, [apiBaseUrl, accessToken, isLoaded, isLoading, loadMasterData])

  return useMasterData()
}

export default useMasterData

