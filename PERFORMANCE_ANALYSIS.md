# Performance Analysis & Recommendations

## Issue: Question Bank, Questions, Courses, and Institutions Taking Time to Fetch

### Identified Causes

#### 1. **Multiple Redundant API Calls (Master Data)**
   - **Problem**: Master data (levels, statuses, question types, languages, categories, tags) was being fetched every time a component mounted, even when creating multiple questions.
   - **Solution Implemented**: Created Redux store with `masterDataSlice.js` to cache master data after login. Data is loaded once and reused across components.

#### 2. **N+1 Query Problem in Backend**
   - **Problem**: In `Question.js` model, after fetching questions, the code loops through each question to fetch tags individually:
   ```javascript
   for (const question of rows) {
     question.tags = await this.getTags(question.id);
   }
   ```
   - **Recommendation**: Use a single JOIN query or batch fetch tags for all questions at once:
   ```sql
   SELECT q.id, GROUP_CONCAT(t.name) as tags 
   FROM questions q 
   LEFT JOIN question_tags qt ON q.id = qt.question_id
   LEFT JOIN tags t ON qt.tag_id = t.id
   GROUP BY q.id
   ```

#### 3. **Large Result Sets Without Proper Indexing**
   - **Recommendation**: Ensure database indexes exist on:
     - `questions.question_bank_id`
     - `questions.question_type_id`
     - `questions.level_id`
     - `questions.status_id`
     - `questions.category_id`
     - `questions.created_at` (for ORDER BY)
     - `question_banks.institution_id`
     - `courses.institution_id`
     - `users.institution_id`

   ```sql
   -- Add indexes
   CREATE INDEX idx_questions_bank ON questions(question_bank_id);
   CREATE INDEX idx_questions_type ON questions(question_type_id);
   CREATE INDEX idx_questions_level ON questions(level_id);
   CREATE INDEX idx_questions_status ON questions(status_id);
   CREATE INDEX idx_questions_created ON questions(created_at DESC);
   CREATE INDEX idx_qbanks_institution ON question_banks(institution_id);
   CREATE INDEX idx_courses_institution ON courses(institution_id);
   ```

#### 4. **No Server-Side Caching**
   - **Recommendation**: Implement Redis or in-memory caching for:
     - Master data (levels, statuses, etc.) - changes rarely
     - Institution list - changes rarely
     - Question bank list - cached with short TTL

#### 5. **Inefficient COUNT Query**
   - **Problem**: The original count query used regex replacement which could break with complex SELECT clauses.
   - **Solution Implemented**: Fixed the query construction in `Question.js` to build count and data queries separately.

#### 6. **Frontend Not Paginating Properly**
   - **Current**: Already using pagination (good!)
   - **Recommendation**: Consider virtual scrolling for very large datasets using libraries like `react-window` or `@tanstack/react-virtual`

### Additional Performance Optimizations

#### Backend Recommendations:

1. **Enable MySQL Query Cache** (if using MySQL < 8.0):
   ```sql
   SET GLOBAL query_cache_size = 1048576;
   SET GLOBAL query_cache_type = ON;
   ```

2. **Optimize JOINs with EXPLAIN**:
   ```sql
   EXPLAIN SELECT q.*, qt.name as question_type_name, ...
   FROM questions q
   LEFT JOIN question_types qt ON q.question_type_id = qt.id
   ...
   ```

3. **Connection Pooling**: Ensure the database connection pool is properly configured:
   ```javascript
   const pool = mysql.createPool({
     connectionLimit: 10,
     waitForConnections: true,
     queueLimit: 0
   });
   ```

4. **Implement Response Compression**:
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

#### Frontend Recommendations:

1. **Debounce Search Input** (Already implemented - 300ms):
   ```javascript
   useEffect(() => {
     const timer = setTimeout(() => {
       fetchQuestions();
     }, 300);
     return () => clearTimeout(timer);
   }, [search]);
   ```

2. **Implement Request Deduplication**:
   ```javascript
   // Using AbortController to cancel pending requests
   useEffect(() => {
     const controller = new AbortController();
     fetchData({ signal: controller.signal });
     return () => controller.abort();
   }, [dependencies]);
   ```

3. **Lazy Load Components**:
   ```javascript
   const QuestionForm = lazy(() => import('./QuestionForm'));
   const TestCaseManager = lazy(() => import('./TestCaseManager'));
   ```

4. **Memoize Expensive Computations**:
   ```javascript
   const filteredOptions = useMemo(() => 
     options.filter(opt => opt.name.includes(search)),
     [options, search]
   );
   ```

### Metrics to Monitor

1. **API Response Times**: Target < 200ms for list endpoints
2. **Database Query Times**: Target < 50ms per query
3. **Time to First Byte (TTFB)**: Target < 100ms
4. **Frontend Render Time**: Target < 100ms for lists

### Implementation Checklist

- [x] Redux store for master data caching
- [x] Load master data after login
- [x] Fix count query in Question model
- [ ] Add database indexes
- [ ] Implement batch tag fetching
- [ ] Add server-side caching (Redis)
- [ ] Enable response compression
- [ ] Add lazy loading for route components
- [ ] Implement request cancellation

---

## Files Modified

1. `src/store/index.js` - Redux store configuration
2. `src/store/masterDataSlice.js` - Master data state management
3. `src/hooks/useMasterData.js` - Custom hook for master data access
4. `src/main.jsx` - Redux Provider wrapper
5. `src/pages/Login/Login.jsx` - Load master data after login
6. `src/pages/admin/Questions/QuestionForm.jsx` - Use Redux master data
7. `src/pages/admin/Questions/QuestionList.jsx` - Use Redux master data
8. `LnD-Backend/models/Question.js` - Fixed count query construction

