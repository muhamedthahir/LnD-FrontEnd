import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Pagination from '../../../components/Pagination/Pagination'
import Table from '../../../components/Table/Table'
import { useApi } from '../../../contexts/ApiContext'
import { API_ENDPOINTS, ERROR_MESSAGES } from '../../../constants/constants'
import { CREATE_INSTITUTION_ROUTE } from './createInstitutionLogic.js'
import '../Users/Users.css'
import './Institutions.css'

function Institutions() {
  const navigate = useNavigate()
  const { apiBaseUrl, accessToken } = useApi()
  const [institutions, setInstitutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const fetchingRef = useRef(false)
  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)

  const fetchInstitutions = useCallback(async (signal) => {
    if (fetchingRef.current || !apiBaseUrl) return

    fetchingRef.current = true
    try {
      setLoading(true)
      const url = new URL(`${apiBaseUrl}${API_ENDPOINTS.INSTITUTIONS.LIST}`)
      if (search) url.searchParams.append('search', search)
      url.searchParams.append('limit', pageSize.toString())
      url.searchParams.append('offset', ((currentPage - 1) * pageSize).toString())

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...((accessToken || localStorage.getItem('accessToken')) && { 'Authorization': `Bearer ${accessToken || localStorage.getItem('accessToken')}` })
        },
        signal
      })

      if (!isMountedRef.current) return

      if (response.ok) {
        const data = await response.json()
        setInstitutions(data.institutions || [])
        setTotalCount(data.total || 0)
      } else {
        toast.error(ERROR_MESSAGES.INSTITUTION_LIST_FAILED)
      }
    } catch (error) {
      if (error.name !== 'AbortError' && isMountedRef.current) {
        console.error('Error fetching institutions:', error)
        toast.error(ERROR_MESSAGES.INSTITUTION_LIST_FAILED)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
      fetchingRef.current = false
    }
  }, [apiBaseUrl, accessToken, search, currentPage, pageSize])

  useEffect(() => {
    isMountedRef.current = true

    const controller = new AbortController()
    abortControllerRef.current = controller

    fetchInstitutions(controller.signal)

    return () => {
      isMountedRef.current = false
      controller.abort()
    }
  }, [fetchInstitutions])

  return (
    <div className="user-admin-page">
      <div className="user-admin-header">
        <div>
          <h1>Institutions Management</h1>
          <p>Create and manage colleges/institutions</p>
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() => navigate(CREATE_INSTITUTION_ROUTE)}
        >
          + Create Institution
        </button>
      </div>

      <div className="users-table-card">
        <div className="table-container">
          <div className="filters-section">
            <div className="filters institutions-filters">
              <div className="filter-group">
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Search institutions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                />
              </div>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="btn-clear-filters institutions-btn-clear-filters"
                  title="Clear search"
                >
                  <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                    <path d="M899.1 869.6l-53-305.6H864c14.4 0 26-11.6 26-26V346c0-14.4-11.6-26-26-26H618V138c0-14.4-11.6-26-26-26H432c-14.4 0-26 11.6-26 26v182H160c-14.4 0-26 11.6-26 26v192c0 14.4 11.6 26 26 26h17.9l-53 305.6a25.95 25.95 0 0025.6 30.4h723c1.5 0 3-.1 4.4-.4a25.88 25.88 0 0021.2-30zM204 390h272V182h72v208h272v104H204V390zm468 440V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H416V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H202.8l45.1-260H776l45.1 260H672z"></path>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="table-inner-box">
            {loading ? (
              <div className="loading">Loading institutions...</div>
            ) : institutions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                </div>
                <h3>No Institutions Found</h3>
                <p>Get started by creating your first institution or college.</p>
              </div>
            ) : (
              <Table variant="embedded">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="actions-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map((institution) => (
                    <tr key={institution.id}>
                      <td>{institution.name}</td>
                      <td>
                        <span className={`institution-status-badge ${institution.status === 'inactive' ? 'inactive' : 'active'}`}>
                          {institution.status === 'inactive' ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td>{new Date(institution.created_at).toLocaleDateString()}</td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            type="button"
                            onClick={() => navigate(`/admin/institutions/${institution.id}`)}
                            title="View institution"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
          {!loading && totalCount > 0 && (
            <div className="pagination-wrapper">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalCount={totalCount}
                itemName="institutions"
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Institutions
