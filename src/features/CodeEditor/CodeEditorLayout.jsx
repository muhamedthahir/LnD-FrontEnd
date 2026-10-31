import ResizeHandle from '../../design/ResizeHandle';
import ThemeSwitch from '../../design/ThemeSwitch';
import { PageContent, Toolbar } from "../../design/Primitives";
import { createViewStyles } from "../../design/viewStyles";
const styles = createViewStyles("CodeEditorLayout");
import { useState, useRef } from 'react';
import CodeEditor from './CodeEditor';
function CodeEditorLayout() {
  const [leftPanelWidth, setLeftPanelWidth] = useState(40);
  const containerRef = useRef(null);
  const [questionData] = useState({
    title: 'Two Sum',
    difficulty: 'Easy',
    description: `
      <h3>Problem Description</h3>
      <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>
      <p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p>
      <p>You can return the answer in any order.</p>

      <h4>Example 1:</h4>
      <pre tabindex="0"><code>Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].</code></pre>

      <h4>Example 2:</h4>
      <pre tabindex="0"><code>Input: nums = [3,2,4], target = 6
Output: [1,2]</code></pre>

      <h4>Example 3:</h4>
      <pre tabindex="0"><code>Input: nums = [3,3], target = 6
Output: [0,1]</code></pre>

      <h4>Constraints:</h4>
      <ul>
        <li>2 ≤ nums.length ≤ 10<sup>4</sup></li>
        <li>-10<sup>9</sup> ≤ nums[i] ≤ 10<sup>9</sup></li>
        <li>-10<sup>9</sup> ≤ target ≤ 10<sup>9</sup></li>
        <li>Only one valid answer exists.</li>
      </ul>
    `
  });
  const getDifficultyClass = difficulty => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return styles.difficultyEasy;
      case 'medium':
        return styles.difficultyMedium;
      case 'hard':
        return styles.difficultyHard;
      default:
        return '';
    }
  };
  return <PageContent className={styles.codeEditorLayout} ref={containerRef} view="CodeEditorLayout">
      {}
      <div className={styles.questionPanel} style={{
      width: `${leftPanelWidth}%`
    }}>
        <Toolbar className="cz-context-bar"><ThemeSwitch /><h1 className={`${styles.questionTitle} cz-session-title`}>{questionData.title}</h1><span className={`${styles.difficultyBadge} ${getDifficultyClass(questionData.difficulty)}`}>{questionData.difficulty}</span></Toolbar>
        <div className={styles.questionContent}>
          <div className={styles.questionDescription} dangerouslySetInnerHTML={{
          __html: questionData.description
        }} />
        </div>
      </div>

      {}
      <ResizeHandle containerRef={containerRef} value={leftPanelWidth} onChange={setLeftPanelWidth} label="Resize problem panel" className={styles.verticalResizer}>
        <div className={styles.resizerHandle}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </ResizeHandle>

      {}
      <div className={styles.editorPanel} style={{
      width: `${100 - leftPanelWidth}%`
    }}>
        <CodeEditor />
      </div>
    </PageContent>;
}
export default CodeEditorLayout;
