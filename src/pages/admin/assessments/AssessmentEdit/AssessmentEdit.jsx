import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApi } from '../../../../contexts/ApiContext'
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify'
import Button from '../../../../components/Button/Button'
import Toggle from '../../../../components/Toggle/Toggle'
import ConfirmModal from '../../../../components/ConfirmModal/ConfirmModal'
import Dropdown from '../../../../components/Dropdown/Dropdown'
import { useConfirmModal } from '../../../../hooks/useConfirmModal'
import { useAutoLoadMasterData } from '../../../../hooks/useMasterData'
import Table from '../../../../components/Table/Table'
import styles from './AssessmentEdit.module.css'

function AssessmentEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  const { confirm, ConfirmDialog } = useConfirmModal()
  const { questionTypes, languages } = useSelector(state => state.masterData);
  useAutoLoadMasterData()
  const [assessment, setAssessment] = useState(null)
  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  const [expandedSegment, setExpandedSegment] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  
  // Question selection modal
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [currentSegmentForQuestions, setCurrentSegmentForQuestions] = useState(null)
  const searchTimeoutRef = useRef(null)
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    institution_id: ''
  })
  
  // Segment form
  const [showSegmentModal, setShowSegmentModal] = useState(false)
  const [editingSegment, setEditingSegment] = useState(null)
  const [segmentForm, setSegmentForm] = useState({
    name: '',
    description: '',
    segment_duration: 1800,
    allow_back_navigation: true,
    is_locked: false,
    negative_marking_enabled: null,
    question_source: 'POOL',
    question_bank_id: '',
    allowed_language_ids: []
  })
  
  // Question selection (inline in segment)
  const [activeQuestionSection, setActiveQuestionSection] = useState(null) // { segmentId, type }
  const [availableQuestions, setAvailableQuestions] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [questionBanks, setQuestionBanks] = useState([])
  const [selectedQuestionBank, setSelectedQuestionBank] = useState('')
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [questionFilters, setQuestionFilters] = useState({
    search: '',
    level: ''
  })
  const [levels, setLevels] = useState([])
  
  // Local state for marks inputs (to avoid refreshing on every keystroke)
  const [localMarks, setLocalMarks] = useState({}) // Key: `${segmentId}-${questionId}-${type}-${markType}`
  
  // Local state for override toggles (to avoid refreshing on every toggle)
  const [localOverrides, setLocalOverrides] = useState({}) // Key: `${segmentId}-${questionId}-${type}`
  
  // Bulk marks state for segment header
  const [bulkMarks, setBulkMarks] = useState({}) // Key: `${segmentId}` -> { positive: '', negative: '', neutral: '' }
  
  // Dropdowns
  const [institutions, setInstitutions] = useState([])

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
  })

  const isProgrammingOnlySegment = (segment, questionSource = segment?.question_source) => {
    if (!segment) return false
    const mcq = Number(segment.mcq_question_count ?? segment.mcq_questions?.length ?? 0)
    const programming = Number(segment.programming_question_count ?? segment.programming_questions?.length ?? 0)
    return mcq === 0 && (programming > 0 || questionSource === 'BANK')
  }

  const showProgrammingLanguageRestriction = editingSegment
    && isProgrammingOnlySegment(editingSegment, segmentForm.question_source)

  const fetchAssessment = useCallback(async () => {
    if (!apiBaseUrl || !id) return
    
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}/api/assessment/assessments/${id}`, {
        headers: getAuthHeader()
      })

      if (!response.ok) throw new Error('Failed to fetch assessment')

      const data = await response.json()
      setAssessment(data)
      // Ensure segments have questions arrays
      const segmentsWithQuestions = (data.segments || []).map(segment => ({
        ...segment,
        programming_questions: segment.programming_questions || [],
        mcq_questions: segment.mcq_questions || []
      }))
      setSegments(segmentsWithQuestions)
      // Note: Local states (localMarks, localOverrides) are cleared when actions complete successfully
      // They persist during editing to provide smooth UX without page refreshes
      setFormData({
        title: data.title || '',
        description: data.description || '',
        institution_id: data.institution_id || ''
      })
    } catch (error) {
      console.error('Error fetching assessment:', error)
      toast.error('Failed to fetch assessment')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, id, accessToken])

  const fetchDropdowns = async () => {
    try {
      const instRes = await fetch(`${apiBaseUrl}/api/institutions`, { headers: getAuthHeader() })

      if (instRes.ok) {
        const data = await instRes.json()
        setInstitutions(data.institutions || data || [])
      }
    } catch (error) {
      console.error('Error fetching dropdowns:', error)
    }
  }

  useEffect(() => {
    fetchAssessment()
    fetchDropdowns()
  }, [fetchAssessment])

  const handlePublishAssessment = async () => {
    setPublishing(true)
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/assessments/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ status: 'PUBLISHED' })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to publish assessment')
      }

      toast.success('Assessment published successfully!')
      setShowPublishConfirm(false)
      // Refresh assessment data to update status
      fetchAssessment()
    } catch (error) {
      console.error('Error publishing assessment:', error)
      toast.error(error.message || 'Failed to publish assessment')
    } finally {
      setPublishing(false)
    }
  }

  const handleDuplicateAssessment = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/assessments/${id}/duplicate`, {
        method: 'POST',
        headers: getAuthHeader()
      })

      if (!response.ok) throw new Error('Failed to duplicate assessment')

      const data = await response.json()
      toast.success('Assessment duplicated successfully!')
      if (data?.assessment?.id) {
        navigate(`/admin/assessments/${data.assessment.id}/edit`)
      }
    } catch (error) {
      console.error('Error duplicating assessment:', error)
      toast.error('Failed to duplicate assessment')
    }
  }

  const handleArchiveAssessment = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/assessments/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ status: 'ARCHIVED' })
      })
      if (!response.ok) throw new Error('Failed to archive assessment')
      toast.success('Assessment archived successfully!')
      fetchAssessment()
    } catch (error) {
      console.error('Error archiving assessment:', error)
      toast.error('Failed to archive assessment')
    }
  }

  const handleDeleteAssessment = async () => {
    const ok = await confirm({
      title: 'Delete assessment',
      message: 'Are you sure you want to delete this assessment? This action cannot be undone.',
      confirmText: 'Delete'
    })
    if (!ok) return
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/assessments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error('Failed to delete assessment')
      toast.success('Assessment deleted successfully!')
      navigate('/admin/assessments/management')
    } catch (error) {
      console.error('Error deleting assessment:', error)
      toast.error('Failed to delete assessment')
    }
  }

  const handleSaveDetails = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/assessments/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to update assessment')

      toast.success('Assessment details updated!')
      fetchAssessment()
    } catch (error) {
      console.error('Error updating assessment:', error)
      toast.error('Failed to update assessment')
    }
  }

  // Segment handlers
  const handleAddSegment = () => {
    setEditingSegment(null)
    setSegmentForm({
      name: '',
      description: '',
      segment_duration: 1800,
      allow_back_navigation: true,
      is_locked: false,
      negative_marking_enabled: null,
      question_source: 'POOL',
      question_bank_id: '',
      allowed_language_ids: []
    })
    fetchQuestionBanks()
    setShowSegmentModal(true)
  }

  const handleEditSegment = (segment) => {
    setEditingSegment(segment)
    setSegmentForm({
      name: segment.name,
      description: segment.description || '',
      segment_duration: segment.segment_duration,
      allow_back_navigation: segment.allow_back_navigation,
      is_locked: segment.is_locked,
      negative_marking_enabled: segment.negative_marking_enabled ?? null,
      question_source: segment.question_source || 'POOL',
      question_bank_id: segment.question_bank_id || '',
      allowed_language_ids: Array.isArray(segment.allowed_language_ids) ? segment.allowed_language_ids : []
    })
    fetchQuestionBanks()
    setShowSegmentModal(true)
  }

  const handleSaveSegment = async () => {
    if (!segmentForm.name.trim()) {
      toast.error('Segment name is required')
      return
    }

    if (segmentForm.question_source === 'BANK' && !segmentForm.question_bank_id) {
      toast.error('Please select a question bank for this segment')
      return
    }

    try {
      if (editingSegment) {
        const response = await fetch(`${apiBaseUrl}/api/assessment/segments/${editingSegment.id}`, {
          method: 'PUT',
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: segmentForm.name,
            description: segmentForm.description || null,
            segment_duration: segmentForm.segment_duration,
            allow_back_navigation: segmentForm.allow_back_navigation,
            is_locked: segmentForm.is_locked,
            negative_marking_enabled: segmentForm.negative_marking_enabled ?? null,
            question_source: segmentForm.question_source,
            question_bank_id: segmentForm.question_source === 'BANK' ? (segmentForm.question_bank_id || null) : null,
            ...(showProgrammingLanguageRestriction && {
              allowed_language_ids: segmentForm.allowed_language_ids || []
            })
          })
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to update segment')
        }
        toast.success('Segment updated!')
      } else {
        const response = await fetch(`${apiBaseUrl}/api/assessment/segments`, {
          method: 'POST',
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...segmentForm,
            assessment_id: id
          })
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to create segment')
        }
        toast.success('Segment created!')
      }

      setShowSegmentModal(false)
      fetchAssessment()
    } catch (error) {
      console.error('Error saving segment:', error)
      toast.error('Failed to save segment')
    }
  }

  const handleDeleteSegment = async (segmentId) => {
    const ok = await confirm({
      title: 'Delete segment',
      message: 'Are you sure you want to delete this segment?',
      confirmText: 'Delete'
    })
    if (!ok) return

    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/segments/${segmentId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })

      if (!response.ok) throw new Error('Failed to delete segment')

      toast.success('Segment deleted!')
      fetchAssessment()
    } catch (error) {
      console.error('Error deleting segment:', error)
      toast.error('Failed to delete segment')
    }
  }

  const handleReorderSegment = async (segmentId, direction) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/segments/${segmentId}/reorder`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ direction })
      })

      if (!response.ok) throw new Error('Failed to reorder segment')
      fetchAssessment()
    } catch (error) {
      console.error('Error reordering segment:', error)
      toast.error('Failed to reorder segment')
    }
  }

  // Fetch question banks
  const fetchQuestionBanks = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/question-banks?limit=100`, {
        headers: getAuthHeader()
      })
      if (response.ok) {
        const data = await response.json()
        setQuestionBanks(data.questionBanks || data || [])
      }
    } catch (error) {
      console.error('Error fetching question banks:', error)
    }
  }

  // Fetch levels for filter
  const fetchLevels = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/master-data/levels`, {
        headers: getAuthHeader()
      })
      if (response.ok) {
        const data = await response.json()
        setLevels(data.levels || data || [])
      }
    } catch (error) {
      console.error('Error fetching levels:', error)
    }
  }

  // Fetch questions from selected bank
  const fetchQuestionsFromBank = async (bankId, type, filters = {}) => {
    if (!bankId) {
      setAvailableQuestions([])
      return
    }
    
    setLoadingQuestions(true)
    try {
      console.log(type, questionTypes);
      const questionTypeId = questionTypes.filter((e) => e.name.toLowerCase() === type.toLowerCase())[0].id;
      const params = new URLSearchParams({
        question_bank_id: bankId,
        question_type_id: questionTypeId,
        limit: '200'
      })
      
      if (filters.level) {
        params.append('level_id', filters.level)
      }
      if (filters.search) {
        params.append('search', filters.search)
      }
      
      const response = await fetch(`${apiBaseUrl}/api/questions?${params}`, {
        headers: getAuthHeader()
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailableQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
      setAvailableQuestions([])
    } finally {
      setLoadingQuestions(false)
    }
  }

  // Toggle question section visibility
  const handleToggleQuestionSection = async (segmentId, type) => {
    const key = `${segmentId}-${type}`
    const currentKey = activeQuestionSection ? `${activeQuestionSection.segmentId}-${activeQuestionSection.type}` : null
    
    if (currentKey === key) {
      // Close section
      setActiveQuestionSection(null)
      setAvailableQuestions([])
      setSelectedQuestions([])
      setSelectedQuestionBank('')
      setQuestionFilters({ search: '', level: '' })
    } else {
      // Open section
      setActiveQuestionSection({ segmentId, type })
      setAvailableQuestions([])
      setSelectedQuestions([])
      setSelectedQuestionBank('')
      setQuestionFilters({ search: '', level: '' })
      
      // Fetch question banks and levels
      await Promise.all([fetchQuestionBanks(), fetchLevels()])
    }
  }

  // Handle question bank change
  const handleQuestionBankChange = (bankId) => {
    setSelectedQuestionBank(bankId)
    setSelectedQuestions([])
    if (activeQuestionSection) {
      fetchQuestionsFromBank(bankId, activeQuestionSection.type, questionFilters)
    }
  }

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...questionFilters, [filterName]: value }
    setQuestionFilters(newFilters)
    if (selectedQuestionBank && activeQuestionSection) {
      fetchQuestionsFromBank(selectedQuestionBank, activeQuestionSection.type, newFilters)
    }
  }

  // Toggle question selection
  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  // Select/deselect all questions under the current filter (the currently loaded list)
  const areAllVisibleSelected = availableQuestions.length > 0 &&
    availableQuestions.every(q => selectedQuestions.includes(q.id))

  const toggleSelectAllQuestions = () => {
    if (areAllVisibleSelected) {
      const visibleIds = new Set(availableQuestions.map(q => q.id))
      setSelectedQuestions(prev => prev.filter(id => !visibleIds.has(id)))
    } else {
      setSelectedQuestions(prev => {
        const merged = new Set(prev)
        availableQuestions.forEach(q => merged.add(q.id))
        return Array.from(merged)
      })
    }
  }

  // Add selected questions to segment
  const handleAddSelectedQuestions = async () => {
    if (!activeQuestionSection || selectedQuestions.length === 0) return
    
    const { segmentId, type } = activeQuestionSection
    
    try {
      const endpoint = type === 'PROGRAMMING'
        ? `${apiBaseUrl}/api/assessment/segments/programming-questions`
        : `${apiBaseUrl}/api/assessment/segments/mcq-questions`

      for (const questionId of selectedQuestions) {
        const body = type === 'PROGRAMMING'
          ? { segment_id: segmentId, question_id: questionId }
          : { segment_id: segmentId, question_id: questionId }

        await fetch(endpoint, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(body)
        })
      }

      toast.success(`${selectedQuestions.length} questions added!`)
      setSelectedQuestions([])
      fetchSegmentDetails(segmentId)
    } catch (error) {
      console.error('Error adding questions:', error)
      toast.error('Failed to add questions')
    }
  }


  // Helper function to determine and normalize question type
  const getQuestionType = (question) => {
    let detectedType = null
    
    // First, check question_type_name from API (most reliable)
    if (question.question_type_name) {
      detectedType = question.question_type_name
    }
    
    // Then try to get from question_type_id
    if (!detectedType && question.question_type_id) {
      const typeFromId = questionTypes?.find(t => t.id === question.question_type_id)?.name
      if (typeFromId) {
        detectedType = typeFromId
      }
    }
    
    // Check if question has type_name field
    if (!detectedType && question.type_name) {
      detectedType = question.type_name
    }
    
    // Check if question has question_type field
    if (!detectedType && question.question_type) {
      detectedType = question.question_type
    }
    
    // Check for specific question type indicators
    if (!detectedType) {
      if (question.programming_question_id || question.is_programming) {
        detectedType = 'Programming'
      } else if (question.mcq_question_id || question.is_mcq) {
        // Check if it's multiselect or single select MCQ
        if (question.is_multiselect || question.allow_multiple_answers || question.multiple_correct) {
          detectedType = 'Multiselect'
        } else {
          detectedType = 'MCQ'
        }
      }
    }
    
    // Normalize the type name
    if (detectedType) {
      const normalized = detectedType.toLowerCase().trim()
      
      // Map common variations to standard names
      if (normalized === 'programming' || normalized.includes('programming') || normalized.includes('coding')) {
        return 'Programming'
      } else if (normalized === 'multiselect' || normalized.includes('multiselect') || normalized.includes('multiple select') || normalized.includes('multiple choice multiple')) {
        return 'Multiselect'
      } else if (normalized === 'mcq' || normalized.includes('mcq') || normalized.includes('multiple choice') || normalized.includes('single select')) {
        return 'MCQ'
      }
      
      // Return capitalized version if it matches one of our types
      const capitalized = detectedType.charAt(0).toUpperCase() + detectedType.slice(1).toLowerCase()
      if (['Programming', 'MCQ', 'Multiselect'].includes(capitalized)) {
        return capitalized
      }
      
      // If it's already one of our standard types, return it
      if (['Programming', 'MCQ', 'Multiselect'].includes(detectedType)) {
        return detectedType
      }
      
      return detectedType // Return as-is if we can't normalize
    }
    
    // Default fallback - try to infer from questionTypes
    if (questionTypes && questionTypes.length > 0 && question.question_type_id) {
      // Try common type names
      const foundType = questionTypes.find(t => t.id === question.question_type_id)
      if (foundType) {
        const normalized = foundType.name.toLowerCase().trim()
        if (normalized.includes('programming') || normalized.includes('coding')) {
          return 'Programming'
        } else if (normalized.includes('multiselect') || normalized.includes('multiple select')) {
          return 'Multiselect'
        } else if (normalized.includes('mcq') || normalized.includes('multiple choice')) {
          return 'MCQ'
        }
        return foundType.name
      }
    }
    
    return 'Unknown'
  }

  // Fetch all questions from entire dataset (for full-page modal)
  const fetchAllQuestions = async (filters = {}) => {
    setLoadingQuestions(true)
    try {
      const params = new URLSearchParams({
        limit: '500' // Get more questions from all banks
      })
      
      if (filters.level) {
        params.append('level_id', filters.level)
      }
      if (filters.search) {
        params.append('search', filters.search)
      }
      if (filters.questionType) {
        // Try to find by exact name match first
        let questionTypeId = questionTypes?.find((e) => e.name.toLowerCase() === filters.questionType.toLowerCase())?.id
        
        // If not found, try partial match
        if (!questionTypeId) {
          questionTypeId = questionTypes?.find((e) => 
            e.name.toLowerCase().includes(filters.questionType.toLowerCase()) ||
            filters.questionType.toLowerCase().includes(e.name.toLowerCase())
          )?.id
        }
        
        if (questionTypeId) {
          params.append('question_type_id', questionTypeId)
        } else {
          // If still not found, try to search by type name in the API
          params.append('question_type', filters.questionType)
        }
      }
      if (filters.questionBank) {
        params.append('question_bank_id', filters.questionBank)
      }
      
      const response = await fetch(`${apiBaseUrl}/api/questions?${params}`, {
        headers: getAuthHeader()
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailableQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Error fetching all questions:', error)
      setAvailableQuestions([])
    } finally {
      setLoadingQuestions(false)
    }
  }

  // Update question in segments state (optimistic update)
  const updateQuestionInState = (segmentId, questionId, type, updates) => {
    setSegments(prevSegments => prevSegments.map(segment => {
      if (segment.id !== segmentId) return segment
      
      const questionKey = type === 'PROGRAMMING' ? 'programming_questions' : 'mcq_questions'
      const questionIdKey = type === 'PROGRAMMING' ? 'programming_question_id' : 'mcq_question_id'
      
      return {
        ...segment,
        [questionKey]: segment[questionKey]?.map(q => {
          if (q[questionIdKey] !== questionId) return q
          return { ...q, ...updates }
        }) || []
      }
    }))
  }

  // Handle override score toggle
  const handleToggleOverrideScore = async (segmentId, questionId, type, enabled) => {
    const key = `${segmentId}-${questionId}-${type}`
    
    // Optimistically update local state
    setLocalOverrides(prev => ({
      ...prev,
      [key]: enabled
    }))
    
    // Optimistically update segments state
    const updates = enabled 
      ? { 
          weightage_override: 1,
          positive_marks: 0,
          negative_marks: 0,
          neutral_marks: 0
        }
      : { 
          weightage_override: null,
          positive_marks: null,
          negative_marks: null,
          neutral_marks: null
        }
    
    updateQuestionInState(segmentId, questionId, type, updates)
    
    // Set default marks to 0 in local state when enabling override
    if (enabled) {
      setLocalMarks(prev => ({
        ...prev,
        [`${segmentId}-${questionId}-${type}-positive`]: '0',
        [`${segmentId}-${questionId}-${type}-negative`]: '0',
        [`${segmentId}-${questionId}-${type}-neutral`]: '0'
      }))
    } else {
      // Clear local marks when disabling override
      setLocalMarks(prev => {
        const newState = { ...prev }
        delete newState[`${segmentId}-${questionId}-${type}-positive`]
        delete newState[`${segmentId}-${questionId}-${type}-negative`]
        delete newState[`${segmentId}-${questionId}-${type}-neutral`]
        return newState
      })
    }
    
    try {
      const endpoint = type === 'PROGRAMMING'
        ? `${apiBaseUrl}/api/assessment/segments/programming-questions/${segmentId}/${questionId}`
        : `${apiBaseUrl}/api/assessment/segments/mcq-questions/${segmentId}/${questionId}`
      
      const payload = enabled 
        ? { 
            weightage_override: 1,
            positive_marks: 0,
            negative_marks: 0,
            neutral_marks: 0
          }
        : { weightage_override: null }
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) throw new Error('Failed to update override score')
      
      // Remove from local overrides since it's now saved
      setLocalOverrides(prev => {
        const newState = { ...prev }
        delete newState[key]
        return newState
      })
    } catch (error) {
      console.error('Error toggling override score:', error)
      toast.error('Failed to update override score')
      
      // Revert optimistic update on error
      const question = type === 'PROGRAMMING'
        ? segments.find(s => s.id === segmentId)?.programming_questions?.find(q => q.programming_question_id === questionId)
        : segments.find(s => s.id === segmentId)?.mcq_questions?.find(q => q.mcq_question_id === questionId)
      
      if (question) {
        const originalOverride = question.weightage_override !== null && question.weightage_override !== undefined
        setLocalOverrides(prev => ({
          ...prev,
          [key]: originalOverride
        }))
        updateQuestionInState(segmentId, questionId, type, {
          weightage_override: question.weightage_override,
          positive_marks: question.positive_marks,
          negative_marks: question.negative_marks,
          neutral_marks: question.neutral_marks
        })
      }
    }
  }

  // Handle marks input change (local state only, no API call)
  const handleMarksInputChange = (segmentId, questionId, type, markType, value) => {
    const key = `${segmentId}-${questionId}-${type}-${markType}`
    setLocalMarks(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Handle marks update (API call on blur)
  const handleUpdateMarks = async (segmentId, questionId, type, markType, value) => {
    const key = `${segmentId}-${questionId}-${type}-${markType}`
    const numValue = value ? parseFloat(value) : null
    
    // Optimistically update segments state
    updateQuestionInState(segmentId, questionId, type, {
      [`${markType}_marks`]: numValue
    })
    
    try {
      const endpoint = type === 'PROGRAMMING'
        ? `${apiBaseUrl}/api/assessment/segments/programming-questions/${segmentId}/${questionId}`
        : `${apiBaseUrl}/api/assessment/segments/mcq-questions/${segmentId}/${questionId}`
      
      const payload = {
        [`${markType}_marks`]: numValue
      }
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) throw new Error('Failed to update marks')
      
      // Remove from local state since it's now saved in the database
      setLocalMarks(prev => {
        const newState = { ...prev }
        delete newState[key]
        return newState
      })
    } catch (error) {
      console.error('Error updating marks:', error)
      toast.error('Failed to update marks')
      
      // Revert optimistic update on error
      const question = type === 'PROGRAMMING'
        ? segments.find(s => s.id === segmentId)?.programming_questions?.find(q => q.programming_question_id === questionId)
        : segments.find(s => s.id === segmentId)?.mcq_questions?.find(q => q.mcq_question_id === questionId)
      
      if (question) {
        updateQuestionInState(segmentId, questionId, type, {
          [`${markType}_marks`]: question[`${markType}_marks`]
        })
        setLocalMarks(prev => ({
          ...prev,
          [key]: question[`${markType}_marks`] || ''
        }))
      }
    }
  }

  // Get marks value (from local state if exists, otherwise from question data)
  const getMarksValue = (segmentId, questionId, type, markType, question) => {
    const key = `${segmentId}-${questionId}-${type}-${markType}`
    if (localMarks.hasOwnProperty(key)) {
      return localMarks[key]
    }
    // If override is enabled but marks are null, default to 0
    const overrideKey = `${segmentId}-${questionId}-${type}`
    const isOverrideEnabled = localOverrides[overrideKey] !== undefined 
      ? localOverrides[overrideKey]
      : (question?.weightage_override !== null && question?.weightage_override !== undefined)
    
    if (isOverrideEnabled && (question?.[`${markType}_marks`] === null || question?.[`${markType}_marks`] === undefined)) {
      return '0'
    }
    return question?.[`${markType}_marks`] || ''
  }

  // Get override enabled state (from local state if exists, otherwise from question data)
  const getOverrideEnabled = (segmentId, questionId, type, question) => {
    const key = `${segmentId}-${questionId}-${type}`
    if (localOverrides.hasOwnProperty(key)) {
      return localOverrides[key]
    }
    return question?.weightage_override !== null && question?.weightage_override !== undefined
  }

  // Handle view question - navigate to edit page with back to assessment
  const handleViewQuestion = (questionId, type) => {
    // Navigate to edit page with return path to assessment
    const returnPath = encodeURIComponent(`/admin/assessments/${id}/edit?tab=segments`)
    // Use the list route structure: /admin/questions/list/:id/edit
    window.open(`/admin/questions/list/${questionId}/edit?returnTo=${returnPath}`, '_blank')
  }

  // Handle bulk apply marks to all questions in segment
  const handleBulkApplyMarks = async (segmentId) => {
    const marks = bulkMarks[segmentId]
    if (!marks) return

    const segment = segments.find(s => s.id === segmentId)
    if (!segment) return

    const allQuestions = [
      ...(segment.programming_questions || []).map(q => ({ ...q, type: 'PROGRAMMING', questionId: q.programming_question_id })),
      ...(segment.mcq_questions || []).map(q => ({ ...q, type: 'MCQ', questionId: q.mcq_question_id }))
    ]

    if (allQuestions.length === 0) {
      toast.info('No questions in this segment')
      return
    }

    // First, enable override for all questions if not already enabled
    const questionsNeedingOverride = allQuestions.filter(q => {
      const overrideKey = `${segmentId}-${q.questionId}-${q.type}`
      const isOverrideEnabled = localOverrides[overrideKey] !== undefined 
        ? localOverrides[overrideKey]
        : (q.weightage_override === null || q.weightage_override === undefined)
      return !isOverrideEnabled
    })

    // Enable override for questions that don't have it
    for (const q of questionsNeedingOverride) {
      const overrideKey = `${segmentId}-${q.questionId}-${q.type}`
      setLocalOverrides(prev => ({
        ...prev,
        [overrideKey]: true
      }))
      updateQuestionInState(segmentId, q.questionId, q.type, {
        weightage_override: 1,
        positive_marks: parseFloat(marks.positive) || 0,
        negative_marks: parseFloat(marks.negative) || 0,
        neutral_marks: parseFloat(marks.neutral) || 0
      })
    }

    // Update all questions optimistically
    for (const q of allQuestions) {
      updateQuestionInState(segmentId, q.questionId, q.type, {
        weightage_override: 1,
        positive_marks: marks.positive ? parseFloat(marks.positive) : null,
        negative_marks: marks.negative ? parseFloat(marks.negative) : null,
        neutral_marks: marks.neutral ? parseFloat(marks.neutral) : null
      })
      
      // Update local marks state
      setLocalMarks(prev => ({
        ...prev,
        [`${segmentId}-${q.questionId}-${q.type}-positive`]: marks.positive || '',
        [`${segmentId}-${q.questionId}-${q.type}-negative`]: marks.negative || '',
        [`${segmentId}-${q.questionId}-${q.type}-neutral`]: marks.neutral || ''
      }))
    }

    // Now sync with server
    try {
      const updatePromises = allQuestions.map(async (q) => {
        const endpoint = q.type === 'PROGRAMMING'
          ? `${apiBaseUrl}/api/assessment/segments/programming-questions/${segmentId}/${q.questionId}`
          : `${apiBaseUrl}/api/assessment/segments/mcq-questions/${segmentId}/${q.questionId}`
        
        const payload = {
          weightage_override: 1,
          positive_marks: marks.positive ? parseFloat(marks.positive) : null,
          negative_marks: marks.negative ? parseFloat(marks.negative) : null,
          neutral_marks: marks.neutral ? parseFloat(marks.neutral) : null
        }

        const response = await fetch(endpoint, {
          method: 'PATCH',
          headers: getAuthHeader(),
          body: JSON.stringify(payload)
        })

        if (!response.ok) throw new Error(`Failed to update question ${q.questionId}`)
        return true
      })

      await Promise.all(updatePromises)
      
      // Clear local marks and overrides for this segment since they're now saved
      setLocalMarks(prev => {
        const newState = { ...prev }
        allQuestions.forEach(q => {
          delete newState[`${segmentId}-${q.questionId}-${q.type}-positive`]
          delete newState[`${segmentId}-${q.questionId}-${q.type}-negative`]
          delete newState[`${segmentId}-${q.questionId}-${q.type}-neutral`]
        })
        return newState
      })

      allQuestions.forEach(q => {
        const overrideKey = `${segmentId}-${q.questionId}-${q.type}`
        setLocalOverrides(prev => {
          const newState = { ...prev }
          delete newState[overrideKey]
          return newState
        })
      })

      toast.success(`Applied marks to ${allQuestions.length} question(s)`)
    } catch (error) {
      console.error('Error applying bulk marks:', error)
      toast.error('Failed to apply marks to some questions')
      // Revert optimistic updates on error
      fetchAssessment()
    }
  }

  // Handle opening question modal
  const handleOpenQuestionModal = async (segmentId) => {
    setCurrentSegmentForQuestions(segmentId)
    setShowQuestionModal(true)
    setSelectedQuestions([])
    setQuestionFilters({ search: '', level: '', questionType: '', questionBank: '' })
    await Promise.all([fetchQuestionBanks(), fetchLevels()])
    await fetchAllQuestions({}) // Fetch all questions initially
  }

  // Handle adding questions from modal
  const handleAddQuestionsFromModal = async () => {
    if (!currentSegmentForQuestions || selectedQuestions.length === 0) return
    
    try {
      // Group questions by type
      const programmingQuestions = []
      const mcqQuestions = []
      
      for (const questionId of selectedQuestions) {
        const question = availableQuestions.find(q => q.id === questionId)
        if (question) {
          const questionType = getQuestionType(question).toLowerCase()
          if (questionType === 'programming') {
            programmingQuestions.push(questionId)
          } else if (questionType === 'mcq' || questionType === 'multiselect') {
            // Both MCQ and Multiselect go to mcq_questions endpoint
            mcqQuestions.push(questionId)
          }
        }
      }
      
      // Add programming questions
      if (programmingQuestions.length > 0) {
        const response = await fetch(`${apiBaseUrl}/api/assessment/segments/programming-questions`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({
            assessment_segment_id: currentSegmentForQuestions,
            programming_question_ids: programmingQuestions
          })
        })
        if (!response.ok) throw new Error('Failed to add programming questions')
      }
      
      // Add MCQ questions
      if (mcqQuestions.length > 0) {
        const response = await fetch(`${apiBaseUrl}/api/assessment/segments/mcq-questions`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({
            assessment_segment_id: currentSegmentForQuestions,
            mcq_question_ids: mcqQuestions
          })
        })
        if (!response.ok) throw new Error('Failed to add MCQ questions')
      }
      
      toast.success(`Added ${selectedQuestions.length} question(s) successfully!`)
      setShowQuestionModal(false)
      setSelectedQuestions([])
      
      // Small delay to ensure backend has processed the changes
      setTimeout(() => {
        fetchAssessment()
      }, 300)
    } catch (error) {
      console.error('Error adding questions:', error)
      toast.error('Failed to add questions')
    }
  }

  const handleRemoveQuestion = async (segmentId, questionId, type) => {
    const ok = await confirm({
      title: 'Remove question',
      message: 'Remove this question from the segment?',
      confirmText: 'Remove'
    })
    if (!ok) return

    try {
      const endpoint = type === 'PROGRAMMING'
        ? `${apiBaseUrl}/api/assessment/segments/${segmentId}/programming-questions/${questionId}`
        : `${apiBaseUrl}/api/assessment/segments/${segmentId}/mcq-questions/${questionId}`

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: getAuthHeader()
      })

      if (!response.ok) throw new Error('Failed to remove question')

      toast.success('Question removed!')
      fetchSegmentDetails(segmentId)
    } catch (error) {
      console.error('Error removing question:', error)
      toast.error('Failed to remove question')
    }
  }

  const fetchSegmentDetails = async (segmentId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/assessment/segments/${segmentId}`, {
        headers: getAuthHeader()
      })
      if (response.ok) {
        const data = await response.json()
        setSegments(prev => prev.map(s => s.id === segmentId ? data : s))
      }
    } catch (error) {
      console.error('Error fetching segment details:', error)
    }
  }

  const toggleSegmentExpand = async (segmentId) => {
    if (expandedSegment === segmentId) {
      setExpandedSegment(null)
    } else {
      await fetchSegmentDetails(segmentId)
      setExpandedSegment(segmentId)
    }
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes} min`
  }

  // Check if question section is active for a segment
  const isQuestionSectionActive = (segmentId, type) => {
    return activeQuestionSection?.segmentId === segmentId && activeQuestionSection?.type === type
  }

  if (loading) {
    return (
      <div className={styles.assessmentEditPage}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className={styles.assessmentEditPage}>
        <div className={styles.errorState}>
          <h3>Assessment not found</h3>
          <Button onClick={() => navigate('/admin/assessments/management')}>Back to List</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.assessmentEditPage}>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/admin/assessments/management')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <span className={styles.assessmentId}>{assessment.unique_id}</span>
            <h1>{assessment.title}</h1>
          </div>
        </div>
        <div className={styles.headerActions}>
          <span className={`${styles.statusBadge} ${styles[assessment.status.toLowerCase()]}`}>{assessment.status}</span>
          <Button variant="outline" onClick={() => navigate(`/admin/assessments/${id}/configurations`)}>
            Configurations
          </Button>
          <Button variant="outline" onClick={handleDuplicateAssessment}>
            Duplicate
          </Button>
          {assessment.status === 'PUBLISHED' && (
            <Button variant="outline" onClick={handleArchiveAssessment}>
              Archive
            </Button>
          )}
          {assessment.status === 'DRAFT' && (
            <Button variant="primary" onClick={() => setShowPublishConfirm(true)} disabled={publishing}>
              Publish
            </Button>
          )}
          <Button variant="danger" onClick={handleDeleteAssessment}>
            Delete
          </Button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'details' ? styles.active : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'segments' ? styles.active : ''}`}
          onClick={() => setActiveTab('segments')}
        >
          Segments ({segments.length})
        </button>
      </div>

      {activeTab === 'details' && (
        <div className={styles.tabContent}>
          <div className={styles.detailsForm}>
            <div className={styles.formGroup}>
              <label>Assessment Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter assessment title"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter assessment description"
                rows="4"
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Institution</label>
                <select
                  value={formData.institution_id}
                  onChange={(e) => setFormData({ ...formData, institution_id: e.target.value })}
                >
                  <option value="">Select Institution</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formActions}>
              <Button variant="primary" onClick={handleSaveDetails}>Save Changes</Button>
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{segments.length}</span>
              <span className={styles.statLabel}>Segments</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{formatDuration(assessment.total_duration)}</span>
              <span className={styles.statLabel}>Total Duration</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{assessment.statistics?.total_configs || 0}</span>
              <span className={styles.statLabel}>Configurations</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{assessment.statistics?.total_users || 0}</span>
              <span className={styles.statLabel}>Total Users</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'segments' && (
        <div className={styles.tabContent}>
          <div className={styles.segmentsHeader}>
            <h3>Assessment Segments</h3>
            <Button variant="primary" onClick={handleAddSegment}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add Segment
            </Button>
          </div>

          {segments.length === 0 ? (
            <div className={styles.emptySegments}>
              <p>No segments added yet. Add segments to build your assessment structure.</p>
              <Button variant="primary" onClick={handleAddSegment}>Add First Segment</Button>
            </div>
          ) : (
            <div className={styles.segmentsList}>
              {segments.map((segment, index) => (
                <div key={segment.id} className={`${styles.segmentCard} ${expandedSegment === segment.id ? styles.expanded : ''}`}>
                  <div className={styles.segmentHeader} onClick={() => toggleSegmentExpand(segment.id)}>
                    <div className={styles.segmentOrder}>{index + 1}</div>
                    <div className={styles.segmentInfo}>
                      <div className={styles.segmentTitleRow}>
                        <h4>{segment.name}</h4>
                        {/* Bulk Marks Section - Horizontal */}
                        <div className={styles.bulkMarksSection} onClick={(e) => e.stopPropagation()}>
                          <span className={styles.bulkMarksLabel}>Bulk:</span>
                          <div className={styles.bulkMarksInputs}>
                            <input
                              type="number"
                              placeholder="+ve"
                              value={bulkMarks[segment.id]?.positive || ''}
                              onChange={(e) => setBulkMarks(prev => ({
                                ...prev,
                                [segment.id]: {
                                  ...prev[segment.id],
                                  positive: e.target.value
                                }
                              }))}
                              className={styles.bulkMarkInput}
                              title="Positive marks"
                            />
                            <input
                              type="number"
                              placeholder="-ve"
                              value={bulkMarks[segment.id]?.negative || ''}
                              onChange={(e) => setBulkMarks(prev => ({
                                ...prev,
                                [segment.id]: {
                                  ...prev[segment.id],
                                  negative: e.target.value
                                }
                              }))}
                              className={styles.bulkMarkInput}
                              title="Negative marks"
                            />
                            <input
                              type="number"
                              placeholder="Neutral"
                              value={bulkMarks[segment.id]?.neutral || ''}
                              onChange={(e) => setBulkMarks(prev => ({
                                ...prev,
                                [segment.id]: {
                                  ...prev[segment.id],
                                  neutral: e.target.value
                                }
                              }))}
                              className={styles.bulkMarkInput}
                              title="Neutral marks"
                            />
                          </div>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => handleBulkApplyMarks(segment.id)}
                            disabled={!bulkMarks[segment.id]?.positive && !bulkMarks[segment.id]?.negative && !bulkMarks[segment.id]?.neutral}
                            className={styles.applyToAllBtn}
                          >
                            Apply to All
                          </Button>
                        </div>
                      </div>
                      <div className={styles.segmentMeta}>
                        <span>{formatDuration(segment.segment_duration)}</span>
                        <span>•</span>
                        <span>{segment.programming_question_count || 0} coding</span>
                        <span>•</span>
                        <span>{segment.mcq_question_count || 0} MCQ</span>
                      </div>
                    </div>
                    <div className={styles.segmentActions} onClick={(e) => e.stopPropagation()}>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => handleReorderSegment(segment.id, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M18 15l-6-6-6 6"/>
                        </svg>
                      </button>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => handleReorderSegment(segment.id, 'down')}
                        disabled={index === segments.length - 1}
                        title="Move Down"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </button>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => handleEditSegment(segment)}
                        title="Edit"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.delete}`}
                        onClick={() => handleDeleteSegment(segment.id)}
                        title="Delete"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                    <div className={styles.expandIcon}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </div>
                  </div>

                  {expandedSegment === segment.id && (
                    <div className={styles.segmentContent}>
                      {segment.description && (
                        <p className={styles.segmentDescription}>{segment.description}</p>
                      )}
                      
                      <div className={styles.segmentSettings}>
                        <span className={`${styles.settingBadge} ${segment.allow_back_navigation ? styles.enabled : styles.disabled}`}>
                          {segment.allow_back_navigation ? '✓' : '✗'} Back Navigation
                        </span>
                        <span className={`${styles.settingBadge} ${styles.enabled}`}>
                          {segment.question_source === 'BANK' ? 'Source: Question Bank' : 'Source: Question Pool'}
                        </span>
                      </div>

                      {/* Unified Questions Section */}
                      {segment.question_source === 'BANK' ? (
                        <div className={styles.questionsSection}>
                          <p className={styles.noQuestions}>
                            This segment pulls questions from a question bank. Configure how many to fetch (and the difficulty mix) in the assessment's Configurations &rarr; Questions step. No need to add questions here.
                          </p>
                        </div>
                      ) : (
                      <div className={styles.questionsSection}>
                        <div className={styles.questionsHeader}>
                          <h5>Questions ({(segment.programming_questions?.length || 0) + (segment.mcq_questions?.length || 0)})</h5>
                          <Button 
                            variant="primary" 
                            size="small" 
                            onClick={() => handleOpenQuestionModal(segment.id)}
                          >
                            + Add Question
                          </Button>
                        </div>
                        
                        {/* Combined Questions Table */}
                        {((segment.programming_questions?.length || 0) + (segment.mcq_questions?.length || 0) > 0) ? (
                          <div className={styles.questionsTableWrapper}>
                            <Table className={styles.segmentQuestionsTable}>
                              <thead>
                                <tr>
                                  <th style={{width: '50px'}}>#</th>
                                  <th style={{width: '80px'}}>ID</th>
                                  <th>Question</th>
                                  <th style={{width: '100px'}}>Type</th>
                                  <th style={{width: '100px'}}>Level</th>
                                  <th style={{width: '120px'}}>Override Score</th>
                                  <th style={{width: '200px'}}>Marks (+ve / -ve / Neutral)</th>
                                  <th style={{width: '100px'}}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {segment.programming_questions?.map((q, qi) => {
                                  const questionIndex = qi + 1
                                  const overrideEnabled = getOverrideEnabled(segment.id, q.programming_question_id, 'PROGRAMMING', q)
                                  return (
                                    <tr key={`prog-${q.id}`}>
                                      <td>{questionIndex}</td>
                                      <td><code>#{q.programming_question_id}</code></td>
                                      <td className={styles.questionTitleCell}>{q.name || 'N/A'}</td>
                                      <td><span className={styles.questionTypeBadge}>{getQuestionType(q) || 'Programming'}</span></td>
                                      <td><span className={`${styles.levelBadge} ${styles[(q.level_name || 'easy').toLowerCase()]}`}>{q.level_name || 'Easy'}</span></td>
                                      <td>
                                        <Toggle
                                          checked={overrideEnabled}
                                          onChange={(checked) => handleToggleOverrideScore(segment.id, q.programming_question_id, 'PROGRAMMING', checked)}
                                          size="small"
                                        />
                                      </td>
                                      <td>
                                        {overrideEnabled ? (
                                          <div className={styles.marksInputs}>
                                            <input
                                              type="number"
                                              placeholder="+ve"
                                              value={getMarksValue(segment.id, q.programming_question_id, 'PROGRAMMING', 'positive', q)}
                                              onChange={(e) => handleMarksInputChange(segment.id, q.programming_question_id, 'PROGRAMMING', 'positive', e.target.value)}
                                              onBlur={(e) => handleUpdateMarks(segment.id, q.programming_question_id, 'PROGRAMMING', 'positive', e.target.value)}
                                              className={styles.markInput}
                                            />
                                            <input
                                              type="number"
                                              placeholder="-ve"
                                              value={getMarksValue(segment.id, q.programming_question_id, 'PROGRAMMING', 'negative', q)}
                                              onChange={(e) => handleMarksInputChange(segment.id, q.programming_question_id, 'PROGRAMMING', 'negative', e.target.value)}
                                              onBlur={(e) => handleUpdateMarks(segment.id, q.programming_question_id, 'PROGRAMMING', 'negative', e.target.value)}
                                              className={styles.markInput}
                                            />
                                            <input
                                              type="number"
                                              placeholder="Neutral"
                                              value={getMarksValue(segment.id, q.programming_question_id, 'PROGRAMMING', 'neutral', q)}
                                              onChange={(e) => handleMarksInputChange(segment.id, q.programming_question_id, 'PROGRAMMING', 'neutral', e.target.value)}
                                              onBlur={(e) => handleUpdateMarks(segment.id, q.programming_question_id, 'PROGRAMMING', 'neutral', e.target.value)}
                                              className={styles.markInput}
                                            />
                                          </div>
                                        ) : (
                                          <span className={styles.defaultMarks}>{q.default_weightage || 1} pts</span>
                                        )}
                                      </td>
                                      <td>
                                        <div className={styles.questionActions}>
                                          <button
                                            className={styles.actionIconBtn}
                                            onClick={() => handleViewQuestion(q.programming_question_id, 'PROGRAMMING')}
                                            title="View Question"
                                          >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                              <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                          </button>
                                          <button
                                            className={`${styles.actionIconBtn} ${styles.deleteBtn}`}
                                            onClick={() => handleRemoveQuestion(segment.id, q.programming_question_id, 'PROGRAMMING')}
                                            title="Delete"
                                          >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                              <polyline points="3 6 5 6 21 6"/>
                                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                            </svg>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                                {segment.mcq_questions?.map((q, qi) => {
                                  const questionIndex = (segment.programming_questions?.length || 0) + qi + 1
                                  const overrideEnabled = getOverrideEnabled(segment.id, q.mcq_question_id, 'MCQ', q)
                                  return (
                                    <tr key={`mcq-${q.id}`}>
                                      <td>{questionIndex}</td>
                                      <td><code>#{q.mcq_question_id}</code></td>
                                      <td className={styles.questionTitleCell}>{q.name || q.question_text || 'N/A'}</td>
                                      <td><span className={styles.questionTypeBadge}>{getQuestionType(q) || (q.is_multiselect || q.allow_multiple_answers ? 'Multiselect' : 'MCQ')}</span></td>
                                      <td><span className={`${styles.levelBadge} ${styles[(q.level_name || 'easy').toLowerCase()]}`}>{q.level_name || 'Easy'}</span></td>
                                      <td>
                                        <Toggle
                                          checked={overrideEnabled}
                                          onChange={(checked) => handleToggleOverrideScore(segment.id, q.mcq_question_id, 'MCQ', checked)}
                                          size="small"
                                        />
                                      </td>
                                      <td>
                                        {overrideEnabled ? (
                                          <div className={styles.marksInputs}>
                                            <input
                                              type="number"
                                              placeholder="+ve"
                                              value={getMarksValue(segment.id, q.mcq_question_id, 'MCQ', 'positive', q)}
                                              onChange={(e) => handleMarksInputChange(segment.id, q.mcq_question_id, 'MCQ', 'positive', e.target.value)}
                                              onBlur={(e) => handleUpdateMarks(segment.id, q.mcq_question_id, 'MCQ', 'positive', e.target.value)}
                                              className={styles.markInput}
                                            />
                                            <input
                                              type="number"
                                              placeholder="-ve"
                                              value={getMarksValue(segment.id, q.mcq_question_id, 'MCQ', 'negative', q)}
                                              onChange={(e) => handleMarksInputChange(segment.id, q.mcq_question_id, 'MCQ', 'negative', e.target.value)}
                                              onBlur={(e) => handleUpdateMarks(segment.id, q.mcq_question_id, 'MCQ', 'negative', e.target.value)}
                                              className={styles.markInput}
                                            />
                                            <input
                                              type="number"
                                              placeholder="Neutral"
                                              value={getMarksValue(segment.id, q.mcq_question_id, 'MCQ', 'neutral', q)}
                                              onChange={(e) => handleMarksInputChange(segment.id, q.mcq_question_id, 'MCQ', 'neutral', e.target.value)}
                                              onBlur={(e) => handleUpdateMarks(segment.id, q.mcq_question_id, 'MCQ', 'neutral', e.target.value)}
                                              className={styles.markInput}
                                            />
                                          </div>
                                        ) : (
                                          <span className={styles.defaultMarks}>{q.default_weightage || 1} pts</span>
                                        )}
                                      </td>
                                      <td>
                                        <div className={styles.questionActions}>
                                          <button
                                            className={styles.actionIconBtn}
                                            onClick={() => handleViewQuestion(q.mcq_question_id, 'MCQ')}
                                            title="View Question"
                                          >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                              <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                          </button>
                                          <button
                                            className={`${styles.actionIconBtn} ${styles.deleteBtn}`}
                                            onClick={() => handleRemoveQuestion(segment.id, q.mcq_question_id, 'MCQ')}
                                            title="Delete"
                                          >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                              <polyline points="3 6 5 6 21 6"/>
                                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                            </svg>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </Table>
                          </div>
                        ) : (
                          <p className={styles.noQuestions}>No questions added yet. Click "Add Question" to get started.</p>
                        )}
                      </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Publish Button - Only show if assessment is in draft status */}
          {assessment?.status === 'DRAFT' && segments.length > 0 && (
            <div className={styles.publishSection}>
              <div className={styles.publishInfo}>
                <h4>Ready to Publish?</h4>
                <p>Once published, the assessment will be available to users. Make sure all segments and questions are configured correctly.</p>
              </div>
              <Button 
                variant="primary" 
                size="large"
                onClick={() => setShowPublishConfirm(true)}
                disabled={publishing}
                className={styles.publishBtn}
              >
                {publishing ? (
                  <>
                    <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                    Publishing...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Publish Assessment
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Full-Page Question Selection Modal */}
      {showQuestionModal && (
        <div className={styles.fullPageModal}>
          <div className={styles.fullPageModalContent}>
            <div className={styles.fullPageModalHeader}>
              <h2>Add Questions to Segment</h2>
              <button 
                className={styles.closeBtn}
                onClick={() => {
                  setShowQuestionModal(false)
                  setSelectedQuestions([])
                  setAvailableQuestions([])
                }}
              >
                ×
              </button>
            </div>
            
            <div className={styles.fullPageModalBody}>
              {/* Filters */}
              <div className={styles.questionModalFilters}>
                <div className={styles.filterRow}>
                  <div className={styles.filterItem}>
                    <label>Question Type</label>
                    <select 
                      value={questionFilters.questionType || ''} 
                      onChange={(e) => {
                        const newFilters = { ...questionFilters, questionType: e.target.value }
                        setQuestionFilters(newFilters)
                        fetchAllQuestions(newFilters)
                      }}
                    >
                      <option value="">All Types</option>
                      <option value="Programming">Programming</option>
                      <option value="MCQ">MCQ</option>
                      <option value="Multiselect">Multiselect</option>
                      {questionTypes?.filter(type => {
                        const typeName = type.name.toLowerCase()
                        return !['programming', 'mcq', 'multiselect'].includes(typeName)
                      }).map(type => (
                        <option key={type.id} value={type.name}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.filterItem}>
                    <label>Question Bank</label>
                    <select 
                      value={questionFilters.questionBank || ''} 
                      onChange={(e) => {
                        const newFilters = { ...questionFilters, questionBank: e.target.value }
                        setQuestionFilters(newFilters)
                        fetchAllQuestions(newFilters)
                      }}
                    >
                      <option value="">All Banks</option>
                      {questionBanks.map(bank => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name} ({bank.question_count || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.filterItem}>
                    <label>Level</label>
                    <select 
                      value={questionFilters.level || ''} 
                      onChange={(e) => {
                        const newFilters = { ...questionFilters, level: e.target.value }
                        setQuestionFilters(newFilters)
                        fetchAllQuestions(newFilters)
                      }}
                    >
                      <option value="">All Levels</option>
                      {levels.map(level => (
                        <option key={level.id} value={level.id}>{level.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className={`${styles.filterItem} ${styles.search}`}>
                    <label>Search</label>
                    <input
                      type="text"
                      placeholder="Search by ID, title, tags..."
                      value={questionFilters.search || ''}
                      onChange={(e) => {
                        const newFilters = { ...questionFilters, search: e.target.value }
                        setQuestionFilters(newFilters)
                        // Debounce search
                        if (searchTimeoutRef.current) {
                          clearTimeout(searchTimeoutRef.current)
                        }
                        searchTimeoutRef.current = setTimeout(() => {
                          fetchAllQuestions(newFilters)
                        }, 300)
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Questions Table */}
              {loadingQuestions ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  <p>Loading questions...</p>
                </div>
              ) : availableQuestions.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No questions found. Try adjusting your filters.</p>
                </div>
              ) : (
                <>
                  <div className={styles.questionsTableContainer}>
                    <Table className={styles.questionsTable}>
                      <thead>
                        <tr>
                          <th style={{width: '40px'}}>
                            <input
                              type="checkbox"
                              checked={areAllVisibleSelected}
                              onChange={toggleSelectAllQuestions}
                              onClick={(e) => e.stopPropagation()}
                              title="Select all questions under current filter"
                            />
                          </th>
                          <th style={{width: '70px'}}>ID</th>
                          <th>Question</th>
                          <th style={{width: '100px'}}>Type</th>
                          <th style={{width: '100px'}}>Level</th>
                          <th>Tags</th>
                          <th style={{width: '60px'}}>Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableQuestions.map(q => (
                          <tr 
                            key={q.id} 
                            className={selectedQuestions.includes(q.id) ? styles.selected : ''}
                            onClick={() => toggleQuestionSelection(q.id)}
                          >
                            <td>
                              <input 
                                type="checkbox" 
                                checked={selectedQuestions.includes(q.id)}
                                onChange={() => toggleQuestionSelection(q.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td><code>#{q.id}</code></td>
                            <td className={styles.titleCell}>
                              <span className={styles.qTitle}>{q.name || q.question_text || 'N/A'}</span>
                            </td>
                            <td>
                              <span className={styles.questionTypeBadge}>
                                {getQuestionType(q)}
                              </span>
                            </td>
                            <td>
                              <span className={`${styles.levelBadge} ${styles[(q.level_name || 'easy').toLowerCase()]}`}>
                                {q.level_name || 'Easy'}
                              </span>
                            </td>
                            <td className={styles.tagsCell}>
                              {q.tags?.slice(0, 3).map((tag, i) => (
                                <span key={i} className={styles.tag}>{tag.name || tag}</span>
                              ))}
                              {q.tags?.length > 3 && <span className={`${styles.tag} ${styles.more}`}>+{q.tags.length - 3}</span>}
                            </td>
                            <td>{q.weightage || 1}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  <div className={styles.modalActions}>
                    <span className={styles.selectionCount}>{selectedQuestions.length} selected</span>
                    <div className={styles.actionButtons}>
                      <Button 
                        variant="secondary" 
                        onClick={() => {
                          setShowQuestionModal(false)
                          setSelectedQuestions([])
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={handleAddQuestionsFromModal}
                        disabled={selectedQuestions.length === 0}
                      >
                        Add {selectedQuestions.length} Question{selectedQuestions.length !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Segment Modal */}
      {showSegmentModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSegmentModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingSegment ? 'Edit Segment' : 'Add Segment'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowSegmentModal(false)}>×</button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Segment Name <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  value={segmentForm.name}
                  onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                  placeholder="e.g., Technical Round, Aptitude Test"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={segmentForm.description}
                  onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
                  placeholder="Describe what this segment covers"
                  rows="3"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  value={segmentForm.segment_duration / 60}
                  onChange={(e) => setSegmentForm({ ...segmentForm, segment_duration: parseInt(e.target.value) * 60 })}
                  min="1"
                />
                <span className={styles.helpText}>Used when the configuration's timing mode is segment-wise</span>
              </div>

              {showProgrammingLanguageRestriction && (
                <div className={styles.formGroup}>
                  <Dropdown
                    label="Programming Language Restriction (optional)"
                    options={languages}
                    value={segmentForm.allowed_language_ids}
                    onChange={(value) => setSegmentForm({ ...segmentForm, allowed_language_ids: value || [] })}
                    placeholder="All languages allowed (no restriction)"
                    multiple
                    searchable
                  />
                  <span className={styles.helpText}>
                    Limit which languages candidates can use for coding questions in this segment. Leave empty to allow all languages configured on each question.
                  </span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Question Source</label>
                <div className={styles.sourceOptions}>
                  <label className={styles.sourceOption}>
                    <input
                      type="radio"
                      name="question_source"
                      value="POOL"
                      checked={segmentForm.question_source === 'POOL'}
                      onChange={() => setSegmentForm({ ...segmentForm, question_source: 'POOL', question_bank_id: '' })}
                    />
                    <span>
                      <strong>Create New Question Pool</strong>
                      <small>Add specific questions to this segment; random fetch (if enabled) draws from them</small>
                    </span>
                  </label>
                  <label className={styles.sourceOption}>
                    <input
                      type="radio"
                      name="question_source"
                      value="BANK"
                      checked={segmentForm.question_source === 'BANK'}
                      onChange={() => setSegmentForm({ ...segmentForm, question_source: 'BANK' })}
                    />
                    <span>
                      <strong>From Question Bank</strong>
                      <small>Random fetch draws from the selected bank; no need to add questions here</small>
                    </span>
                  </label>
                </div>
              </div>

              {segmentForm.question_source === 'BANK' && (
                <div className={styles.formGroup}>
                  <label>Question Bank <span className={styles.required}>*</span></label>
                  <select
                    value={segmentForm.question_bank_id || ''}
                    onChange={(e) => setSegmentForm({ ...segmentForm, question_bank_id: e.target.value })}
                  >
                    <option value="">Select a question bank</option>
                    {questionBanks.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}{bank.question_count != null ? ` (${bank.question_count})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
                <label>
                  <input
                    type="checkbox"
                    checked={segmentForm.allow_back_navigation}
                    onChange={(e) => setSegmentForm({ ...segmentForm, allow_back_navigation: e.target.checked })}
                  />
                  Allow Back Navigation
                </label>
                <span className={styles.helpText}>Users can go back to previous questions</span>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="secondary" onClick={() => setShowSegmentModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveSegment}>
                {editingSegment ? 'Update Segment' : 'Add Segment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      <ConfirmModal
        isOpen={showPublishConfirm}
        onClose={() => setShowPublishConfirm(false)}
        onConfirm={handlePublishAssessment}
        title="Publish Assessment"
        message="Are you sure you want to publish this assessment? Once published, it will be available to users."
        confirmText="Publish"
        cancelText="Cancel"
        disabled={publishing}
      />

      <ConfirmDialog />

    </div>
  )
}

export default AssessmentEdit




