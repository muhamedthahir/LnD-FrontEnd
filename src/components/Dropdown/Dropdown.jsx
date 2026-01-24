import { useState, useRef, useEffect } from 'react'
import styles from './Dropdown.module.css'

function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  label = '',
  disabled = false,
  required = false,
  error = '',
  searchable = false,
  multiple = false,
  className = '',
  renderOption = null, // Custom option renderer
  valueKey = 'id',
  labelKey = 'name',
  onCreateNew = null // Callback for creating new items (e.g., tags)
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  const getOptionValue = (option) => {
    if (typeof option === 'object') {
      return option[valueKey]
    }
    return option
  }

  const getOptionLabel = (option) => {
    if (typeof option === 'object') {
      return option[labelKey]
    }
    return option
  }

  const filteredOptions = searchable && searchTerm
    ? options.filter(option => 
        getOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  // Check if search term doesn't match any existing option (for creating new tags)
  const hasExactMatch = searchTerm && filteredOptions.some(option => 
    getOptionLabel(option).toLowerCase() === searchTerm.toLowerCase().trim()
  )
  const showCreateOption = onCreateNew && searchTerm && searchTerm.trim() && !hasExactMatch

  const getSelectedLabel = () => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder
      const selectedLabels = value.map(v => {
        const option = options.find(opt => getOptionValue(opt) === v)
        return option ? getOptionLabel(option) : v
      })
      return selectedLabels.join(', ')
    }

    if (value === null || value === undefined || value === '') {
      return placeholder
    }

    const selectedOption = options.find(opt => getOptionValue(opt) === value)
    return selectedOption ? getOptionLabel(selectedOption) : placeholder
  }

  const handleOptionClick = (option) => {
    const optionValue = getOptionValue(option)

    if (multiple) {
      const currentValues = Array.isArray(value) ? value : []
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue]
      onChange(newValues)
    } else {
      onChange(optionValue)
      setIsOpen(false)
      setSearchTerm('')
    }
  }

  const isSelected = (option) => {
    const optionValue = getOptionValue(option)
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue)
    }
    return value === optionValue
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (isOpen) {
        setSearchTerm('')
      }
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange(multiple ? [] : null)
  }

  const hasValue = multiple 
    ? Array.isArray(value) && value.length > 0 
    : value !== null && value !== undefined && value !== ''

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      <div 
        ref={dropdownRef}
        className={`${styles.container} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''} ${error ? styles.error : ''}`}
      >
        <div className={styles.header} onClick={handleToggle}>
          <span className={`${styles.value} ${!hasValue ? styles.placeholder : ''}`}>
            {getSelectedLabel()}
          </span>
          <div className={styles.actions}>
            {hasValue && !disabled && (
              <button 
                type="button" 
                className={styles.clear} 
                onClick={handleClear}
                title="Clear"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
            <svg 
              className={`${styles.arrow} ${isOpen ? styles.open : ''}`}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {isOpen && (
          <div className={styles.menu}>
            {searchable && (
              <div className={styles.search}>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            <div className={styles.options}>
              {showCreateOption && (
                <div
                  className={`${styles.option} ${styles.createOption}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreateNew(searchTerm.trim())
                    setSearchTerm('')
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  <span>Add "{searchTerm.trim()}"</span>
                </div>
              )}
              {filteredOptions.length === 0 && !showCreateOption ? (
                <div className={styles.empty}>No options found</div>
              ) : (
                filteredOptions.map((option, index) => (
                  <div
                    key={getOptionValue(option) || index}
                    className={`${styles.option} ${isSelected(option) ? styles.selected : ''}`}
                    onClick={() => handleOptionClick(option)}
                  >
                    {multiple && (
                      <span className={`${styles.checkbox} ${isSelected(option) ? styles.checked : ''}`}>
                        {isSelected(option) && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </span>
                    )}
                    {renderOption ? renderOption(option) : getOptionLabel(option)}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}

export default Dropdown




