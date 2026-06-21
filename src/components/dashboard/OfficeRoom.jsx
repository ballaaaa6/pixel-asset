import React, { useState, useEffect } from "react";
import retroAudio from "../../utils/retroAudio";

const TILE_SIZE = 48;
const MAP_COLS = 20;
const MAP_ROWS = 15;

export default function OfficeRoom({ onSelectFeature }) {
  const [activeSpeech, setActiveSpeech] = useState(null);

  // 7 characters represented as cute cartoon animal emojis on gradients
  const [characters, setCharacters] = useState([
    {
      id: "ceo",
      name: "ผู้จัดการพอร์ต (CEO)",
      feature: "summary",
      emoji: "🦁",
      bg: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
      x: 3 * TILE_SIZE,
      y: 3 * TILE_SIZE + 12,
      state: "idle",
      hoverText: "ผู้จัดการพอร์ต (ยอดรวมพอร์ต & KPI)"
    },
    {
      id: "accountant",
      name: "หัวหน้าฝ่ายบัญชี",
      feature: "ledger",
      emoji: "🦊",
      bg: "linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)",
      x: 9 * TILE_SIZE,
      y: 3 * TILE_SIZE + 12,
      state: "idle",
      hoverText: "ฝ่ายบัญชี (ตารางรายชื่อและประวัติธุรกรรม)"
    },
    {
      id: "analyst",
      name: "นักวิเคราะห์การลงทุน",
      feature: "analyzer",
      emoji: "🦄",
      bg: "linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",
      x: 9 * TILE_SIZE,
      y: 11 * TILE_SIZE + 12,
      state: "idle",
      hoverText: "นักวิเคราะห์ (สืบค้นข้อมูลและกราฟหุ้น)"
    },
    {
      id: "receptionist",
      name: "ฝ่ายประชาสัมพันธ์",
      feature: "import",
      emoji: "🐨",
      bg: "linear-gradient(135deg, #0D9488 0%, #06B6D4 100%)",
      x: 2 * TILE_SIZE,
      y: 11 * TILE_SIZE - 4,
      state: "idle",
      hoverText: "ฝ่ายต้อนรับ (นำเข้าข้อมูลจาก Dime & สลิปธุรกรรม)"
    },
    {
      id: "dividends",
      name: "พนักงานปันผล",
      feature: "dividends",
      emoji: "🐻",
      bg: "linear-gradient(135deg, #8B5CF6 0%, #EF4444 100%)",
      x: 16 * TILE_SIZE,
      y: 3 * TILE_SIZE,
      targetX: 16 * TILE_SIZE,
      targetY: 3 * TILE_SIZE,
      state: "idle",
      isWanderer: true,
      idleTimer: 2.0,
      speed: 48,
      hoverText: "พนักงานฝ่ายเงินปันผล (ปฏิทินปันผล)"
    },
    {
      id: "risk_left",
      name: "ผู้ประเมินความเสี่ยง A",
      feature: "risk",
      emoji: "📈",
      bg: "linear-gradient(135deg, #3B82F6 0%, #10B981 100%)",
      x: 15 * TILE_SIZE - 8,
      y: 11 * TILE_SIZE + 8,
      state: "idle",
      hoverText: "บอร์ดบริหารความเสี่ยง (Stress Test & ค่าสหสัมพันธ์)"
    },
    {
      id: "risk_right",
      name: "ผู้ประเมินความเสี่ยง B",
      feature: "risk",
      emoji: "📊",
      bg: "linear-gradient(135deg, #3B82F6 0%, #10B981 100%)",
      x: 17 * TILE_SIZE + 8,
      y: 11 * TILE_SIZE + 8,
      state: "idle",
      hoverText: "บอร์ดบริหารความเสี่ยง (Stress Test & ค่าสหสัมพันธ์)"
    }
  ]);

  // Animation Loop for the Wanderer (Dividend Officer)
  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId;

    const loop = (time) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      setCharacters(prev => prev.map(ch => {
        if (ch.isWanderer) {
          if (ch.state === "walk") {
            const dx = ch.targetX - ch.x;
            const dy = ch.targetY - ch.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 2) {
              return {
                ...ch,
                x: ch.targetX,
                y: ch.targetY,
                state: "idle",
                idleTimer: 3 + Math.random() * 4
              };
            } else {
              const step = ch.speed * dt;
              const ratio = Math.min(1, step / dist);
              return {
                ...ch,
                x: ch.x + dx * ratio,
                y: ch.y + dy * ratio
              };
            }
          } else if (ch.state === "idle") {
            const nextIdleTimer = ch.idleTimer - dt;
            if (nextIdleTimer <= 0) {
              // Pick random tile inside kitchen/breakroom area
              const randCol = 14 + Math.floor(Math.random() * 5);
              const randRow = 1 + Math.floor(Math.random() * 4);
              return {
                ...ch,
                state: "walk",
                targetX: randCol * TILE_SIZE,
                targetY: randRow * TILE_SIZE
              };
            }
            return {
              ...ch,
              idleTimer: nextIdleTimer
            };
          }
        }
        return ch;
      }));

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleCharacterClick = (ch) => {
    retroAudio.playClick();
    if (typeof onSelectFeature === "function") {
      onSelectFeature(ch.feature);
    }
  };

  const deskPositions = [
    { x: 3 * TILE_SIZE, y: 3 * TILE_SIZE }, // CEO
    { x: 9 * TILE_SIZE, y: 3 * TILE_SIZE }, // Accountant
    { x: 2 * TILE_SIZE, y: 11 * TILE_SIZE }, // Receptionist
    { x: 9 * TILE_SIZE, y: 11 * TILE_SIZE } // Analyst
  ];

  return (
    <div className="office-fullscreen-screen">
      {/* 1. Flat Grid flooring (20 cols x 15 rows) */}
      <div className="office-fullscreen-floor">
        {Array.from({ length: MAP_ROWS }).map((_, r) => (
          Array.from({ length: MAP_COLS }).map((_, c) => {
            let tileClass = "tile-wood";
            
            const isTopWall = r === 0;
            const isVertWall = c === 12 && r !== 3 && r !== 11;
            const isHorizWall = r === 7 && c > 12 && c !== 16;
            
            if (isTopWall || isVertWall || isHorizWall) {
              tileClass = "tile-wood-wall";
            } else if (c > 12) {
              tileClass = r < 7 ? "tile-kitchen" : "tile-carpet";
            }

            return (
              <div 
                key={`${r}-${c}`} 
                className={tileClass}
              />
            );
          })
        ))}
      </div>

      {/* 2. Entrance Exit Door (Logout door) */}
      <div 
        className="exit-door" 
        style={{ left: 0, top: 6 * TILE_SIZE }}
        onClick={() => { retroAudio.playClick(); onSelectFeature("logout"); }}
        onMouseEnter={() => setActiveSpeech("exit")}
        onMouseLeave={() => setActiveSpeech(null)}
      >
        <span style={{ fontSize: "28px" }}>🚪</span>
        {activeSpeech === "exit" && (
          <div className="sprite-char-bubble bubble-down" style={{ top: -38 }}>
            🚪 ออกจากระบบ (Logout)
          </div>
        )}
      </div>

      {/* 3. Vector Cartoon Furniture Placements */}
      {/* Whiteboard */}
      <div 
        className="office-furniture" 
        style={{ 
          left: 8 * TILE_SIZE, 
          top: 10, 
          width: "100px", 
          height: "60px", 
          background: "#fff", 
          border: "3px solid #333", 
          borderRadius: "8px", 
          boxShadow: "0 6px 12px rgba(0,0,0,0.15)", 
          display: "flex", 
          flexDirection: "column",
          justifyContent: "center", 
          alignItems: "center",
          color: "#333",
          fontFamily: "var(--font-family)",
          fontWeight: "bold",
          fontSize: "14px",
          zIndex: 30
        }}
      >
        <span>📈 STOCKS</span>
        <span style={{ fontSize: "11px", color: "#666" }}>Portfolios</span>
      </div>

      {/* Clock */}
      <div className="office-furniture" style={{ left: 1 * TILE_SIZE, top: 10, fontSize: "28px", zIndex: 30 }}>⏰</div>

      {/* Bookshelves */}
      <div className="office-furniture" style={{ left: 5 * TILE_SIZE, top: 12, fontSize: "32px", zIndex: 44 }}>📚</div>
      <div className="office-furniture" style={{ left: 13 * TILE_SIZE + 12, top: 8 * TILE_SIZE + 10, fontSize: "32px", zIndex: 8 * TILE_SIZE + 42 }}>📚</div>
      <div className="office-furniture" style={{ left: 19 * TILE_SIZE - 24, top: 8 * TILE_SIZE + 10, fontSize: "32px", zIndex: 8 * TILE_SIZE + 42 }}>📚</div>

      {/* Kitchen items */}
      <div className="office-furniture" style={{ left: 19 * TILE_SIZE - 24, top: 10, fontSize: "32px", zIndex: 48 }}>🥤</div>
      <div className="office-furniture" style={{ left: 14 * TILE_SIZE, top: 10, fontSize: "32px", zIndex: 40 }}>☕</div>
      <div className="office-furniture" style={{ left: 15 * TILE_SIZE, top: 4 * TILE_SIZE, fontSize: "40px", zIndex: 4 * TILE_SIZE + 48 }}>🛋️</div>
      <div className="office-furniture" style={{ left: 19 * TILE_SIZE - 20, top: 5 * TILE_SIZE, fontSize: "32px", zIndex: 5 * TILE_SIZE + 40 }}>🪴</div>

      {/* Meeting Room Table */}
      <div className="office-furniture" style={{ left: 16 * TILE_SIZE - 12, top: 11 * TILE_SIZE + 10, fontSize: "44px", zIndex: 11 * TILE_SIZE + 56 }}>🪵</div>
      <div className="office-furniture" style={{ left: 15 * TILE_SIZE - 8, top: 11 * TILE_SIZE + 8, fontSize: "32px", zIndex: 11 * TILE_SIZE + 40 }}>🪑</div>
      <div className="office-furniture" style={{ left: 17 * TILE_SIZE + 8, top: 11 * TILE_SIZE + 8, fontSize: "32px", zIndex: 11 * TILE_SIZE + 40 }}>🪑</div>

      {/* Desks and PCs */}
      {deskPositions.map((pos, i) => {
        const isReception = i === 2;
        return (
          <React.Fragment key={`furniture-${i}`}>
            {/* Cartoon Desk */}
            <div 
              className="office-furniture" 
              style={{ 
                left: pos.x + 8, 
                top: pos.y, 
                width: 36, 
                height: 32, 
                background: "#a05a2c", 
                border: "2px solid #5c3c24",
                borderRadius: "4px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
                zIndex: pos.y + 28 
              }} 
            />
            {/* Cartoon PC */}
            {!isReception && (
              <div 
                className="office-furniture" 
                style={{ 
                  left: pos.x + 14, 
                  top: pos.y - 12, 
                  fontSize: "24px",
                  zIndex: pos.y + 4 
                }} 
              >
                🖥️
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* 4. Rendering depth-sorted Cartoon Avatars (Badges) */}
      {characters.map(ch => {
        const showBubble = activeSpeech === ch.id;

        return (
          <div 
            key={ch.id}
            className="sprite-char-wrapper"
            style={{ 
              left: ch.x, 
              top: ch.y - 28, 
              cursor: "pointer",
              zIndex: Math.floor(ch.y),
              transition: "transform 0.2s ease",
              width: "48px",
              height: "48px"
            }}
            onMouseEnter={() => setActiveSpeech(ch.id)}
            onMouseLeave={() => setActiveSpeech(null)}
            onClick={() => handleCharacterClick(ch)}
          >
            {/* Tooltip bubble on hover */}
            {showBubble && (
              <div className="sprite-char-bubble bubble-up">
                {ch.hoverText}
              </div>
            )}

            {/* Circular Cartoon Avatar Badge */}
            <div 
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: ch.bg,
                border: "3px solid #fff",
                boxShadow: "0 6px 12px rgba(0,0,0,0.25)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "26px",
                transition: "all 0.2s ease"
              }}
              className="cartoon-avatar-badge"
            >
              {ch.emoji}
            </div>

            {/* Nametag */}
            <div className="sprite-char-nametag" style={{ bottom: -20 }}>
              {ch.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
