import { useState, useRef, useCallback } from 'react'
import CodeEditor from './CodeEditor'
import styles from './CodeEditorLayout.module.css'

function CodeEditorLayout() {
  const [leftPanelWidth, setLeftPanelWidth] = useState(40) // percentage
  const containerRef = useRef(null)
  const isDragging = useRef(false)

  // Sample question data - this will be passed as props or fetched later
  const [questionData] = useState({
    title: 'Two Sum',
    difficulty: 'Easy',
    description: `
      <h3>Problem Description</h3>
      <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>
      <p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p>
      <p>You can return the answer in any order.</p>
      
      <h4>Example 1:</h4>
      <pre><code>Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].</code></pre>
      
      <h4>Example 2:</h4>
      <pre><code>Input: nums = [3,2,4], target = 6
Output: [1,2]</code></pre>
      
      <h4>Example 3:</h4>
      <pre><code>Input: nums = [3,3], target = 6
Output: [0,1]</code></pre>
      
      <h4>Constraints:</h4>
      <ul>
        <li>2 ≤ nums.length ≤ 10<sup>4</sup></li>
        <li>-10<sup>9</sup> ≤ nums[i] ≤ 10<sup>9</sup></li>
        <li>-10<sup>9</sup> ≤ target ≤ 10<sup>9</sup></li>
        <li>Only one valid answer exists.</li>
      </ul>
    `
  })

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    isDragging.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

    // Limit the width between 20% and 80%
    if (newWidth >= 20 && newWidth <= 80) {
      setLeftPanelWidth(newWidth)
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const getDifficultyClass = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return styles.difficultyEasy
      case 'medium': return styles.difficultyMedium
      case 'hard': return styles.difficultyHard
      default: return ''
    }
  }

  return (
    <div className={styles.codeEditorLayout} ref={containerRef}>
      {/* Left Panel - Question/Description */}
      <div 
        className={styles.questionPanel}
        style={{ width: `${leftPanelWidth}%` }}
      >
        <div className={styles.questionHeader}>
          <h1 className={styles.questionTitle}>{questionData.title}</h1>
          <span className={`${styles.difficultyBadge} ${getDifficultyClass(questionData.difficulty)}`}>
            {questionData.difficulty}
          </span>
        </div>
        <div className={styles.questionContent}>
          <div 
            className={styles.questionDescription}
            dangerouslySetInnerHTML={{ __html: questionData.description }}
          />
        </div>
      </div>

      {/* Resizer */}
      <div 
        className={styles.verticalResizer}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.resizerHandle}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Right Panel - Code Editor */}
      <div 
        className={styles.editorPanel}
        style={{ width: `${100 - leftPanelWidth}%` }}
      >
        <CodeEditor />
      </div>
    </div>
  )
}

export default CodeEditorLayout

