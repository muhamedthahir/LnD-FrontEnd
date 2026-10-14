import { PageContent, ActionButton, Panel, FieldGroup, Toolbar } from "../../../../design/Primitives";
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Pagination from '../../../../components/Pagination/Pagination';
import { useApi } from '../../../../contexts/ApiContext';
import { API_ENDPOINTS, SUCCESS_MESSAGES, ERROR_MESSAGES, VALIDATION_MESSAGES } from "../../../../constants/constants.js";
import ThemedSelect from '../../../../components/ThemedSelect/ThemedSelect';
function CreateGroup() {
  const navigate = useNavigate();
  const {
    id
  } = useParams();
  const isEditing = Boolean(id);
  const {
    apiBaseUrl,
    accessToken
  } = useApi();
  const [institutions, setInstitutions] = useState([]);
  const [formPage, setFormPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    college_name: '',
    degree: '',
    department: '',
    passout_year: ''
  });
  const [errors, setErrors] = useState({});
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [groupStudents, setGroupStudents] = useState([]);
  const [initialMemberIds, setInitialMemberIds] = useState([]);
  const [searchLeft, setSearchLeft] = useState('');
  const [searchRight, setSearchRight] = useState('');
  const [leftPage, setLeftPage] = useState(1);
  const [rightPage, setRightPage] = useState(1);
  const [leftPageSize, setLeftPageSize] = useState(10);
  const [rightPageSize, setRightPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditing);
  const [catalogDepartments, setCatalogDepartments] = useState([]);
  const [catalogDegrees, setCatalogDegrees] = useState([]);
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    ...((accessToken || localStorage.getItem('accessToken')) && {
      Authorization: `Bearer ${accessToken || localStorage.getItem('accessToken')}`
    })
  });
  useEffect(() => {
    fetchInstitutions();
  }, [apiBaseUrl, accessToken]);
  useEffect(() => {
    if (!apiBaseUrl) return;
    const loadCatalog = async () => {
      try {
        const [dRes, gRes] = await Promise.all([fetch(`${apiBaseUrl}${API_ENDPOINTS.MASTER_DATA.DEPARTMENTS}`, {
          headers: authHeaders()
        }), fetch(`${apiBaseUrl}${API_ENDPOINTS.MASTER_DATA.DEGREES}`, {
          headers: authHeaders()
        })]);
        if (dRes.ok) {
          const data = await dRes.json();
          setCatalogDepartments(data.departments || []);
        }
        if (gRes.ok) {
          const data = await gRes.json();
          setCatalogDegrees(data.degrees || []);
        }
      } catch (e) {
        console.error('Failed to load department/degree catalog:', e);
      }
    };
    loadCatalog();
  }, [apiBaseUrl, accessToken]);
  useEffect(() => {
    if (!isEditing || !id || !apiBaseUrl) return;
    const loadGroup = async () => {
      try {
        setPageLoading(true);
        const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.GROUPS.EDIT_DATA(id)}`, {
          headers: authHeaders()
        });
        if (!response.ok) {
          toast.error(ERROR_MESSAGES.GROUP_FETCH_FAILED);
          navigate('/admin/groups');
          return;
        }
        const data = await response.json();
        const group = data.group;
        setFormData({
          name: group.name || '',
          college_name: group.college_name || '',
          degree: group.degree || '',
          department: group.department || '',
          passout_year: group.passout_year || ''
        });
        setGroupStudents(data.members || []);
        setAvailableStudents(data.availableUsers || []);
        setInitialMemberIds((data.members || []).map(m => m.id));
      } catch (error) {
        console.error('Error loading group:', error);
        toast.error(ERROR_MESSAGES.GROUP_FETCH_FAILED);
        navigate('/admin/groups');
      } finally {
        setPageLoading(false);
      }
    };
    loadGroup();
  }, [id, isEditing, apiBaseUrl, accessToken, navigate]);
  const fetchInstitutions = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.INSTITUTIONS.ALL}`, {
        headers: authHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setInstitutions((data.institutions || []).map(inst => typeof inst === 'string' ? {
          id: inst,
          name: inst
        } : {
          id: inst.id,
          name: inst.name
        }));
      }
    } catch (error) {
      console.error('Error fetching institutions:', error);
    }
  };
  const fetchStudentsForCollege = async collegeName => {
    try {
      const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.USERS.LIST}?college=${encodeURIComponent(collegeName)}&limit=1000`, {
        headers: authHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const students = (data.users || []).filter(u => u.role === 'student');
        setAvailableStudents(students);
        setGroupStudents([]);
        setSelectedStudentIds([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };
  const handleChange = e => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = VALIDATION_MESSAGES.GROUP_NAME_REQUIRED || 'Group name is required';
    }
    if (!formData.college_name || !formData.college_name.trim()) {
      newErrors.college_name = VALIDATION_MESSAGES.GROUP_COLLEGE_REQUIRED || 'College name is required';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length) {
      Object.values(newErrors).forEach(msg => toast.error(msg));
      return false;
    }
    return true;
  };
  const handleNextPage = () => {
    if (!validateForm()) return;
    if (!isEditing) {
      fetchStudentsForCollege(formData.college_name);
    }
    setFormPage(2);
  };
  const handleBackToPage1 = () => {
    setFormPage(1);
    setSelectedStudentIds([]);
    setSearchLeft('');
    setSearchRight('');
  };
  const handleMoveToRight = () => {
    const selected = availableStudents.filter(s => selectedStudentIds.includes(s.id));
    const remainingCount = availableStudents.length - selected.length;
    setGroupStudents(prev => [...prev, ...selected]);
    setAvailableStudents(prev => prev.filter(s => !selectedStudentIds.includes(s.id)));
    setSelectedStudentIds([]);
    if (remainingCount > 0) {
      const maxPage = Math.ceil(remainingCount / leftPageSize);
      if (leftPage > maxPage) {
        setLeftPage(Math.max(1, maxPage));
      }
    } else {
      setLeftPage(1);
    }
  };
  const handleMoveToLeft = () => {
    const selected = groupStudents.filter(s => selectedStudentIds.includes(s.id));
    const remainingCount = groupStudents.length - selected.length;
    setAvailableStudents(prev => [...prev, ...selected]);
    setGroupStudents(prev => prev.filter(s => !selectedStudentIds.includes(s.id)));
    setSelectedStudentIds([]);
    if (remainingCount > 0) {
      const maxPage = Math.ceil(remainingCount / rightPageSize);
      if (rightPage > maxPage) {
        setRightPage(Math.max(1, maxPage));
      }
    } else {
      setRightPage(1);
    }
  };
  const toggleStudentSelection = studentId => {
    setSelectedStudentIds(prev => prev.includes(studentId) ? prev.filter(sid => sid !== studentId) : [...prev, studentId]);
  };
  const filteredLeftStudents = availableStudents.filter(s => {
    const search = searchLeft.toLowerCase();
    return s.name.toLowerCase().includes(search) || s.email.toLowerCase().includes(search) || s.roll_number && s.roll_number.toLowerCase().includes(search);
  });
  const filteredRightStudents = groupStudents.filter(s => {
    const search = searchRight.toLowerCase();
    return s.name.toLowerCase().includes(search) || s.email.toLowerCase().includes(search) || s.roll_number && s.roll_number.toLowerCase().includes(search);
  });
  const paginatedLeftStudents = filteredLeftStudents.slice((leftPage - 1) * leftPageSize, leftPage * leftPageSize);
  const paginatedRightStudents = filteredRightStudents.slice((rightPage - 1) * rightPageSize, rightPage * rightPageSize);
  const handleSelectAllLeft = () => {
    const allFilteredIds = filteredLeftStudents.map(s => s.id);
    const allSelected = allFilteredIds.every(sid => selectedStudentIds.includes(sid));
    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(sid => !allFilteredIds.includes(sid)));
    } else {
      setSelectedStudentIds(prev => [...prev, ...allFilteredIds.filter(sid => !prev.includes(sid))]);
    }
  };
  const handleSelectAllRight = () => {
    const allFilteredIds = filteredRightStudents.map(s => s.id);
    const allSelected = allFilteredIds.every(sid => selectedStudentIds.includes(sid));
    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(sid => !allFilteredIds.includes(sid)));
    } else {
      setSelectedStudentIds(prev => [...prev, ...allFilteredIds.filter(sid => !prev.includes(sid))]);
    }
  };
  const allLeftSelected = filteredLeftStudents.length > 0 && filteredLeftStudents.every(s => selectedStudentIds.includes(s.id));
  const allRightSelected = filteredRightStudents.length > 0 && filteredRightStudents.every(s => selectedStudentIds.includes(s.id));
  const someLeftSelected = filteredLeftStudents.some(s => selectedStudentIds.includes(s.id)) && !allLeftSelected;
  const someRightSelected = filteredRightStudents.some(s => selectedStudentIds.includes(s.id)) && !allRightSelected;
  useEffect(() => {
    setLeftPage(1);
  }, [searchLeft]);
  useEffect(() => {
    setRightPage(1);
  }, [searchRight]);
  const handleSubmit = async e => {
    e.preventDefault();
    if (formPage === 1) {
      handleNextPage();
      return;
    }
    setLoading(true);
    try {
      let groupId = id;
      if (isEditing) {
        const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.GROUPS.UPDATE(id)}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(formData)
        });
        if (!response.ok) {
          const data = await response.json();
          toast.error(data.error || ERROR_MESSAGES.GROUP_UPDATE_FAILED);
          return;
        }
      } else {
        const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.GROUPS.CREATE}`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(formData)
        });
        if (!response.ok) {
          const data = await response.json();
          toast.error(data.error || ERROR_MESSAGES.GROUP_CREATE_FAILED);
          return;
        }
        const data = await response.json();
        groupId = data.group.id;
      }
      const previousMemberIds = isEditing ? initialMemberIds : [];
      const currentMemberIds = groupStudents.map(s => s.id);
      const addUserIds = currentMemberIds.filter(sid => !previousMemberIds.includes(sid));
      const removeUserIds = previousMemberIds.filter(sid => !currentMemberIds.includes(sid));
      if (addUserIds.length > 0 || removeUserIds.length > 0) {
        const memberResponse = await fetch(`${apiBaseUrl}${API_ENDPOINTS.GROUPS.ADD_MEMBERS(groupId)}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({
            addUserIds,
            removeUserIds
          })
        });
        if (!memberResponse.ok) {
          console.error('Failed to update group members');
        }
      }
      toast.success(isEditing ? SUCCESS_MESSAGES.GROUP_UPDATED : SUCCESS_MESSAGES.GROUP_CREATED);
      navigate('/admin/groups');
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error(isEditing ? ERROR_MESSAGES.GROUP_UPDATE_FAILED : ERROR_MESSAGES.GROUP_CREATE_FAILED);
    } finally {
      setLoading(false);
    }
  };
  if (pageLoading) {
    return <PageContent className="create-page" view="CreateGroup">
        <Toolbar className="cz-context-bar"></Toolbar>
        <div className="create-page-content">Loading group…</div>
      </PageContent>;
  }
  return <PageContent className="create-page" view="CreateGroup">
      <Toolbar className="cz-context-bar"><ActionButton className="btn-back" type="button" onClick={() => navigate('/admin/groups')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back
        </ActionButton></Toolbar>

      <div className="create-page-content">
        <form onSubmit={handleSubmit} className="create-form">
          {formPage === 1 ? <>
              <Panel className="form-section">
                <h2>Group Details</h2>

                <FieldGroup className="form-group">
                  <label>
                    Group Name <span className="required">*</span>
                  </label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className={errors.name ? 'error' : ''} placeholder="e.g., CSE 2024 Batch A" />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </FieldGroup>

                <FieldGroup className="form-group">
                  <label>
                    College Name <span className="required">*</span>
                  </label>
                  <select name="college_name" value={formData.college_name} onChange={handleChange} className={errors.college_name ? 'error' : ''} disabled={isEditing}>
                    <option value="">Select College</option>
                    {institutions.map(inst => <option key={inst.id || inst.name} value={inst.name}>
                        {inst.name}
                      </option>)}
                  </select>
                  {errors.college_name && <span className="error-text">{errors.college_name}</span>}
                  {isEditing && <span className="info-text">College cannot be changed in edit mode</span>}
                  {institutions.length === 0 && <small className="help-inline">No institutions available. Please create an institution first.</small>}
                </FieldGroup>

                <FieldGroup className="form-group">
                  <label>Degree</label>
                  <ThemedSelect name="degree" value={formData.degree || ''} onChange={handleChange} className="user-styled-select" options={[{
                value: '',
                label: 'Select Degree (optional)'
              }, ...(formData.degree && !catalogDegrees.some(d => d.name === formData.degree) ? [{
                value: formData.degree,
                label: `${formData.degree} (current)`
              }] : []), ...catalogDegrees.map(d => ({
                value: d.name,
                label: d.name
              }))]} />
                </FieldGroup>

                <FieldGroup className="form-group">
                  <label>Department</label>
                  <ThemedSelect name="department" value={formData.department || ''} onChange={handleChange} className="user-styled-select" options={[{
                value: '',
                label: 'Select Department (optional)'
              }, ...(formData.department && !catalogDepartments.some(d => d.name === formData.department) ? [{
                value: formData.department,
                label: `${formData.department} (current)`
              }] : []), ...catalogDepartments.map(d => ({
                value: d.name,
                label: d.name
              }))]} />
                </FieldGroup>

                <FieldGroup className="form-group">
                  <label>Passout Year</label>
                  <input type="number" name="passout_year" value={formData.passout_year} onChange={handleChange} placeholder="e.g., 2024" min="2000" max="2100" />
                </FieldGroup>
              </Panel>

              <div className="form-actions">
                <ActionButton type="button" className="btn-secondary" onClick={() => navigate('/admin/groups')}>
                  Cancel
                </ActionButton>
                <ActionButton type="submit" className="btn-primary">
                  Next
                </ActionButton>
              </div>
            </> : <>
              <Panel className="form-section">
                <h2>Select Students for Group</h2>
                <p className="group-info">
                  <strong>Group:</strong> {formData.name} | <strong>College:</strong> {formData.college_name}
                </p>
              </Panel>

              <div className="student-selection-container">
                <div className="student-list-panel">
                  <div className="student-list-header">
                    <h3>Available Students ({filteredLeftStudents.length})</h3>
                    {filteredLeftStudents.length > 0 && <label className="select-all-checkbox">
                        <input type="checkbox" checked={allLeftSelected} ref={input => {
                    if (input) input.indeterminate = someLeftSelected;
                  }} onChange={handleSelectAllLeft} />
                        <span>Select All</span>
                      </label>}
                  </div>
                  <input type="text" placeholder="Search students..." value={searchLeft} onChange={e => setSearchLeft(e.target.value)} className="search-input" />
                  <div className="student-list">
                    {paginatedLeftStudents.map(student => <div key={student.id} className={`student-item ${selectedStudentIds.includes(student.id) ? 'selected' : ''}`} onClick={() => toggleStudentSelection(student.id)}>
                        <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onClick={e => e.stopPropagation()} onChange={() => toggleStudentSelection(student.id)} />
                        <div>
                          <div className="student-name">{student.name}</div>
                          <div className="student-email">{student.email}</div>
                        </div>
                      </div>)}
                    {paginatedLeftStudents.length === 0 && <div className="empty-state">No students available</div>}
                  </div>
                  {filteredLeftStudents.length > 0 && <div className="student-list-pagination">
                      <Pagination currentPage={leftPage} pageSize={leftPageSize} totalCount={filteredLeftStudents.length} itemName="students" onPageChange={setLeftPage} onPageSizeChange={setLeftPageSize} pageSizeOptions={[5, 10, 20, 50]} />
                    </div>}
                </div>

                <div className="transfer-buttons">
                  <ActionButton type="button" className="btn-transfer" onClick={handleMoveToRight} disabled={selectedStudentIds.filter(sid => availableStudents.some(s => s.id === sid)).length === 0}>
                    →
                  </ActionButton>
                  <ActionButton type="button" className="btn-transfer" onClick={handleMoveToLeft} disabled={selectedStudentIds.filter(sid => groupStudents.some(s => s.id === sid)).length === 0}>
                    ←
                  </ActionButton>
                </div>

                <div className="student-list-panel">
                  <div className="student-list-header">
                    <h3>Selected Students ({filteredRightStudents.length})</h3>
                    {filteredRightStudents.length > 0 && <label className="select-all-checkbox">
                        <input type="checkbox" checked={allRightSelected} ref={input => {
                    if (input) input.indeterminate = someRightSelected;
                  }} onChange={handleSelectAllRight} />
                        <span>Select All</span>
                      </label>}
                  </div>
                  <input type="text" placeholder="Search students..." value={searchRight} onChange={e => setSearchRight(e.target.value)} className="search-input" />
                  <div className="student-list">
                    {paginatedRightStudents.map(student => <div key={student.id} className={`student-item ${selectedStudentIds.includes(student.id) ? 'selected' : ''}`} onClick={() => toggleStudentSelection(student.id)}>
                        <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onClick={e => e.stopPropagation()} onChange={() => toggleStudentSelection(student.id)} />
                        <div>
                          <div className="student-name">{student.name}</div>
                          <div className="student-email">{student.email}</div>
                        </div>
                      </div>)}
                    {paginatedRightStudents.length === 0 && <div className="empty-state">No students selected</div>}
                  </div>
                  {filteredRightStudents.length > 0 && <div className="student-list-pagination">
                      <Pagination currentPage={rightPage} pageSize={rightPageSize} totalCount={filteredRightStudents.length} itemName="students" onPageChange={setRightPage} onPageSizeChange={setRightPageSize} pageSizeOptions={[5, 10, 20, 50]} />
                    </div>}
                </div>
              </div>

              <div className="form-actions">
                <ActionButton type="button" className="btn-secondary" onClick={handleBackToPage1}>
                  Back
                </ActionButton>
                <ActionButton type="submit" className="btn-primary" disabled={loading}>
                  {loading ? isEditing ? 'Updating...' : 'Creating...' : isEditing ? 'Update Group' : 'Create Group'}
                </ActionButton>
              </div>
            </>}
        </form>
      </div>
    </PageContent>;
}
export default CreateGroup;
