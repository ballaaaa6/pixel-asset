import React, { useState } from "react";
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, X, LogOut, Settings, Grid, Compass, Building } from "lucide-react";

export default function Sidebar({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  sidebarOpen,
  setSidebarOpen,
  onLogout,
  user,
  nickname,
  profilePic,
  setInvestorModalOpen,
  setProfileModalOpen
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    { id: "office", label: "จำลองออฟฟิศ", icon: Building },
    { id: "dashboard", label: "แดชบอร์ดพอร์ต", icon: BarChart3 },
    { id: "dividends", label: "ปฏิทินปันผล", icon: CalendarDays },
    { id: "correlation", label: "สหสัมพันธ์ & ความร้อน", icon: Grid },
    { id: "analyzer", label: "วิเคราะห์หุ้นเชิงลึก", icon: Compass }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar-nav ${sidebarCollapsed ? "collapsed" : ""} ${sidebarOpen ? "open" : ""}`}>
        {/* Sidebar Header / User Profile */}
        <div className="sidebar-profile-header">
          {sidebarCollapsed ? (
            <button
              type="button"
              className="sidebar-avatar-only"
              onClick={() => setInvestorModalOpen(true)}
              title="โปรไฟล์นักลงทุน"
            >
              {profilePic ? (
                <img src={profilePic} alt="avatar" className="sidebar-avatar-img" />
              ) : (
                <span className="sidebar-avatar-placeholder">👤</span>
              )}
            </button>
          ) : (
            <>
              <div
                className="sidebar-profile-info"
                onClick={() => setInvestorModalOpen(true)}
                title="โปรไฟล์นักลงทุน"
              >
                {profilePic ? (
                  <img src={profilePic} alt="avatar" className="sidebar-avatar-img" />
                ) : (
                  <span className="sidebar-avatar-placeholder">👤</span>
                )}
                <div className="sidebar-profile-meta">
                  <span className="sidebar-nickname">{nickname || user?.username}</span>
                  <span className="sidebar-user-role">นักลงทุน</span>
                </div>
              </div>
              <button
                type="button"
                className="sidebar-settings-btn ripple-btn"
                onClick={() => setProfileModalOpen(true)}
                title="ตั้งค่า"
              >
                <Settings size={16} />
              </button>
            </>
          )}
          {sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(false)}
              className="sidebar-mobile-close-btn"
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
          {/* Logout Button with Popover */}
          <div className="sidebar-logout-container">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
              className={`sidebar-item logout-btn ${showLogoutConfirm ? "active" : ""}`}
              style={{ color: "var(--loss)" }}
              title={sidebarCollapsed ? "ออกจากระบบ" : undefined}
            >
              <LogOut size={18} />
              <span className="sidebar-item-label">ออกจากระบบ</span>
            </button>

            {showLogoutConfirm && (
              <>
                <div className="logout-popover-backdrop" onClick={() => setShowLogoutConfirm(false)} />
                <div className={`logout-popover ${sidebarCollapsed ? "collapsed-popover" : ""}`}>
                  <div className="logout-popover-arrow" />
                  <p className="logout-popover-text">ยืนยันออกจากระบบ?</p>
                  <div className="logout-popover-actions">
                    <button
                      type="button"
                      className="logout-confirm-btn"
                      onClick={() => {
                        setShowLogoutConfirm(false);
                        onLogout();
                      }}
                    >
                      ใช่, ออกจากระบบ
                    </button>
                    <button
                      type="button"
                      className="logout-cancel-btn"
                      onClick={() => setShowLogoutConfirm(false)}
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

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
