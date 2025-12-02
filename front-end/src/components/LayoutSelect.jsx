import React, { useState, useRef, useEffect } from 'react';
import './LayoutSelect.css';

const LayoutSelect = ({ options = [], value, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const handleToggle = () => setOpen((v) => !v);
  const handleSelect = (val) => {
    if (onChange) onChange(val);
    setOpen(false);
  };

  const currentLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div className="layout-select-wrapper" ref={ref}>
      {label && <div className="layout-select-label">{label}</div>}
      <button type="button" className="layout-select-btn" onClick={handleToggle} aria-haspopup="listbox" aria-expanded={open}>
        <span className="layout-select-current">{currentLabel}</span>
        <span className="layout-select-caret">▾</span>
      </button>

      {open && (
        <ul className="layout-select-list" role="listbox">
          {options.map(opt => (
            <li key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                className={`layout-select-item ${opt.value === value ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.value)}>
              <div className="layout-select-item-label">{opt.label}</div>
              <div className="layout-select-item-value">{opt.value}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LayoutSelect;
