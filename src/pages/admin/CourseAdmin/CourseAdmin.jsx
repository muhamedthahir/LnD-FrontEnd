import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import '../UserAdmin/UserAdmin.css'

function CourseAdmin() {
  const { user } = useOutletContext()

  return (
    <div className="user-admin-page">
      <div className="user-admin-header">
        <div>
          <h1>Course Administration</h1>
          <p>Administrative functions for course management</p>
        </div>
      </div>
      <div className="users-table-card">
        <p>Course administration features coming soon...</p>
      </div>
    </div>
  )
}

export default CourseAdmin
