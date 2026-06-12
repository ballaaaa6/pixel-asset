import React from "react";
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, X, LogOut } from "lucide-react";

export default function Sidebar({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  sidebarOpen,
  setSidebarOpen,
  handleLogout
}) {
  const menuItems = [
    { id: "dashboard", label: "แดชบอร์ดพอร์ต", icon: BarChart3 },
    { id: "dividends", label: "ปฏิทินปันผล", icon: CalendarDays }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar-nav ${sidebarCollapsed ? "collapsed" : ""} ${sidebarOpen ? "open" : ""}`}>
        {/* Sidebar Header / Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">S</div>
          <span className="sidebar-logo-text">StockVault</span>
          {sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(false)}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 4
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Sidebar Menu Items */}
        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false); // Close on mobile
                }}
                className={`sidebar-item ${isActive ? "active" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon size={18} />
                <span className="sidebar-item-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="sidebar-item"
            style={{ color: "var(--loss)" }}
            title={sidebarCollapsed ? "ออกจากระบบ" : undefined}
          >
            <LogOut size={18} />
            <span className="sidebar-item-label">ออกจากระบบ</span>
          </button>

          {/* Desktop Collapse Toggle Button */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="sidebar-toggle-btn"
            style={{ display: sidebarOpen ? "none" : "flex" }} // Hide on mobile open state
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : (
              <>
                <ChevronLeft size={16} />
                <span>ย่อแถบเมนู</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
