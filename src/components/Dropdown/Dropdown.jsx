import { useState, useRef, useEffect } from 'react'
import './Dropdown.css'

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
  labelKey = 'name'
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
    <div className={`dropdown-wrapper ${className}`}>
      {label && (
        <label className="dropdown-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      <div 
        ref={dropdownRef}
        className={`dropdown-container ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''} ${error ? 'error' : ''}`}
      >
        <div className="dropdown-header" onClick={handleToggle}>
          <span className={`dropdown-value ${!hasValue ? 'placeholder' : ''}`}>
            {getSelectedLabel()}
          </span>
          <div className="dropdown-actions">
            {hasValue && !disabled && (
              <button 
                type="button" 
                className="dropdown-clear" 
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
              className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
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
          <div className="dropdown-menu">
            {searchable && (
              <div className="dropdown-search">
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
            
            <div className="dropdown-options">
              {filteredOptions.length === 0 ? (
                <div className="dropdown-empty">No options found</div>
              ) : (
                filteredOptions.map((option, index) => (
                  <div
                    key={getOptionValue(option) || index}
                    className={`dropdown-option ${isSelected(option) ? 'selected' : ''}`}
                    onClick={() => handleOptionClick(option)}
                  >
                    {multiple && (
                      <span className={`dropdown-checkbox ${isSelected(option) ? 'checked' : ''}`}>
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

      {error && <span className="dropdown-error">{error}</span>}
    </div>
  )
}

export default Dropdown

