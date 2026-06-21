import React from "react";
import { createPortal } from "react-dom";

export default function RetroWindow({ title, onClose, children }) {
  const content = (
    <div className="retro-window-overlay" onClick={onClose}>
      <div 
        className="retro-window fade-in" 
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Navy blue header bar */}
        <div className="retro-window-header">
          <div className="retro-window-title">📂 {title}</div>
          <button className="retro-window-close" onClick={onClose}>
            [ X ]
          </button>
        </div>

        {/* Win95 menu bar mock */}
        <div className="retro-window-menu">
          <span><u>F</u>ile</span>
          <span><u>E</u>dit</span>
          <span><u>V</u>iew</span>
          <span><u>H</u>elp</span>
        </div>

        {/* Dark body where stock tracker widgets are rendered */}
        <div className="retro-window-body">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
