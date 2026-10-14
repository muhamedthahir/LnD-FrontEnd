import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
function AssessmentAdministration() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/admin/assessments/management');
  }, [navigate]);
  return null;
}
export default AssessmentAdministration;
