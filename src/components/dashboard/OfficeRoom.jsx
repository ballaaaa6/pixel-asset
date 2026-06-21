import React, { useState, useEffect, useMemo } from "react";
import retroAudio from "../../utils/retroAudio";

// Waypoints inside the office for wanderers
const WAYPOINTS = [
  { x: 11 * 48, y: 2 * 48, name: "WHITEBOARD" },
  { x: 12 * 48, y: 2 * 48, name: "COFFEE" },
  { x: 5 * 48, y: 4 * 48, name: "MEETING" },
  { x: 1 * 48, y: 6 * 48, name: "WATER" },
  { x: 12 * 48, y: 6 * 48, name: "SOFA" },
  { x: 1 * 48, y: 3 * 48, name: "PLANT" }
];

const DESK_POSITIONS = [
  { x: 2 * 48, y: 2 * 48, facing: 1 }, // sits at y=3*48, faces UP
  { x: 5 * 48, y: 2 * 48, facing: 1 },
  { x: 8 * 48, y: 2 * 48, facing: 1 },
  { x: 2 * 48, y: 5 * 48, facing: 1 },
  { x: 5 * 48, y: 5 * 48, facing: 1 },
  { x: 8 * 48, y: 5 * 48, facing: 1 }
];

export default function OfficeRoom({ assets = [], prices = {}, setSelectedAsset }) {
  const [activeSpeech, setActiveSpeech] = useState(null); // symbol of char showing bubble on hover

  // Format list of characters
  const [characters, setCharacters] = useState([]);

  // Initialize characters when assets or prices change
  useEffect(() => {
    if (assets.length === 0) return;

    setCharacters(assets.map((asset, index) => {
      const isWanderer = index >= 6;
      const deskId = isWanderer ? null : index;
      
      let initialX, initialY, state, dir, frame;

      if (deskId !== null) {
        // Sitting at desk
        initialX = DESK_POSITIONS[deskId].x;
        initialY = DESK_POSITIONS[deskId].y + 24; // offset so sitting behind desk
        state = "typing";
        dir = 1; // UP (facing computer)
        frame = 4; // typing frame
      } else {
        // Wandering
        const wp = WAYPOINTS[index % WAYPOINTS.length];
        initialX = wp.x;
        initialY = wp.y;
        state = "idle";
        dir = 0; // DOWN
        frame = 6; // idle frame
      }

      const priceData = prices[asset.symbol] || {};
      const changeVal = priceData.changePercent ?? 0;

      return {
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name || asset.symbol,
        change: changeVal,
        price: priceData.price ?? 0,
        charId: index % 6, // 6 characters sheets (char_0 to char_5)
        isWanderer,
        deskId,
        x: initialX,
        y: initialY,
        targetX: initialX,
        targetY: initialY,
        state,
        dir,
        frame,
        frameTimer: 0,
        idleTimer: isWanderer ? Math.random() * 3 : 0,
        speed: 36 + Math.random() * 12 // speed in px/sec
      };
    }));
  }, [assets, prices]);

  // Main animation game loop
  useEffect(() => {
    if (characters.length === 0) return;

    let lastTime = performance.now();
    let animationFrameId;

    const loop = (time) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000); // cap dt at 100ms
      lastTime = time;

      setCharacters(prev => prev.map(ch => {
        // 1. Animation frame calculations
        let nextFrame = ch.frame;
        let nextFrameTimer = ch.frameTimer + dt;
        const frameDuration = ch.state === "walk" ? 0.15 : 0.25;

        if (nextFrameTimer >= frameDuration) {
          nextFrameTimer -= frameDuration;
          if (ch.state === "walk") {
            nextFrame = (nextFrame + 1) % 4; // frames 0 to 3
          } else if (ch.state === "typing") {
            // Typing frames are col 4 and 5
            nextFrame = 4 + ((nextFrame - 4 + 1) % 2);
          } else {
            nextFrame = 6; // static pose (col 6)
          }
        }

        // 2. Position updates (Wanderers only)
        if (ch.isWanderer) {
          if (ch.state === "walk") {
            const dx = ch.targetX - ch.x;
            const dy = ch.targetY - ch.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 2) {
              // Arrived at destination
              return {
                ...ch,
                x: ch.targetX,
                y: ch.targetY,
                state: "idle",
                frame: 6,
                frameTimer: 0,
                idleTimer: 2 + Math.random() * 4 // Rest for 2-6 seconds
              };
            } else {
              // Move towards target
              const moveDist = ch.speed * dt;
              const ratio = Math.min(1, moveDist / dist);
              const nextX = ch.x + dx * ratio;
              const nextY = ch.y + dy * ratio;

              // Update direction based on travel vector
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
          }

          if (ch.state === "idle") {
            const nextIdleTimer = ch.idleTimer - dt;
            if (nextIdleTimer <= 0) {
              // Select a new random waypoint to walk to
              const nextWp = WAYPOINTS[Math.floor(Math.random() * WAYPOINTS.length)];
              return {
                ...ch,
                state: "walk",
                targetX: nextWp.x,
                targetY: nextWp.y,
                frame: 0,
                frameTimer: 0,
                idleTimer: 0
              };
            }
            return {
              ...ch,
              frame: 6,
              idleTimer: nextIdleTimer
            };
          }
        }

        // Sitting at desk: update typing frames only
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
  }, [characters.length]);

  const handleCharacterClick = (ch) => {
    retroAudio.playClick();
    setSelectedAsset({ id: ch.id, symbol: ch.symbol });
  };

  return (
    <div className="office-container fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>🏢 ออฟฟิศเทรดเดอร์ 8-bit</h3>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          ตัวละครนั่งโต๊ะแทนสินทรัพย์ 6 อันแรก | ส่วนที่เหลือจะเดินเล่นรอบห้อง
        </span>
      </div>

      <div className="office-screen">
        {/* Floor grid */}
        <div className="office-floor">
          {Array.from({ length: 8 }).map((_, r) => (
            Array.from({ length: 14 }).map((_, c) => {
              const isWall = r === 0;
              return (
                <div 
                  key={`${r}-${c}`} 
                  className={isWall ? "tile-wall" : "tile-floor"}
                />
              );
            })
          ))}
        </div>

        {/* Static Office Furniture */}
        {/* Wall Decorations */}
        <div className="office-furniture" style={{ left: 10 * 48, top: 4, width: 64, height: 44, background: "url(/assets/furniture/WHITEBOARD/WHITEBOARD.png) no-repeat", backgroundSize: "contain", zIndex: 48 }} />
        <div className="office-furniture" style={{ left: 1 * 48, top: 8, width: 32, height: 32, background: "url(/assets/furniture/CLOCK/CLOCK.png) no-repeat", backgroundSize: "contain", zIndex: 40 }} />
        
        {/* Bookshelves */}
        <div className="office-furniture" style={{ left: 3 * 48, top: 12, width: 48, height: 32, background: "url(/assets/furniture/BOOKSHELF/BOOKSHELF.png) no-repeat", backgroundSize: "contain", zIndex: 44 }} />
        <div className="office-furniture" style={{ left: 7 * 48, top: 12, width: 48, height: 32, background: "url(/assets/furniture/BOOKSHELF/BOOKSHELF.png) no-repeat", backgroundSize: "contain", zIndex: 44 }} />
        
        {/* Sofa Corner */}
        <div className="office-furniture" style={{ left: 12 * 48, top: 6 * 48, width: 64, height: 48, background: "url(/assets/furniture/SOFA/SOFA_FRONT.png) no-repeat", backgroundSize: "contain", transform: "scaleX(-1)", zIndex: 336 }} />
        
        {/* Plants & Coffee */}
        <div className="office-furniture" style={{ left: 12 * 48, top: 1 * 48, width: 32, height: 38, background: "url(/assets/furniture/COFFEE/COFFEE_FRONT.png) no-repeat", backgroundSize: "contain", zIndex: 86 }} />
        <div className="office-furniture" style={{ left: 1 * 48, top: 2.5 * 48, width: 28, height: 36, background: "url(/assets/furniture/PLANT/PLANT.png) no-repeat", backgroundSize: "contain", zIndex: 156 }} />
        
        {/* Desks and PCs */}
        {DESK_POSITIONS.map((pos, i) => (
          <React.Fragment key={`furniture-${i}`}>
            {/* Desk */}
            <div 
              className="office-furniture" 
              style={{ left: pos.x + 8, top: pos.y, width: 32, height: 28, background: "url(/assets/furniture/DESK/DESK_FRONT.png) no-repeat", backgroundSize: "contain", zIndex: pos.y + 28 }} 
            />
            {/* PC */}
            <div 
              className="office-furniture" 
              style={{ left: pos.x + 14, top: pos.y - 12, width: 20, height: 16, background: "url(/assets/furniture/PC/PC_BACK.png) no-repeat", backgroundSize: "contain", zIndex: pos.y + 4 }} 
            />
          </React.Fragment>
        ))}

        {/* Rendering Characters */}
        {characters.map(ch => {
          const isUpTrend = ch.change >= 0;
          const pctStr = `${isUpTrend ? "+" : ""}${ch.change.toFixed(1)}%`;
          const showBubble = activeSpeech === ch.symbol;

          // Background offsets
          // Sheet contains 7 frames (width 112px, frame size 16x24)
          // X: frame * -48px
          // Y: direction * -72px (DOWN=0, UP=1, RIGHT=2, LEFT=3)
          const posX = ch.frame * -48;
          const posY = ch.dir * -72;

          return (
            <div 
              key={ch.symbol}
              className="sprite-char-wrapper"
              style={{ 
                left: ch.x, 
                top: ch.y - 28, // height offset so feet align with grid cell
                cursor: "pointer",
                zIndex: Math.floor(ch.y)
              }}
              onMouseEnter={() => setActiveSpeech(ch.symbol)}
              onMouseLeave={() => setActiveSpeech(null)}
              onClick={() => handleCharacterClick(ch)}
            >
              {/* Floating speech bubble indicating PnL on hover */}
              {showBubble && (
                <div className={`sprite-char-bubble ${isUpTrend ? "bubble-up" : "bubble-down"}`}>
                  {ch.symbol} {pctStr}
                </div>
              )}

              {/* Character sprite sheet */}
              <div 
                className="sprite-char"
                style={{
                  backgroundImage: `url(/assets/characters/char_${ch.charId}.png)`,
                  backgroundPosition: `${posX}px ${posY}px`
                }}
              />

              {/* Floating Name Tag */}
              <div className="sprite-char-nametag">
                {ch.symbol}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
