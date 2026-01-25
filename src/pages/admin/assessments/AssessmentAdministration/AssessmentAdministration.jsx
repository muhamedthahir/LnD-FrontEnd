import { useState, useEffect } from 'react'
import styles from './AssessmentAdministration.module.css'

function AssessmentAdministration() {
  return (
    <div className={styles.groupsPage}>
      <div className={styles.groupsHeader}>
        <div>
          <h1>Assessment Administration</h1>
          <p>Manage assessments and evaluations</p>
        </div>
      </div>
      <div className={styles.groupsTableCard}>
        <div className={styles.tableContainer}>
          <div className={styles.emptyState}>
            <p>Assessment administration features coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssessmentAdministration

