import { ActionButton, DataTable, FieldGroup, PageContent } from "../../../design/Primitives";
import { DialogLayer, DialogSurface } from "../../../design/Dialog";
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { invalidateMasterData } from '../../../store/masterDataSlice';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useApi } from '../../../contexts/ApiContext';
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal';
const MASTER_DATA_CONFIG = {
  levels: {
    name: 'Levels',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>,
    endpoint: '/api/master-data/levels',
    fields: [{
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true
    }, {
      key: 'description',
      label: 'Description',
      type: 'textarea'
    }, {
      key: 'rank',
      label: 'Rank',
      type: 'number'
    }],
    dataKey: 'levels'
  },
  statuses: {
    name: 'Statuses',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>,
    endpoint: '/api/master-data/statuses',
    fields: [{
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true
    }, {
      key: 'description',
      label: 'Description',
      type: 'textarea'
    }],
    dataKey: 'statuses'
  },
  questionTypes: {
    name: 'Question Types',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>,
    endpoint: '/api/master-data/question-types',
    fields: [{
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true
    }, {
      key: 'description',
      label: 'Description',
      type: 'textarea'
    }],
    dataKey: 'questionTypes'
  },
  languages: {
    name: 'Languages',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>,
    endpoint: '/api/master-data/languages',
    fields: [{
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true
    }, {
      key: 'description',
      label: 'Description',
      type: 'textarea'
    }, {
      key: 'current_version',
      label: 'Current Version',
      type: 'text'
    }, {
      key: 'is_active',
      label: 'Active',
      type: 'checkbox'
    }],
    dataKey: 'languages'
  },
  categories: {
    name: 'Categories',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>,
    endpoint: '/api/master-data/categories',
    fields: [{
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true
    }, {
      key: 'description',
      label: 'Description',
      type: 'textarea'
    }, {
      key: 'active',
      label: 'Active',
      type: 'checkbox'
    }],
    dataKey: 'categories'
  },
  tags: {
    name: 'Tags',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>,
    endpoint: '/api/master-data/tags',
    fields: [{
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true
    }, {
      key: 'color',
      label: 'Color',
      type: 'color'
    }],
    dataKey: 'tags'
  },
  userRoles: {
    name: 'User Roles',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>,
    endpoint: '/api/master-data/user-roles',
    fields: [{
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true
    }, {
      key: 'description',
      label: 'Description',
      type: 'textarea'
    }, {
      key: 'role_rank',
      label: 'Rank',
      type: 'number'
    }],
    dataKey: 'userRoles'
  }
};
function Settings() {
  const {
    user
  } = useOutletContext();
  const {
    apiBaseUrl,
    accessToken
  } = useApi();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('levels');
  const singularName = { levels: 'Level', statuses: 'Status', questionTypes: 'Question Type', languages: 'Language', categories: 'Category', tags: 'Tag', userRoles: 'User Role' }[activeTab];
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  useEffect(() => {
    if (user && user.role !== 'primary_admin' && user.role !== 'campuszen_admin') {
      toast.error('Access denied. Platform admin only.');
      navigate('/dashboard');
    }
  }, [user, navigate]);
  useEffect(() => {
    fetchData();
  }, [activeTab]);
  const getToken = () => accessToken || localStorage.getItem('accessToken');
  const fetchData = async () => {
    try {
      setLoading(true);
      const config = MASTER_DATA_CONFIG[activeTab];
      const includeInactive = activeTab === 'languages' || activeTab === 'categories';
      const response = await fetch(`${apiBaseUrl}${config.endpoint}${includeInactive ? '?includeInactive=true' : ''}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setData(prev => ({
          ...prev,
          [activeTab]: result[config.dataKey] || []
        }));
      } else {
        toast.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };
  const handleCreate = () => {
    const config = MASTER_DATA_CONFIG[activeTab];
    const initialData = {};
    config.fields.forEach(field => {
      if (field.type === 'checkbox') {
        initialData[field.key] = true;
      } else if (field.type === 'number') {
        initialData[field.key] = 0;
      } else {
        initialData[field.key] = '';
      }
    });
    setFormData(initialData);
    setIsEditing(false);
    setSelectedItem(null);
    setShowModal(true);
  };
  const handleEdit = item => {
    setFormData({
      ...item
    });
    setIsEditing(true);
    setSelectedItem(item);
    setShowModal(true);
  };
  const handleDelete = item => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };
  const handleChange = e => {
    const {
      name,
      value,
      type,
      checked
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) || 0 : value
    }));
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Name is required');
      return;
    }
    setActionLoading(true);
    try {
      const config = MASTER_DATA_CONFIG[activeTab];
      const url = isEditing ? `${apiBaseUrl}${config.endpoint}/${selectedItem.id}` : `${apiBaseUrl}${config.endpoint}`;
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ ...formData, name: formData.name.trim() })
      });
      if (response.ok) {
        toast.success(isEditing ? 'Updated successfully' : 'Created successfully');
        dispatch(invalidateMasterData());
        setShowModal(false);
        fetchData();
      } else {
        const result = await response.json();
        toast.error(result.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Operation failed');
    } finally {
      setActionLoading(false);
    }
  };
  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    setActionLoading(true);
    try {
      const config = MASTER_DATA_CONFIG[activeTab];
      const response = await fetch(`${apiBaseUrl}${config.endpoint}/${selectedItem.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        }
      });
      if (response.ok) {
        toast.success('Deleted successfully');
        dispatch(invalidateMasterData());
        setShowDeleteModal(false);
        setSelectedItem(null);
        fetchData();
      } else {
        const result = await response.json();
        toast.error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Delete failed');
    } finally {
      setActionLoading(false);
    }
  };
  const renderTableHeaders = () => {
    const config = MASTER_DATA_CONFIG[activeTab];
    return <tr>
        <th>ID</th>
        {config.fields.map(field => <th key={field.key}>{field.label}</th>)}
        <th>Actions</th>
      </tr>;
  };
  const renderTableRow = item => {
    const config = MASTER_DATA_CONFIG[activeTab];
    const isCoreRole = activeTab === 'userRoles' && ['primary_admin', 'campuszen_admin', 'college_admin', 'student'].includes(item.name);
    return <tr key={item.id}>
        <td>{item.id}</td>
        {config.fields.map(field => <td key={field.key}>
            {field.type === 'checkbox' ? <span className={`status-indicator ${item[field.key] ? 'active' : 'inactive'}`}>
                {item[field.key] ? 'Yes' : 'No'}
              </span> : field.type === 'color' ? <div className="color-preview" style={{
          backgroundColor: item[field.key] || '#6366f1'
        }}>
                {item[field.key] || '#6366f1'}
              </div> : item[field.key] ?? '-'}
          </td>)}
        <td>
          <div className="action-buttons">
            <ActionButton className="btn-icon edit" onClick={() => handleEdit(item)} title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </ActionButton>
            {!isCoreRole && <ActionButton className="btn-icon delete" onClick={() => handleDelete(item)} title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </ActionButton>}
          </div>
        </td>
      </tr>;
  };
  const config = MASTER_DATA_CONFIG[activeTab];
  const currentData = data[activeTab] || [];
  return <PageContent className="settings-page" view="Settings">


      <div className="settings-content">
        {}
        <aside className="settings-sidebar">
          <nav className="settings-nav">
            {Object.entries(MASTER_DATA_CONFIG).map(([key, value]) => <ActionButton key={key} className={`nav-item ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
                {value.icon}
                <span>{value.name}</span>
              </ActionButton>)}
          </nav>
        </aside>

        {}
        <section className="settings-main">
          <div className="content-header">
            <h2>{config.name}</h2>
            <ActionButton className="btn-primary" onClick={handleCreate}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add {singularName}
            </ActionButton>
          </div>

          <div className="table-container">
            {loading ? <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading...</p>
              </div> : currentData.length === 0 ? <div className="empty-state">
                {config.icon}
                <h3>No {config.name} Found</h3>
                <p>Get started by creating your first {singularName.toLowerCase()}.</p>
                <ActionButton className="btn-primary" onClick={handleCreate}>
                  Add {singularName}
                </ActionButton>
              </div> : <DataTable className="data-table">
                <thead>
                  {renderTableHeaders()}
                </thead>
                <tbody>
                  {currentData.map(item => renderTableRow(item))}
                </tbody>
              </DataTable>}
          </div>
        </section>
      </div>

      {}
      {showModal && <DialogLayer className="modal-overlay" onClick={() => setShowModal(false)} busy={actionLoading}>
          <DialogSurface className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{isEditing ? 'Edit' : 'Add'} {singularName}</h2>
            <form onSubmit={handleSubmit}>
              {config.fields.map(field => <FieldGroup className="form-group settings" key={field.key}>
                  <label>
                    {field.label} {field.required && '*'}
                  </label>
                  {field.type === 'textarea' ? <textarea name={field.key} value={formData[field.key] || ''} onChange={handleChange} rows="3" /> : field.type === 'checkbox' ? <label className="checkbox-label">
                      <input type="checkbox" name={field.key} checked={formData[field.key] || false} onChange={handleChange} />
                      <span>{field.label}</span>
                    </label> : field.type === 'color' ? <FieldGroup className="color-input-group">
                      <input type="color" aria-label="Color picker" name={field.key} value={formData[field.key] || '#6366f1'} onChange={handleChange} />
                      <input type="text" aria-label="Color hex code" pattern="#[0-9a-fA-F]{6}" title="Use a six-digit hex color, for example #2457e6" value={formData[field.key] || '#6366f1'} onChange={e => setFormData(prev => ({
                ...prev,
                [field.key]: e.target.value
              }))} placeholder="#6366f1" />
                    </FieldGroup> : <input type={field.type} name={field.key} value={formData[field.key] ?? ''} onChange={handleChange} required={field.required} />}
                </FieldGroup>)}
              <div className="form-actions">
                <ActionButton type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                </ActionButton>
                <ActionButton type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </ActionButton>
              </div>
            </form>
          </DialogSurface>
        </DialogLayer>}

      {}
      <ConfirmModal isOpen={showDeleteModal} onClose={() => {
      setShowDeleteModal(false);
      setSelectedItem(null);
    }} onConfirm={handleDeleteConfirm} title={`Delete ${singularName}`} message={`Are you sure you want to delete "${selectedItem?.name}"? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" />
    </PageContent>;
}
export default Settings;
