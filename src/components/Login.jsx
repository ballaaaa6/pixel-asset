import React, { useState } from "react";
import { LogIn, User, Lock, Eye, EyeOff } from "lucide-react";
import retroMascot from "../assets/retro-mascot.png";

export default function Login({ onLoginSuccess, onNavigateToRegister, showToast }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const autoLoginAttemptedRef = React.useRef(false);

  React.useEffect(() => {
    if (autoLoginAttemptedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const autoUsername = params.get("username");
    const autoPassword = params.get("password");

    if (autoUsername && autoPassword) {
      autoLoginAttemptedRef.current = true;
      setLoading(true);

      (async () => {
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: autoUsername, password: autoPassword }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "ล็อกอินไม่สำเร็จ");
          }

          localStorage.setItem("portfolio_user", JSON.stringify(data));
          showToast("ยินดีต้อนรับกลับเข้าสู่ระบบ!", "success");
          onLoginSuccess(data);
        } catch (err) {
          showToast(err.message, "error");
          setLoading(false);
        }
      })();
    }
  }, [onLoginSuccess, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ล็อกอินไม่สำเร็จ");
      }

      // Save user session in localStorage to enable Auto-Login
      localStorage.setItem("portfolio_user", JSON.stringify(data));
      showToast("ยินดีต้อนรับกลับเข้าสู่ระบบ!", "success");

      // Trigger parent handler to display dashboard
      onLoginSuccess(data);

    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper fade-in">
      <div className="auth-card">
        {/* App Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <img 
            src={retroMascot} 
            alt="RetroStock Mascot" 
            style={{ width: 110, height: 110, imageRendering: "pixelated", border: "4px solid #000000", boxShadow: "4px 4px 0px #000" }} 
          />
        </div>
        
        <h1 className="auth-title">ยินดีต้อนรับสู่ RetroStock Vault</h1>
        <p className="auth-subtitle">ระบบติดตามพอร์ตสินทรัพย์ 8-bit อัจฉริยะ</p>

        <form onSubmit={handleSubmit}>
          {/* Username Input */}
          <div className="form-group">
            <label className="form-label">ชื่อผู้ใช้งาน</label>
            <div style={{ position: "relative" }}>
              <User size={18} className="input-icon" />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: "48px" }}
                placeholder="กรอกชื่อผู้ใช้ (เช่น admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group" style={{ marginBottom: "32px" }}>
            <label className="form-label">รหัสผ่าน</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                style={{ paddingLeft: "48px", paddingRight: "48px" }}
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="input-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบทันที"}
            {!loading && <LogIn size={18} />}
          </button>
        </form>

        {/* Navigation to Register */}
        <div style={{ marginTop: "24px", fontSize: "14px", color: "#64748B" }}>
          ยังไม่มีบัญชีใช้งานพอร์ต?{" "}
          <button 
            type="button" 
            className="btn-text" 
            onClick={onNavigateToRegister}
            disabled={loading}
          >
            สมัครสมาชิกใหม่ที่นี่
          </button>
        </div>
      </div>
    </div>
  );
}
