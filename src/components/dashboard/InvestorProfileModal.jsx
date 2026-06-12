import React, { useState, useEffect } from "react";
import { X, Eye, Plus, Edit3, Save, Sparkles } from "lucide-react";
import { PRESET_AVATARS } from "../../utils/constants";
import { registerModal } from "../../utils/modalStack";

export default function InvestorProfileModal({
  isOpen, onClose, profilePic, setProfilePic, nickname, firstName, lastName, birthday, traderStyle, experience, riskLevel, portfolioTarget, targetYield, favoriteStock, bio,
  newNickname, setNewNickname, newFirstName, setNewFirstName, newLastName, setNewLastName, newBirthday, setNewBirthday, newTraderStyle, setNewTraderStyle, newExperience, setNewExperience, newRiskLevel, setNewRiskLevel, newPortfolioTarget, setNewPortfolioTarget, newTargetYield, setNewTargetYield, newFavoriteStock, setNewFavoriteStock, newBio, setNewBio,
  handleAvatarUpload, handleSaveProfile, getAge, avatarPreviewOpen, setAvatarPreviewOpen, avatarHovered, setAvatarHovered, presetModalOpen, setPresetModalOpen, askConfirm,
}) {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isOpen) { setIsEditing(false); return; }
    return registerModal(onClose);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (presetModalOpen) return registerModal(() => setPresetModalOpen(false));
  }, [presetModalOpen, setPresetModalOpen]);

  useEffect(() => {
    if (avatarPreviewOpen) return registerModal(() => setAvatarPreviewOpen(false));
  }, [avatarPreviewOpen, setAvatarPreviewOpen]);

  if (!isOpen) return null;

  const getBadge = (exp) => {
    const list = {
      Legend: { bg: "linear-gradient(135deg, #F59E0B, #D97706)", text: "🏆 Legend" },
      Expert: { bg: "linear-gradient(135deg, #3B82F6, #1D4ED8)", text: "🔥 Expert" },
      Intermediate: { bg: "linear-gradient(135deg, #10B981, #047857)", text: "⚡ Intermediate" },
    };
    return list[exp] || { bg: "linear-gradient(135deg, #94A3B8, #475569)", text: "🌱 Beginner" };
  };

  const badge = getBadge(experience);
  const age = getAge();

  return (
    <>
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-content" style={{ maxWidth: 480 }}>
          <div className="modal-header">
            <span className="modal-title">{isEditing ? "📝 แก้ไขข้อมูลโปรไฟล์" : "👤 ข้อมูลนักลงทุน"}</span>
            <button className="btn-close" onClick={onClose}><X size={16} /></button>
          </div>

          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {!isEditing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* ── CARD VIEW ── */}
                <div style={{
                  background: "linear-gradient(135deg, #5236FF 0%, #8E2DE2 50%, #4A00E0 100%)", borderRadius: "24px", padding: "24px", color: "#FFFFFF",
                  boxShadow: "0 12px 24px rgba(82, 54, 255, 0.3)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 16
                }}>
                  <div style={{ position: "absolute", top: "-10%", right: "-10%", width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.1)", pointerEvents: "none" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "1.5px", opacity: 0.9 }}>INVESTOR PASSPORT</span>
                    <span style={{ background: badge.bg, padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 800 }}>{badge.text}</span>
                  </div>

                  <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <div style={{ position: "relative", cursor: "pointer" }} onMouseEnter={() => setAvatarHovered(true)} onMouseLeave={() => setAvatarHovered(false)} onClick={() => profilePic && setAvatarPreviewOpen(true)}>
                      <img src={profilePic || `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 80 80'><rect width='80' height='80' fill='%23FFFFFF' fill-opacity='0.2'/><text x='50%' y='60%' font-size='36' text-anchor='middle' fill='%23FFFFFF'>👤</text></svg>`}
                        alt="avatar" style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.6)" }} />
                      {profilePic && avatarHovered && (
                        <div style={{ position: "absolute", top: 0, left: 0, width: 84, height: 84, borderRadius: "50%", background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}><Eye size={18} color="white" /></div>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                      <span style={{ fontSize: 20, fontWeight: 800 }}>{nickname || "ยังไม่ได้ตั้งชื่อเล่น"}</span>
                      <span style={{ fontSize: 13, opacity: 0.9 }}>{firstName || lastName ? `${firstName} ${lastName}`.trim() : "ยังไม่ได้ตั้งชื่อจริง"}</span>
                      <span style={{ fontSize: 12, opacity: 0.8 }}>🎂 {birthday ? `${birthday} (${age !== null ? `อายุ ${age} ปี` : "ไม่ระบุ"})` : "ยังไม่ได้ตั้งวันเกิด"}</span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "rgba(255, 255, 255, 0.1)", borderRadius: "16px", padding: "12px 16px", border: "1px solid rgba(255, 255, 255, 0.15)", backdropFilter: "blur(5px)" }}>
                    {[
                      { label: "STYLE", val: traderStyle },
                      { label: "RISK TOLERANCE", val: riskLevel },
                      { label: "TARGET PORTFOLIO", val: portfolioTarget ? `${portfolioTarget} THB` : "ไม่ได้ระบุ" },
                      { label: "TARGET YIELD", val: targetYield ? `${targetYield} %/Yr` : "ไม่ได้ระบุ" }
                    ].map(({ label, val }) => (
                      <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 700 }}>{label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{val}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 10, fontStyle: "italic", fontSize: 12, opacity: 0.9, textAlign: "center" }}>
                    "{bio || "ชีวิตการลงทุนที่เรียบง่าย แต่มีวินัย"}"
                  </div>

                  {favoriteStock && (
                    <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.3)", padding: "2px 8px", borderRadius: "8px", fontSize: 11, fontWeight: 800 }}>⭐ {favoriteStock}</div>
                  )}
                </div>

                <button className="btn btn-primary ripple-btn" onClick={() => setIsEditing(true)} style={{ height: 44, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Edit3 size={15} /> แก้ไขข้อมูลโปรไฟล์</button>
              </div>
            ) : (
              /* ── EDIT FORM ── */
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "#F8FAFC", border: "1px solid var(--border)", borderRadius: "16px", padding: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", alignSelf: "flex-start" }}>รูปประจำตัว</span>
                  <div style={{ position: "relative" }}>
                    <img src={profilePic || `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><rect width='80' height='80' fill='%23F1F5F9'/><text x='50%' y='55%' font-size='32' text-anchor='middle' fill='%2394A3B8'>👤</text></svg>`}
                      alt="avatar" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--primary)" }} />
                    {profilePic && (
                      <button type="button" onClick={async () => { if (await askConfirm("ลบรูปโปรไฟล์นี้ใช่หรือไม่?", "🗑️ ยืนยัน")) setProfilePic(""); }}
                        style={{ position: "absolute", top: "-4px", right: "-4px", background: "#EF4444", color: "white", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}><X size={10} strokeWidth={3} /></button>
                    )}
                    {!profilePic && (
                      <button type="button" onClick={() => setPresetModalOpen(true)} style={{ position: "absolute", bottom: 0, left: 0, background: "linear-gradient(135deg, #8B5CF6, #EC4899)", color: "white", width: 26, height: 26, borderRadius: "50%", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={12} /></button>
                    )}
                    <label style={{ position: "absolute", bottom: 0, right: 0, background: "var(--primary)", color: "white", width: 26, height: 26, borderRadius: "50%", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <Plus size={14} /><input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
                    </label>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">ชื่อจริง</label><input type="text" className="form-input" placeholder="ชื่อ" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">นามสกุล</label><input type="text" className="form-input" placeholder="นามสกุล" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} /></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">ชื่อเล่น</label><input type="text" className="form-input" placeholder="ชื่อเล่น" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">วันเกิด</label><input type="date" className="form-input" value={newBirthday} onChange={(e) => setNewBirthday(e.target.value)} /></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">สไตล์การลงทุน</label>
                      <select className="form-input" value={newTraderStyle} onChange={(e) => setNewTraderStyle(e.target.value)} style={{ padding: "0 8px" }}>
                        {["Value Investor (VI)", "Day Trader", "Swing Trader", "Dividend Investor", "Growth Investor", "Passive Investor"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">ระดับประสบการณ์</label>
                      <select className="form-input" value={newExperience} onChange={(e) => setNewExperience(e.target.value)} style={{ padding: "0 8px" }}>
                        {[["Beginner", "Beginner (มือใหม่)"], ["Intermediate", "Intermediate (มีชั่วโมงบิน)"], ["Expert", "Expert (มือโปร)"], ["Legend", "Legend (ระดับตำนาน)"]].map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">ความเสี่ยงที่รับได้</label>
                      <select className="form-input" value={newRiskLevel} onChange={(e) => setNewRiskLevel(e.target.value)} style={{ padding: "0 8px" }}>
                        {[["Low", "Low (ความเสี่ยงต่ำ)"], ["Medium", "Medium (ความเสี่ยงปานกลาง)"], ["High", "High (ความเสี่ยงสูง)"], ["Extreme", "Extreme (เสี่ยงสูงมาก / All in)"]].map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">หุ้นตัวโปรด</label><input type="text" className="form-input" placeholder="เช่น AAPL, TSLA" value={newFavoriteStock} onChange={(e) => setNewFavoriteStock(e.target.value.toUpperCase())} /></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">เป้าหมายขนาดพอร์ต (THB)</label><input type="text" className="form-input" placeholder="เช่น 1,000,000" value={newPortfolioTarget} onChange={(e) => setNewPortfolioTarget(e.target.value)} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">เป้าหมายผลตอบแทนต่อปี (%)</label><input type="text" className="form-input" placeholder="เช่น 10" value={newTargetYield} onChange={(e) => setNewTargetYield(e.target.value)} /></div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">คติประจำใจในการเทรด</label><input type="text" className="form-input" placeholder="เช่น ซื้อที่จุดต่ำสุด ขายที่ยอดดอย" value={newBio} onChange={(e) => setNewBio(e.target.value)} /></div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button className="btn btn-secondary ripple-btn" style={{ flex: 1, height: 40 }} onClick={() => setIsEditing(false)}>ยกเลิก</button>
                  <button className="btn btn-primary ripple-btn" style={{ flex: 1, height: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={handleSaveProfile}><Save size={15} /> บันทึกโปรไฟล์</button>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer" style={{ padding: "8px 24px 16px" }}><button className="btn btn-secondary ripple-btn" onClick={onClose} style={{ height: 40, fontSize: 13 }}>ปิดหน้าต่าง</button></div>
        </div>
      </div>

      {avatarPreviewOpen && profilePic && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15,23,42,0.75)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setAvatarPreviewOpen(false)}>
          <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%", display: "flex", flexDirection: "column", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setAvatarPreviewOpen(false)} style={{ position: "absolute", top: -48, right: 0, background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} /></button>
            <img src={profilePic} alt="Preview" style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "16px", objectFit: "contain", border: "4px solid rgba(255,255,255,0.2)" }} />
          </div>
        </div>
      )}

      {presetModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15,23,42,0.65)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998 }} onClick={() => setPresetModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 380, background: "#FFFFFF", borderRadius: "24px", padding: "24px", position: "relative", display: "flex", flexDirection: "column", gap: 20 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: "none", padding: 0 }}>
              <span className="modal-title" style={{ fontSize: 16, fontWeight: 800 }}>🎨 เลือกรูปประจำตัว (Presets)</span>
              <button type="button" className="btn-close" onClick={() => setPresetModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, justifyItems: "center", padding: "8px 0" }}>
              {PRESET_AVATARS.map((preset) => {
                const isSelected = profilePic === preset.svg;
                return (
                  <button key={preset.id} type="button" onClick={() => { setProfilePic(preset.svg); setPresetModalOpen(false); }}
                    style={{ background: preset.bg, border: isSelected ? "3px solid var(--primary)" : "3px solid transparent", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, cursor: "pointer", padding: 0 }}
                    title={`เลือกรูปประจำตัว ${preset.id}`}
                  >{preset.emoji}</button>
                );
              })}
            </div>
            <div className="modal-footer" style={{ borderTop: "none", padding: 0 }}><button type="button" className="btn btn-secondary ripple-btn" onClick={() => setPresetModalOpen(false)} style={{ height: 40, fontSize: 13, borderRadius: "12px" }}>ยกเลิก</button></div>
          </div>
        </div>
      )}
    </>
  );
}
