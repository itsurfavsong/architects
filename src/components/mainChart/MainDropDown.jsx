import { useEffect, useRef } from 'react';
import './MainDropDown.css';

function MainDropDown({ title, options = [], onOptionSelect, variant, isOpen, toggleDropdown }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (isOpen) {
          toggleDropdown();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, toggleDropdown]);

  const handleOptionClick = (option) => {
    if (onOptionSelect) {
      onOptionSelect(option);
    }
    toggleDropdown(); // prop으로 받은 toggleDropdown 호출
  };

  const dropdownClassName = `dropdown ${variant ? `dropdown-${variant}` : ''}`;

  return (
    <div className={dropdownClassName} ref={dropdownRef}>
      <div onClick={toggleDropdown} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="dropdown-title">{title}</span>

        <img
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXCAYAAADgKtSgAAAAk0lEQVR4AexRgQmAMAwbXuIpeol6iaeol+gpnmIyHAzpuiEoDCqNSJOmJTbuw8fMxXAtlvpiacWT76b2Qzm4Q9cBUpFfQKR4p5mfGJyAGXgaBOMN3AGIpZlzQFoQG68UpZAz51y8YESDUfBi1Rg6NRbyAWHBgEaRMXTF5tRyQY+P7MXQ+CqJxQvfvMxcTM1i+T+WCwAA//+da/46AAAABklEQVQDANDhEy/yKBSrAAAAAElFTkSuQmCC"
          alt="toggle-dropdown"
          className="dropdown-icon"
        />
      </div>

      {isOpen && (
        <div className="dropdown-content">
          {options?.map((option, index) => (
            <button
              key={index}
              type="button"
              className="dropdown-option"
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default MainDropDown;
