import { Toolbar, FieldGroup, ActionButton, PageContent } from "../../../../design/Primitives";
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../../../contexts/ApiContext';
import { toast } from 'react-toastify';
import Button from '../../../../components/Button/Button';
import Pagination from '../../../../components/Pagination/Pagination';
import Table from '../../../../components/Table/Table';
function AssessmentManagement() {
  const {
    apiBaseUrl,
    accessToken
  } = useApi();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const fetchAssessments = useCallback(async () => {
    if (!apiBaseUrl) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        pageSize: pageSize,
        ...(search && {
          search
        }),
        ...(selectedStatus && {
          status: selectedStatus
        })
      });
      const response = await fetch(`${apiBaseUrl}/api/assessment/assessments?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch assessments');
      const data = await response.json();
      setAssessments(data.assessments || []);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast.error('Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, accessToken, search, selectedStatus, currentPage, pageSize]);
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssessments();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchAssessments]);
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatus]);
  const formatStatus = status => {
    if (!status) return '—';
    return status.charAt(0) + status.slice(1).toLowerCase();
  };
  const formatDuration = seconds => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };
  const handleClearFilters = () => {
    setSearch('');
    setSelectedStatus('');
  };
  const hasActiveFilters = search || selectedStatus;
  return <PageContent className="assessment-management-page" view="AssessmentManagement">


      {loading ? <div className="loading">Loading assessments...</div> : totalCount === 0 && !hasActiveFilters ? <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <h3>No Assessments Found</h3>
          <p>Get started by creating your first assessment.</p>
          <Button variant="primary" onClick={() => navigate('/admin/assessments/create')}>
            Create Assessment
          </Button>
        </div> : <div className="assessments-table-card">
          <div className="table-container">
            <div className="filters-section">
              <Toolbar className="filters"><div className="cz-filter-actions"><Button variant="primary" onClick={() => navigate('/admin/assessments/create')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create Assessment
        </Button></div>
                <FieldGroup className="filter-group">
                  <label>Assessment Name</label>
                  <input type="text" className="filter-input" placeholder="Search by assessment name..." value={search} onChange={e => setSearch(e.target.value)} />
                </FieldGroup>
                <FieldGroup className="filter-group">
                  <label>Status</label>
                  <select className="filter-select" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                    <option value="">All</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </FieldGroup>
                {hasActiveFilters && <ActionButton type="button" onClick={handleClearFilters} className="btn-clear-filters" title="Clear all filters">
                    <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                      <path d="M899.1 869.6l-53-305.6H864c14.4 0 26-11.6 26-26V346c0-14.4-11.6-26-26-26H618V138c0-14.4-11.6-26-26-26H432c-14.4 0-26 11.6-26 26v182H160c-14.4 0-26 11.6-26 26v192c0 14.4 11.6 26 26 26h17.9l-53 305.6a25.95 25.95 0 0025.6 30.4h723c1.5 0 3-.1 4.4-.4a25.88 25.88 0 0021.2-30zM204 390h272V182h72v208h272v104H204V390zm468 440V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H416V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H202.8l45.1-260H776l45.1 260H672z"></path>
                    </svg>
                  </ActionButton>}
              </Toolbar>
            </div>

            {assessments.length === 0 ? <div className="empty-state filtered-empty">
                <h3>No Assessments Match Your Filters</h3>
                <p>Try adjusting your filters or create a new assessment.</p>
              </div> : <div className="table-wrapper">
                <Table variant="embedded">
                  <thead>
                    <tr>
                      <th>Assessment</th>
                      <th>Segments</th>
                      <th>Duration</th>
                      <th>Configurations</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map(assessment => <tr key={assessment.id}>
                        <td>
                          <ActionButton type="button" className="assessment-name-link" onClick={() => navigate(`/admin/assessments/${assessment.id}/edit`)}>
                            {assessment.title}
                          </ActionButton>
                          <div className="assessment-meta">{assessment.unique_id}</div>
                        </td>
                        <td>{assessment.segment_count || 0}</td>
                        <td>{formatDuration(assessment.total_duration)}</td>
                        <td>{assessment.config_count || 0}</td>
                        <td>{formatStatus(assessment.status)}</td>
                        <td>{new Date(assessment.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <ActionButton type="button" className="btn-edit" onClick={() => navigate(`/admin/assessments/${assessment.id}/edit`)} title="View/Edit Assessment">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </ActionButton>
                          </div>
                        </td>
                      </tr>)}
                  </tbody>
                </Table>
              </div>}

            {totalCount > 0 && <div className="pagination-wrapper">
                <Pagination currentPage={currentPage} pageSize={pageSize} totalCount={totalCount} itemName="assessments" onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
              </div>}
          </div>
        </div>}
    </PageContent>;
}
export default AssessmentManagement;
