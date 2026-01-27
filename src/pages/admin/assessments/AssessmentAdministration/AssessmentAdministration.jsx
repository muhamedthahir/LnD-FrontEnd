import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function AssessmentAdministration() {
  const navigate = useNavigate()
  
  useEffect(() => {
    // Redirect to assessment configurations list
    // Since we don't have a specific assessment ID, redirect to assessments management
    navigate('/admin/assessments/management')
  }, [navigate])
  
  return null
}

export default AssessmentAdministration

