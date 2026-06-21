import React, { useState, useEffect } from "react";
import retroAudio from "../../utils/retroAudio";

// Coordinate offsets and boundaries
const TILE_SIZE = 48;
const MAP_COLS = 20;
const MAP_ROWS = 15;

export default function OfficeRoom({ onSelectFeature }) {
  const [activeSpeech, setActiveSpeech] = useState(null); // id of NPC showing hover text

  // 7 core characters positioned at their desks or zones
  const [characters, setCharacters] = useState([
    {
      id: "ceo",
      name: "ผู้จัดการพอร์ต (CEO)",
      feature: "summary",
      charId: 0,
      x: 3 * TILE_SIZE,
      y: 3 * TILE_SIZE + 18,
      dir: 1, // UP (facing computer)
      state: "typing",
      frame: 4,
      frameTimer: 0,
      hoverText: "ผู้จัดการพอร์ต (ยอดรวมพอร์ต & KPI)"
    },
    {
      id: "accountant",
      name: "หัวหน้าฝ่ายบัญชี",
      feature: "ledger",
      charId: 2,
      x: 9 * TILE_SIZE,
      y: 3 * TILE_SIZE + 18,
      dir: 1, // UP (facing computer)
      state: "typing",
      frame: 4,
      frameTimer: 0,
      hoverText: "ฝ่ายบัญชี (ตารางรายชื่อและประวัติธุรกรรม)"
    },
    {
      id: "analyst",
      name: "นักวิเคราะห์การลงทุน",
      feature: "analyzer",
      charId: 3,
      x: 9 * TILE_SIZE,
      y: 11 * TILE_SIZE + 18,
      dir: 1, // UP (facing computer)
      state: "typing",
      frame: 4,
      frameTimer: 0,
      hoverText: "นักวิเคราะห์ (สืบค้นข้อมูลและกราฟหุ้น)"
    },
    {
      id: "receptionist",
      name: "ฝ่ายประชาสัมพันธ์",
      feature: "import",
      charId: 1,
      x: 2 * TILE_SIZE,
      y: 11 * TILE_SIZE - 4,
      dir: 0, // DOWN (facing entrance)
      state: "idle",
      frame: 6,
      frameTimer: 0,
      hoverText: "ฝ่ายต้อนรับ (นำเข้าข้อมูลจาก Dime & สลิปธุรกรรม)"
    },
    {
      id: "dividends",
      name: "พนักงานปันผล",
      feature: "dividends",
      charId: 4,
      x: 16 * TILE_SIZE,
      y: 3 * TILE_SIZE,
      targetX: 16 * TILE_SIZE,
      targetY: 3 * TILE_SIZE,
      dir: 0, // DOWN
      state: "idle",
      frame: 6,
      frameTimer: 0,
      isWanderer: true,
      idleTimer: 2.0,
      speed: 48, // pixels per second
      hoverText: "พนักงานฝ่ายเงินปันผล (ปฏิทินปันผล)"
    },
    {
      id: "risk_left",
      name: "ผู้ประเมินความเสี่ยง A",
      feature: "risk",
      charId: 5,
      x: 15 * TILE_SIZE - 8,
      y: 11 * TILE_SIZE + 8,
      dir: 2, // RIGHT (facing table)
      state: "idle",
      frame: 6,
      frameTimer: 0,
      hoverText: "บอร์ดบริหารความเสี่ยง (Stress Test & ค่าสหสัมพันธ์)"
    },
    {
      id: "risk_right",
      name: "ผู้ประเมินความเสี่ยง B",
      feature: "risk",
      charId: 0,
      x: 17 * TILE_SIZE + 8,
      y: 11 * TILE_SIZE + 8,
      dir: 3, // LEFT (facing table)
      state: "idle",
      frame: 6,
      frameTimer: 0,
      hoverText: "บอร์ดบริหารความเสี่ยง ( Stress Test & ค่าสหสัมพันธ์)"
    }
  ]);

  // Game/Animation Loop
  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId;

    const loop = (time) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      setCharacters(prev => prev.map(ch => {
        let nextFrame = ch.frame;
        let nextFrameTimer = ch.frameTimer + dt;
        const frameDuration = ch.state === "walk" ? 0.15 : 0.25;

        // Loop animation frames
        if (nextFrameTimer >= frameDuration) {
          nextFrameTimer -= frameDuration;
          if (ch.state === "walk") {
            nextFrame = (nextFrame + 1) % 4; // walk frames (0 to 3)
          } else if (ch.state === "typing") {
            nextFrame = 4 + ((nextFrame - 4 + 1) % 2); // typing (4 or 5)
          } else {
            nextFrame = 6; // idle pose
          }
        }

        // Wanderer movement updates (Dividend officer only)
        if (ch.isWanderer) {
          if (ch.state === "walk") {
            const dx = ch.targetX - ch.x;
            const dy = ch.targetY - ch.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 2) {
              // Arrived
              return {
                ...ch,
                x: ch.targetX,
                y: ch.targetY,
                state: "idle",
                frame: 6,
                idleTimer: 3 + Math.random() * 4 // Idle for 3-7 seconds
              };
            } else {
              // Walk towards target
              const step = ch.speed * dt;
              const ratio = Math.min(1, step / dist);
              const nextX = ch.x + dx * ratio;
              const nextY = ch.y + dy * ratio;

              let dir = ch.dir;
              if (Math.abs(dx) > Math.abs(dy)) {
                dir = dx > 0 ? 2 : 3; // Right / Left
              } else {
                dir = dy > 0 ? 0 : 1; // Down / Up
              }

              return {
                ...ch,
                x: nextX,
                y: nextY,
                dir,
                frame: nextFrame,
                frameTimer: nextFrameTimer
              };
            }
          } else if (ch.state === "idle") {
            const nextIdleTimer = ch.idleTimer - dt;
            if (nextIdleTimer <= 0) {
              // Pick a random waypoint inside kitchen/breakroom zone
              // Kitchen is x: 13-19, y: 1-5
              const randCol = 14 + Math.floor(Math.random() * 5);
              const randRow = 1 + Math.floor(Math.random() * 4);
              return {
                ...ch,
                state: "walk",
                targetX: randCol * TILE_SIZE,
                targetY: randRow * TILE_SIZE,
                frame: 0,
                frameTimer: 0
              };
            }
            return {
              ...ch,
              idleTimer: nextIdleTimer
            };
          }
        }

        return {
          ...ch,
          frame: nextFrame,
          frameTimer: nextFrameTimer
        };
      }));

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleCharacterClick = (ch) => {
    retroAudio.playClick();
    onSelectFeature(ch.feature);
  };

  // Define desks positions for grid map rendering
  const deskPositions = [
    { x: 3 * TILE_SIZE, y: 3 * TILE_SIZE }, // CEO Desk
    { x: 9 * TILE_SIZE, y: 3 * TILE_SIZE }, // Accountant Desk
    { x: 2 * TILE_SIZE, y: 11 * TILE_SIZE }, // Reception Desk
    { x: 9 * TILE_SIZE, y: 11 * TILE_SIZE } // Analyst Desk
  ];

  return (
    <div className="office-fullscreen-screen">
      {/* 1. Floor grid rendering (20 cols x 15 rows) */}
      <div className="office-fullscreen-floor">
        {Array.from({ length: MAP_ROWS }).map((_, r) => (
          Array.from({ length: MAP_COLS }).map((_, c) => {
            let tileClass = "tile-wood";
            
            // Map boundaries & wall layouts
            const isTopWall = r === 0;
            const isVertWall = c === 12 && r !== 3 && r !== 11; // Doorways at row 3 and 11
            const isHorizWall = r === 7 && c > 12 && c !== 16; // Doorway at col 16
            
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

      {/* 2. Entrance Exit Door (Logs out user) */}
      <div 
        className="exit-door" 
        style={{ left: 0, top: 6 * TILE_SIZE }}
        onClick={() => { retroAudio.playClick(); onSelectFeature("logout"); }}
        onMouseEnter={() => setActiveSpeech("exit")}
        onMouseLeave={() => setActiveSpeech(null)}
      >
        <div className="exit-door-knob" />
        {activeSpeech === "exit" && (
          <div className="sprite-char-bubble bubble-down" style={{ top: -38 }}>
            🚪 ออกจากระบบ (Logout)
          </div>
        )}
      </div>

      {/* 3. Static Furniture Placements */}
      {/* Wall Decorations */}
      <div className="office-furniture" style={{ left: 8 * TILE_SIZE, top: 4, width: 64, height: 44, background: "url(/assets/furniture/WHITEBOARD/WHITEBOARD.png) no-repeat", backgroundSize: "contain", zIndex: 40 }} />
      <div className="office-furniture" style={{ left: 1 * TILE_SIZE, top: 8, width: 32, height: 32, background: "url(/assets/furniture/CLOCK/CLOCK.png) no-repeat", backgroundSize: "contain", zIndex: 30 }} />

      {/* Bookshelves */}
      <div className="office-furniture" style={{ left: 5 * TILE_SIZE, top: 12, width: 48, height: 32, background: "url(/assets/furniture/BOOKSHELF/BOOKSHELF.png) no-repeat", backgroundSize: "contain", zIndex: 44 }} />
      <div className="office-furniture" style={{ left: 13 * TILE_SIZE + 8, top: 8 * TILE_SIZE + 10, width: 48, height: 32, background: "url(/assets/furniture/BOOKSHELF/BOOKSHELF.png) no-repeat", backgroundSize: "contain", zIndex: 8 * TILE_SIZE + 42 }} />
      <div className="office-furniture" style={{ left: 19 * TILE_SIZE - 12, top: 8 * TILE_SIZE + 10, width: 48, height: 32, background: "url(/assets/furniture/BOOKSHELF/BOOKSHELF.png) no-repeat", backgroundSize: "contain", zIndex: 8 * TILE_SIZE + 42 }} />

      {/* Kitchen items */}
      <div className="office-furniture" style={{ left: 19 * TILE_SIZE - 16, top: 10, width: 32, height: 48, background: "url(/assets/furniture/COFFEE/COFFEE_FRONT.png) no-repeat", backgroundSize: "contain", zIndex: 48 }} />
      <div className="office-furniture" style={{ left: 14 * TILE_SIZE, top: 10, width: 32, height: 38, background: "url(/assets/furniture/COFFEE/COFFEE_FRONT.png) no-repeat", backgroundSize: "contain", zIndex: 40 }} />
      <div className="office-furniture" style={{ left: 15 * TILE_SIZE, top: 4 * TILE_SIZE, width: 64, height: 48, background: "url(/assets/furniture/SOFA/SOFA_FRONT.png) no-repeat", backgroundSize: "contain", zIndex: 4 * TILE_SIZE + 48 }} />

      {/* Meeting Room Table & Chairs */}
      <div className="office-furniture" style={{ left: 16 * TILE_SIZE - 8, top: 11 * TILE_SIZE + 8, width: 64, height: 48, background: "url(/assets/furniture/COFFEE_TABLE/COFFEE_TABLE.png) no-repeat", backgroundSize: "contain", zIndex: 11 * TILE_SIZE + 56 }} />
      <div className="office-furniture" style={{ left: 15 * TILE_SIZE - 8, top: 11 * TILE_SIZE + 8, width: 32, height: 32, background: "url(/assets/furniture/CUSHIONED_CHAIR/CUSHIONED_CHAIR_SIDE.png) no-repeat", backgroundSize: "contain", zIndex: 11 * TILE_SIZE + 40 }} />
      <div className="office-furniture" style={{ left: 17 * TILE_SIZE + 8, top: 11 * TILE_SIZE + 8, width: 32, height: 32, background: "url(/assets/furniture/CUSHIONED_CHAIR/CUSHIONED_CHAIR_SIDE.png) no-repeat", backgroundSize: "contain", transform: "scaleX(-1)", zIndex: 11 * TILE_SIZE + 40 }} />

      {/* Desks and PCs */}
      {deskPositions.map((pos, i) => {
        const isReception = i === 2;
        return (
          <React.Fragment key={`furniture-${i}`}>
            <div 
              className="office-furniture" 
              style={{ 
                left: pos.x + 8, 
                top: pos.y, 
                width: 32, 
                height: 28, 
                background: "url(/assets/furniture/DESK/DESK_FRONT.png) no-repeat", 
                backgroundSize: "contain", 
                zIndex: pos.y + 28 
              }} 
            />
            {!isReception && (
              <div 
                className="office-furniture" 
                style={{ 
                  left: pos.x + 14, 
                  top: pos.y - 12, 
                  width: 20, 
                  height: 16, 
                  background: "url(/assets/furniture/PC/PC_BACK.png) no-repeat", 
                  backgroundSize: "contain", 
                  zIndex: pos.y + 4 
                }} 
              />
            )}
          </React.Fragment>
        );
      })}

      {/* 4. Rendering depth-sorted Employees (NPCs) */}
      {characters.map(ch => {
        const showBubble = activeSpeech === ch.id;
        const posX = ch.frame * -48;
        const posY = ch.dir * -72;

        return (
          <div 
            key={ch.id}
            className="sprite-char-wrapper"
            style={{ 
              left: ch.x, 
              top: ch.y - 28, // aligned Y offset
              cursor: "pointer",
              zIndex: Math.floor(ch.y)
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

            {/* Character Sprite Sheet */}
            <div 
              className="sprite-char"
              style={{
                backgroundImage: `url(/assets/characters/char_${ch.charId}.png)`,
                backgroundPosition: `${posX}px ${posY}px`
              }}
            />

            {/* Nametag */}
            <div className="sprite-char-nametag">
              {ch.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
