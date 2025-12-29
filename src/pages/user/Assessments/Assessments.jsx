import { useState } from 'react'
import '../Courses/Courses.css'

function Assessments() {
  return (
    <div className="courses-page">
      <div className="courses-header">
        <h1>Assessments</h1>
        <p>View and manage your assessments</p>
      </div>
      <div className="courses-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <h3>No assessments available</h3>
        <p>Assessments will appear here once they are assigned to you.</p>
      </div>
    </div>
  )
}

export default Assessments

