import { ActionButton, FieldGroup, PageContent, Toolbar } from "../../../design/Primitives";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useApi } from '../../../contexts/ApiContext';
import { useAutoLoadMasterData } from "../../../hooks/useMasterData.js";
import { API_ENDPOINTS } from "../../../constants/constants.js";
import Pagination from '../../../components/Pagination/Pagination';
import Dropdown from '../../../components/Dropdown/Dropdown';
import Table from '../../../components/Table/Table';
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal';
function QuestionList() {
  const navigate = useNavigate();
  const {
    apiBaseUrl,
    accessToken
  } = useApi();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const {
    questionTypes,
    levels,
    statuses
  } = useAutoLoadMasterData();
  const [selectedType, setSelectedType] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const abortControllerRef = useRef(null);
  const requestSeq = useRef(0);
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
  });
  const fetchQuestions = useCallback(async () => {
    if (!apiBaseUrl) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const seq = ++requestSeq.current;
    const showFullLoader = questionsRef.current.length === 0;
    try {
      if (showFullLoader) setLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const url = new URL(`${apiBaseUrl}${API_ENDPOINTS.QUESTIONS.LIST}`);
      url.searchParams.append('limit', pageSize.toString());
      url.searchParams.append('offset', offset.toString());
      if (search) url.searchParams.append('search', search);
      if (selectedType) url.searchParams.append('question_type_id', selectedType);
      if (selectedLevel) url.searchParams.append('level_id', selectedLevel);
      if (selectedStatus) url.searchParams.append('status_id', selectedStatus);
      const response = await fetch(url, {
        headers: authHeaders(),
        signal: controller.signal
      });
      if (seq !== requestSeq.current) return;
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
        setTotalCount(data.total || 0);
      } else {
        toast.error('Failed to fetch questions');
      }
    } catch (error) {
      if (error.name !== 'AbortError' && seq === requestSeq.current) {
        console.error('Error fetching questions:', error);
        toast.error('Failed to fetch questions');
      }
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [apiBaseUrl, accessToken, currentPage, pageSize, search, selectedType, selectedLevel, selectedStatus]);
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions();
    }, search ? 300 : 0);
    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchQuestions]);
  const handleDeleteConfirm = async () => {
    if (!questionToDelete?.id) return;
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.QUESTIONS.DELETE(questionToDelete.id)}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (response.ok) {
        toast.success('Question deleted');
        fetchQuestions();
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
    setQuestionToDelete(null);
  };
  const getStatusBadgeClass = statusName => {
    switch (statusName?.toUpperCase()) {
      case 'PUBLISHED':
        return 'status-published';
      case 'DRAFT':
        return 'status-draft';
      case 'REVIEW':
        return 'status-review';
      default:
        return '';
    }
  };
  const getLevelBadgeClass = levelName => {
    switch (levelName?.toLowerCase()) {
      case 'easy':
        return 'level-easy';
      case 'medium':
        return 'level-medium';
      case 'hard':
        return 'level-hard';
      default:
        return '';
    }
  };
  const getTypeBadgeClass = typeName => {
    switch (typeName?.toLowerCase()) {
      case 'mcq':
        return 'type-mcq';
      case 'multi select':
        return 'type-multi-select';
      case 'programming':
        return 'type-programming';
      default:
        return '';
    }
  };
  const handleRowClick = question => {
    navigate(`/admin/questions/list/${question.id}`);
  };
  const clearFilters = () => {
    setSelectedType(null);
    setSelectedLevel(null);
    setSelectedStatus(null);
    setSearch('');
  };
  const hasFilters = selectedType || selectedLevel || selectedStatus || search;
  return <PageContent className="questions-page" view="QuestionList">


      <div className="table-card">
        <div className="table-filters"><div className="cz-filter-actions"><ActionButton className="btn-primary" onClick={() => navigate('/admin/questions/list/create')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Question
        </ActionButton></div>
          <FieldGroup className="filter-group">
            <label>Search</label>
            <input type="text" placeholder="Search questions..." value={search} onChange={e => setSearch(e.target.value)} className="search-input" />
          </FieldGroup>
          <FieldGroup className="filter-group filter-dropdown">
            <Dropdown label="Type" options={questionTypes} value={selectedType} onChange={setSelectedType} placeholder="All Types" />
          </FieldGroup>
          <FieldGroup className="filter-group filter-dropdown">
            <Dropdown label="Level" options={levels} value={selectedLevel} onChange={setSelectedLevel} placeholder="All Levels" />
          </FieldGroup>
          <FieldGroup className="filter-group filter-dropdown">
            <Dropdown label="Status" options={statuses} value={selectedStatus} onChange={setSelectedStatus} placeholder="All Statuses" />
          </FieldGroup>
          {hasFilters && <ActionButton className="btn-clear-filters" onClick={clearFilters} title="Clear filters">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Clear
            </ActionButton>}
        </div>

        <div className="table-container" aria-busy={loading}>
          {loading && questions.length === 0 ? <div className="loading-state">Loading questions...</div> : questions.length === 0 ? <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h3>No Questions Found</h3>
              <p>Create your first question to get started</p>
            </div> : <Table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th>Question Bank</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(question => <tr key={question.id}>
                    <td className="code-cell">{question.code}</td>
                    <td className="name-cell clickable" onClick={() => handleRowClick(question)}>
                      {question.name}
                    </td>
                    <td>
                      <span className={`type-badge ${getTypeBadgeClass(question.question_type_name)}`}>
                        {question.question_type_name}
                      </span>
                    </td>
                    <td>
                      {question.level_name && <span className={`level-badge ${getLevelBadgeClass(question.level_name)}`}>
                          {question.level_name}
                        </span>}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(question.status_name)}`}>
                        {question.status_name}
                      </span>
                    </td>
                    <td>{question.question_bank_name || '-'}</td>
                    <td>{new Date(question.created_at).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <ActionButton className="action-btn edit" onClick={e => {
                  e.stopPropagation();
                  navigate(`/admin/questions/list/${question.id}/edit`);
                }} title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </ActionButton>
                      <ActionButton className="btn-delete" type="button" onClick={e => {
                  e.stopPropagation();
                  setQuestionToDelete(question);
                }} title="Delete">
                        Delete
                      </ActionButton>
                    </td>
                  </tr>)}
              </tbody>
            </Table>}
        </div>

        {(questions.length > 0 || !loading) && totalCount > 0 && <div className="pagination-wrapper">
            <Pagination currentPage={currentPage} pageSize={pageSize} totalCount={totalCount} itemName="questions" onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
          </div>}
      </div>
      <ConfirmModal isOpen={!!questionToDelete} onClose={() => setQuestionToDelete(null)} onConfirm={handleDeleteConfirm} title="Delete Question" message={questionToDelete ? `Are you sure you want to delete "${questionToDelete.name}"? This action cannot be undone.` : 'Are you sure you want to delete this question?'} confirmText="Delete" cancelText="Cancel" />
    </PageContent>;
}
export default QuestionList;
