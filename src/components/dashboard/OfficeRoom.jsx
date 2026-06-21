import React, { useState, useEffect } from "react";
import retroAudio from "../../utils/retroAudio";
import {
  TILE_SIZE,
  MAP_COLS,
  MAP_ROWS,
  INITIAL_CHARACTERS,
  DESK_POSITIONS
} from "./officeData";

export default function OfficeRoom({ onSelectFeature }) {
  const [activeSpeech, setActiveSpeech] = useState(null);

  const [characters, setCharacters] = useState(INITIAL_CHARACTERS);

  // Animation Loop for all characters
  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId;

    const loop = (time) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      setCharacters(prev => prev.map(ch => {
        let nextFrame = ch.frame;
        let nextFrameTimer = ch.frameTimer + dt;

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
                dir: 0,
                idleTimer: 3 + Math.random() * 4,
                frame: 1,
                frameTimer: 0
              };
            } else {
              const step = ch.speed * dt;
              const ratio = Math.min(1, step / dist);
              
              let dir = ch.dir;
              if (Math.abs(dx) > Math.abs(dy)) {
                dir = dx > 0 ? 2 : 3;
              } else {
                dir = dy > 0 ? 0 : 1;
              }

              if (nextFrameTimer > 0.15) {
                nextFrameTimer = 0;
                nextFrame = (ch.frame + 1) % 3; // loops walk frames 0, 1, 2
              }

              return {
                ...ch,
                x: ch.x + dx * ratio,
                y: ch.y + dy * ratio,
                dir,
                frame: nextFrame,
                frameTimer: nextFrameTimer
              };
            }
          } else {
            const nextIdleTimer = ch.idleTimer - dt;
            if (nextIdleTimer <= 0) {
              const randCol = 14 + Math.floor(Math.random() * 5);
              const randRow = 1 + Math.floor(Math.random() * 4);
              return {
                ...ch,
                state: "walk",
                targetX: randCol * TILE_SIZE,
                targetY: randRow * TILE_SIZE,
                frame: 0,
                frameTimer: 0,
                dir: 0
              };
            }
            return {
              ...ch,
              idleTimer: nextIdleTimer,
              frame: 1,
              frameTimer: nextFrameTimer
            };
          }
        } else {
          // Stationary working character
          let nextStateTimer = ch.stateTimer - dt;
          let state = ch.state;
          if (nextStateTimer <= 0) {
            const states = ["idle", "type", "read"];
            state = states[Math.floor(Math.random() * states.length)];
            nextStateTimer = 4 + Math.random() * 6;
            nextFrameTimer = 0;
            if (state === "idle") nextFrame = 1;
            else if (state === "type") nextFrame = 3;
            else if (state === "read") nextFrame = 5;
          }

          if (nextFrameTimer > 0.25) {
            nextFrameTimer = 0;
            if (state === "type") {
              nextFrame = 3 + ((ch.frame - 3 + 1) % 2); // alternates 3 and 4
            } else if (state === "read") {
              nextFrame = 5 + ((ch.frame - 5 + 1) % 2); // alternates 5 and 6
            } else {
              nextFrame = 1;
            }
          }

          return {
            ...ch,
            state,
            stateTimer: nextStateTimer,
            frame: nextFrame,
            frameTimer: nextFrameTimer
          };
        }
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
      {DESK_POSITIONS.map((pos, i) => {
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

      {/* 4. Rendering depth-sorted animated pixel characters */}
      {characters.map(ch => {
        const showBubble = activeSpeech === ch.id;

        // Calculate background position
        const posX = ch.frame * -48;
        // If dir is 3 (left), we use Row 2 (Right) but apply scaleX(-1) in transform
        const displayDir = ch.dir === 3 ? 2 : ch.dir;
        const posY = displayDir * -96;

        return (
          <div 
            key={ch.id}
            className="sprite-char-wrapper"
            style={{ 
              left: ch.x, 
              top: ch.y - 48, 
              cursor: "pointer",
              zIndex: Math.floor(ch.y),
              width: "48px",
              height: "96px"
            }}
            onMouseEnter={() => setActiveSpeech(ch.id)}
            onMouseLeave={() => setActiveSpeech(null)}
            onClick={() => handleCharacterClick(ch)}
          >
            {/* Tooltip bubble on hover */}
            {showBubble && (
              <div className="sprite-char-bubble bubble-up" style={{ top: -38 }}>
                {ch.hoverText}
              </div>
            )}

            {/* Sprite sheet image with flip transform if direction is Left (3) */}
            <div 
              className="sprite-char"
              style={{
                backgroundImage: `url(/assets/characters/char_${ch.charId}.png)`,
                backgroundPosition: `${posX}px ${posY}px`,
                transform: ch.dir === 3 ? "scaleX(-1)" : "none"
              }}
            />

            {/* Nametag */}
            <div className="sprite-char-nametag" style={{ bottom: -12 }}>
              {ch.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
