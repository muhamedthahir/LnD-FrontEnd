import { ActionButton, Toolbar, FieldGroup, PageContent } from "../../../design/Primitives";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Pagination from '../../../components/Pagination/Pagination';
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal';
import Table from '../../../components/Table/Table';
import { useApi } from '../../../contexts/ApiContext';
import { API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES } from "../../../constants/constants.js";
function Groups() {
  const navigate = useNavigate();
  const {
    apiBaseUrl,
    accessToken
  } = useApi();
  const [groups, setGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    college: '',
    groupName: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  useEffect(() => {
    fetchGroups();
    fetchColleges();
  }, []);
  useEffect(() => {
    applyFilters();
  }, [filters, allGroups]);
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    ...((accessToken || localStorage.getItem('accessToken')) && {
      Authorization: `Bearer ${accessToken || localStorage.getItem('accessToken')}`
    })
  });
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.GROUPS.LIST}`, {
        headers: authHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setAllGroups(data.groups || []);
      } else {
        toast.error(ERROR_MESSAGES.GROUP_FETCH_FAILED);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error(ERROR_MESSAGES.GROUP_FETCH_FAILED);
    } finally {
      setLoading(false);
    }
  };
  const fetchColleges = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.INSTITUTIONS.ALL}`, {
        headers: authHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setColleges((data.institutions || []).map(inst => typeof inst === 'string' ? inst : inst.name));
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };
  const applyFilters = () => {
    let filtered = [...allGroups];
    if (filters.college) {
      filtered = filtered.filter(g => g.college_name === filters.college);
    }
    if (filters.groupName) {
      const nameLower = filters.groupName.toLowerCase();
      filtered = filtered.filter(g => g.name.toLowerCase().includes(nameLower));
    }
    setGroups(filtered);
    setCurrentPage(1);
  };
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const clearFilters = () => {
    setFilters({
      college: '',
      groupName: ''
    });
  };
  const handleDeleteClick = id => {
    const group = groups.find(g => g.id === id);
    setGroupToDelete({
      id,
      name: group?.name || 'this group'
    });
    setShowDeleteModal(true);
  };
  const handleDeleteConfirm = async () => {
    if (!groupToDelete || !groupToDelete.id) return;
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.GROUPS.DELETE(groupToDelete.id)}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (response.ok) {
        toast.success(SUCCESS_MESSAGES.GROUP_DELETED);
        fetchGroups();
      } else {
        toast.error(ERROR_MESSAGES.GROUP_DELETE_FAILED);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error(ERROR_MESSAGES.GROUP_DELETE_FAILED);
    }
    setShowDeleteModal(false);
    setGroupToDelete(null);
  };
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setGroupToDelete(null);
  };
  return <PageContent className="groups-page" view="Groups">


      <div className="groups-table-card">
        <div className="table-container">
          <div className="filters-section">
            <Toolbar className="filters"><div className="cz-filter-actions"><ActionButton className="btn-primary" type="button" onClick={() => navigate('/admin/groups/create')}>
          + Create Group
        </ActionButton></div>
              <FieldGroup className="filter-group">
                <label>College</label>
                <select value={filters.college} onChange={e => handleFilterChange('college', e.target.value)} className="filter-select">
                  <option value="">All Colleges</option>
                  {colleges.map(college => <option key={college} value={college}>
                      {college}
                    </option>)}
                </select>
              </FieldGroup>
              <FieldGroup className="filter-group">
                <label>Group Name</label>
                <input type="text" placeholder="Search by group name..." value={filters.groupName} onChange={e => handleFilterChange('groupName', e.target.value)} className="filter-input" />
              </FieldGroup>
              {(filters.college || filters.groupName) && <ActionButton onClick={clearFilters} className="btn-clear-filters" title="Clear all filters">
                  <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                    <path d="M899.1 869.6l-53-305.6H864c14.4 0 26-11.6 26-26V346c0-14.4-11.6-26-26-26H618V138c0-14.4-11.6-26-26-26H432c-14.4 0-26 11.6-26 26v182H160c-14.4 0-26 11.6-26 26v192c0 14.4 11.6 26 26 26h17.9l-53 305.6a25.95 25.95 0 0025.6 30.4h723c1.5 0 3-.1 4.4-.4a25.88 25.88 0 0021.2-30zM204 390h272V182h72v208h272v104H204V390zm468 440V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H416V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H202.8l45.1-260H776l45.1 260H672z"></path>
                  </svg>
                </ActionButton>}
            </Toolbar>
          </div>

          <div className="table-inner-box">
            {loading ? <div className="loading">Loading groups...</div> : groups.length === 0 ? <div className="empty-state">
                <div className="empty-state-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3>No Groups Found</h3>
                <p>{filters.college || filters.groupName ? 'Try adjusting your filters or create a new group.' : 'Get started by creating your first student group.'}</p>
              </div> : <Table variant="embedded">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>College</th>
                    <th>Degree</th>
                    <th>Department</th>
                    <th>Passout Year</th>
                    <th>Members</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(group => <tr key={group.id}>
                      <td>{group.name}</td>
                      <td>{group.college_name}</td>
                      <td>{group.degree || '-'}</td>
                      <td>{group.department || '-'}</td>
                      <td>{group.passout_year || '-'}</td>
                      <td>{group.member_count || 0}</td>
                      <td>{new Date(group.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <ActionButton className="btn-edit" type="button" onClick={() => navigate(`/admin/groups/${group.id}/edit`)} title="Edit Group">
                            Edit
                          </ActionButton>
                          <ActionButton className="btn-delete" type="button" onClick={() => handleDeleteClick(group.id)} title="Delete">
                            Delete
                          </ActionButton>
                        </div>
                      </td>
                    </tr>)}
                </tbody>
              </Table>}
          </div>
          {!loading && groups.length > 0 && <div className="pagination-wrapper">
              <Pagination currentPage={currentPage} pageSize={pageSize} totalCount={groups.length} itemName="groups" onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
            </div>}
        </div>
      </div>

      <ConfirmModal isOpen={showDeleteModal} onClose={handleDeleteCancel} onConfirm={handleDeleteConfirm} title="Delete Group" message={groupToDelete ? `Are you sure you want to delete "${groupToDelete.name}"? This action cannot be undone.` : 'Are you sure you want to delete this group? This action cannot be undone.'} confirmText="Delete" cancelText="Cancel" />
    </PageContent>;
}
export default Groups;
