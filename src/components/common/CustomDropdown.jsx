import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

/**
 * CustomDropdown
 * A beautifully styled, accessible, non-native dropdown menu matching the theme.
 */
export function CustomDropdown({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="custom-dropdown-container" ref={containerRef}>
      <button
        type="button"
        className={`custom-dropdown-toggle${isOpen ? " open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown size={14} className="chevron" strokeWidth={2.5} />
      </button>
      <div className={`custom-dropdown-menu${isOpen ? " open" : ""}`}>
        {options.map((opt) => (
          <div
            key={opt.value}
            className={`custom-dropdown-item${value === opt.value ? " active" : ""}`}
            onClick={() => {
              onChange(opt.value);
              setIsOpen(false);
            }}
          >
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
}
