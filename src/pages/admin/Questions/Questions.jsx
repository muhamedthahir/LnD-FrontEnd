import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useApi } from '../../../contexts/ApiContext'
import { API_ENDPOINTS } from '../../../constants/constants'
import Button from '../../../components/Button/Button'
import Pagination from '../../../components/Pagination/Pagination'
import Dropdown from '../../../components/Dropdown/Dropdown'
import Toggle from '../../../components/Toggle/Toggle'
import QuestionBankModal from './QuestionBankModal'
import QuestionModal from './QuestionModal'
import TestCaseModal from './TestCaseModal'
import './Questions.css'

function Questions() {
  const { apiBaseUrl, accessToken } = useApi()
  
  // Question Banks state
  const [questionBanks, setQuestionBanks] = useState([])
  const [questionBanksTotal, setQuestionBanksTotal] = useState(0)
  const [questionBanksPage, setQuestionBanksPage] = useState(1)
  const [questionBanksLoading, setQuestionBanksLoading] = useState(false)
  const [showQuestionBankModal, setShowQuestionBankModal] = useState(false)
  const [editingQuestionBank, setEditingQuestionBank] = useState(null)
  
  // Questions state
  const [questions, setQuestions] = useState([])
  const [questionsTotal, setQuestionsTotal] = useState(0)
  const [questionsPage, setQuestionsPage] = useState(1)
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  
  // Test Case Modal
  const [showTestCaseModal, setShowTestCaseModal] = useState(false)
  const [selectedProgrammingQuestion, setSelectedProgrammingQuestion] = useState(null)
  
  // Master data
  const [masterData, setMasterData] = useState({
    levels: [],
    statuses: [],
    questionTypes: [],
    languages: [],
    categories: [],
    tags: []
  })
  const [institutions, setInstitutions] = useState([])
  
  const ITEMS_PER_PAGE = 10

  // Fetch master data
  useEffect(() => {
    fetchMasterData()
    fetchInstitutions()
  }, [])

  // Fetch question banks
  useEffect(() => {
    fetchQuestionBanks()
  }, [questionBanksPage])

  // Fetch questions
  useEffect(() => {
    fetchQuestions()
  }, [questionsPage])

  const fetchMasterData = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.MASTER_DATA.ALL}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setMasterData(data)
      }
    } catch (error) {
      console.error('Failed to fetch master data:', error)
    }
  }

  const fetchInstitutions = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.INSTITUTIONS.ALL}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setInstitutions(data.institutions || [])
      }
    } catch (error) {
      console.error('Failed to fetch institutions:', error)
    }
  }

  const fetchQuestionBanks = async () => {
    try {
      setQuestionBanksLoading(true)
      const offset = (questionBanksPage - 1) * ITEMS_PER_PAGE
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.QUESTION_BANKS.LIST}?limit=${ITEMS_PER_PAGE}&offset=${offset}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }
      )
      if (response.ok) {
        const data = await response.json()
        setQuestionBanks(data.questionBanks || [])
        setQuestionBanksTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch question banks:', error)
      toast.error('Failed to fetch question banks')
    } finally {
      setQuestionBanksLoading(false)
    }
  }

  const fetchQuestions = async () => {
    try {
      setQuestionsLoading(true)
      const offset = (questionsPage - 1) * ITEMS_PER_PAGE
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.QUESTIONS.LIST}?limit=${ITEMS_PER_PAGE}&offset=${offset}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }
      )
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
        setQuestionsTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
      toast.error('Failed to fetch questions')
    } finally {
      setQuestionsLoading(false)
    }
  }

  // Question Bank handlers
  const handleCreateQuestionBank = () => {
    setEditingQuestionBank(null)
    setShowQuestionBankModal(true)
  }

  const handleEditQuestionBank = (bank) => {
    setEditingQuestionBank(bank)
    setShowQuestionBankModal(true)
  }

  const handleQuestionBankSaved = () => {
    setShowQuestionBankModal(false)
    setEditingQuestionBank(null)
    fetchQuestionBanks()
  }

  // Question handlers
  const handleCreateQuestion = () => {
    setEditingQuestion(null)
    setShowQuestionModal(true)
  }

  const handleEditQuestion = async (question) => {
    // Fetch full question details
    try {
      const response = await fetch(
        `${apiBaseUrl}${API_ENDPOINTS.QUESTIONS.GET(question.id)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
          }
        }
      )
      if (response.ok) {
        const data = await response.json()
        setEditingQuestion(data)
        setShowQuestionModal(true)
      }
    } catch (error) {
      console.error('Failed to fetch question details:', error)
      toast.error('Failed to fetch question details')
    }
  }

  const handleQuestionSaved = (savedQuestion) => {
    setShowQuestionModal(false)
    setEditingQuestion(null)
    fetchQuestions()
    
    // If it's a programming question, prompt for test cases
    if (savedQuestion?.programmingQuestion && !savedQuestion?.hasTestCases) {
      setSelectedProgrammingQuestion(savedQuestion.programmingQuestion)
      setShowTestCaseModal(true)
    }
  }

  const handleAddTestCase = (question) => {
    if (question.programmingQuestion) {
      setSelectedProgrammingQuestion(question.programmingQuestion)
      setShowTestCaseModal(true)
    }
  }

  const handleTestCaseSaved = () => {
    fetchQuestions()
  }

  const getStatusBadgeClass = (statusName) => {
    switch (statusName?.toUpperCase()) {
      case 'PUBLISHED':
        return 'status-published'
      case 'DRAFT':
        return 'status-draft'
      case 'REVIEW':
        return 'status-review'
      default:
        return ''
    }
  }

  return (
    <div className="questions-page">
      {/* Question Banks Section */}
      <section className="page-section">
        <div className="section-header">
          <h2>Question Banks</h2>
          <Button variant="primary" onClick={handleCreateQuestionBank}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Question Bank
          </Button>
        </div>

        {questionBanksLoading ? (
          <div className="loading-state">Loading question banks...</div>
        ) : questionBanks.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>No question banks found</p>
            <p className="empty-hint">Create your first question bank to organize questions</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Institution</th>
                    <th>Status</th>
                    <th>Questions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questionBanks.map((bank) => (
                    <tr key={bank.id}>
                      <td className="name-cell">{bank.name}</td>
                      <td className="description-cell">{bank.description || '-'}</td>
                      <td>{bank.institution_name || '-'}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(bank.status_name)}`}>
                          {bank.status_name}
                        </span>
                      </td>
                      <td>{bank.question_count || 0}</td>
                      <td className="actions-cell">
                        <button 
                          className="action-btn edit"
                          onClick={() => handleEditQuestionBank(bank)}
                          title="Edit"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {questionBanksTotal > ITEMS_PER_PAGE && (
              <Pagination
                currentPage={questionBanksPage}
                totalItems={questionBanksTotal}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setQuestionBanksPage}
              />
            )}
          </>
        )}
      </section>

      {/* Questions Section */}
      <section className="page-section">
        <div className="section-header">
          <h2>Questions</h2>
          <Button variant="primary" onClick={handleCreateQuestion}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Question
          </Button>
        </div>

        {questionsLoading ? (
          <div className="loading-state">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p>No questions found</p>
            <p className="empty-hint">Create your first question to get started</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Level</th>
                    <th>Status</th>
                    <th>Question Bank</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question) => (
                    <tr key={question.id}>
                      <td className="code-cell">{question.code}</td>
                      <td className="name-cell">{question.name}</td>
                      <td>
                        <span className={`type-badge type-${question.question_type_name?.toLowerCase().replace(' ', '-')}`}>
                          {question.question_type_name}
                        </span>
                      </td>
                      <td>
                        {question.level_name && (
                          <span className={`level-badge level-${question.level_name?.toLowerCase()}`}>
                            {question.level_name}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(question.status_name)}`}>
                          {question.status_name}
                        </span>
                      </td>
                      <td>{question.question_bank_name || '-'}</td>
                      <td className="actions-cell">
                        <button 
                          className="action-btn edit"
                          onClick={() => handleEditQuestion(question)}
                          title="Edit"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        {question.question_type_name === 'Programming' && (
                          <button 
                            className="action-btn test-case"
                            onClick={() => handleAddTestCase(question)}
                            title="Manage Test Cases"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="16 18 22 12 16 6"/>
                              <polyline points="8 6 2 12 8 18"/>
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {questionsTotal > ITEMS_PER_PAGE && (
              <Pagination
                currentPage={questionsPage}
                totalItems={questionsTotal}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setQuestionsPage}
              />
            )}
          </>
        )}
      </section>

      {/* Modals */}
      {showQuestionBankModal && (
        <QuestionBankModal
          isOpen={showQuestionBankModal}
          onClose={() => {
            setShowQuestionBankModal(false)
            setEditingQuestionBank(null)
          }}
          onSave={handleQuestionBankSaved}
          editingBank={editingQuestionBank}
          institutions={institutions}
          statuses={masterData.statuses}
          tags={masterData.tags}
        />
      )}

      {showQuestionModal && (
        <QuestionModal
          isOpen={showQuestionModal}
          onClose={() => {
            setShowQuestionModal(false)
            setEditingQuestion(null)
          }}
          onSave={handleQuestionSaved}
          editingQuestion={editingQuestion}
          masterData={masterData}
          questionBanks={questionBanks}
        />
      )}

      {showTestCaseModal && selectedProgrammingQuestion && (
        <TestCaseModal
          isOpen={showTestCaseModal}
          onClose={() => {
            setShowTestCaseModal(false)
            setSelectedProgrammingQuestion(null)
          }}
          onSave={handleTestCaseSaved}
          programmingQuestion={selectedProgrammingQuestion}
        />
      )}
    </div>
  )
}

export default Questions

