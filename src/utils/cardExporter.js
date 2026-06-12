export function exportCardAsImage({
  nickname, firstName, lastName, birthday, traderStyle, experience, riskLevel, portfolioTarget, targetYield, favoriteStock, bio, profilePic, age, badge, totalUSD, totalGainUSD, totalGainPct, assetsCount
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");

  const drawRoundRect = (c, x, y, w, h, r) => {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  };

  const drawContent = (avatarImg) => {
    // 1. Background linear gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 800, 600);
    bgGrad.addColorStop(0, "#0F172A");
    bgGrad.addColorStop(0.5, "#1E1B4B");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 600);

    // Radial glows
    const glow1 = ctx.createRadialGradient(650, 150, 10, 650, 150, 250);
    glow1.addColorStop(0, "rgba(99, 102, 241, 0.25)");
    glow1.addColorStop(1, "rgba(99, 102, 241, 0)");
    ctx.fillStyle = glow1;
    ctx.beginPath();
    ctx.arc(650, 150, 250, 0, Math.PI * 2);
    ctx.fill();

    const glow2 = ctx.createRadialGradient(150, 450, 10, 150, 450, 300);
    glow2.addColorStop(0, "rgba(236, 72, 153, 0.2)");
    glow2.addColorStop(1, "rgba(236, 72, 153, 0)");
    ctx.fillStyle = glow2;
    ctx.beginPath();
    ctx.arc(150, 450, 300, 0, Math.PI * 2);
    ctx.fill();

    // Glowing particles
    const particles = [
      { x: 100, y: 120, r: 8, c: "rgba(6, 182, 212, 0.25)" },
      { x: 250, y: 70, r: 4, c: "rgba(255, 255, 255, 0.3)" },
      { x: 700, y: 220, r: 14, c: "rgba(139, 92, 246, 0.25)" },
      { x: 620, y: 450, r: 20, c: "rgba(236, 72, 153, 0.2)" },
      { x: 400, y: 530, r: 6, c: "rgba(16, 185, 129, 0.2)" },
      { x: 80, y: 350, r: 12, c: "rgba(245, 158, 11, 0.15)" },
      { x: 740, y: 80, r: 8, c: "rgba(6, 182, 212, 0.3)" },
      { x: 320, y: 480, r: 4, c: "rgba(255, 255, 255, 0.4)" }
    ];
    particles.forEach(p => {
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Card Frame
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 12;

    // Card Fill
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    drawRoundRect(ctx, 60, 50, 680, 500, 24);
    ctx.fill();

    // Card Border
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.stroke();

    // Decor line
    ctx.beginPath();
    ctx.moveTo(90, 118);
    ctx.lineTo(710, 118);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.stroke();

    // 3. Header Texts
    ctx.font = "bold 13px 'Segoe UI', Tahoma, Geneva, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.textAlign = "left";
    ctx.fillText("INVESTOR PASSPORT", 90, 95);

    // Experience badge
    const badgeText = badge.text;
    ctx.textAlign = "right";
    
    const badgeW = 110;
    const badgeH = 24;
    const badgeX = 710 - badgeW;
    const badgeY = 78;
    
    let badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
    if (experience === "Legend") {
      badgeGrad.addColorStop(0, "#F59E0B");
      badgeGrad.addColorStop(1, "#D97706");
    } else if (experience === "Expert") {
      badgeGrad.addColorStop(0, "#3B82F6");
      badgeGrad.addColorStop(1, "#1D4ED8");
    } else if (experience === "Intermediate") {
      badgeGrad.addColorStop(0, "#10B981");
      badgeGrad.addColorStop(1, "#047857");
    } else {
      badgeGrad.addColorStop(0, "#94A3B8");
      badgeGrad.addColorStop(1, "#475569");
    }
    ctx.fillStyle = badgeGrad;
    drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 12);
    ctx.fill();
    
    ctx.font = "bold 11px 'Segoe UI', Tahoma, Geneva, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + 16);

    // 4. Draw Avatar Image
    const avatarX = 144;
    const avatarY = 180;
    const avatarR = 46;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.clip();

    if (avatarImg) {
      ctx.drawImage(avatarImg, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fill();
      ctx.font = "36px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("👤", avatarX, avatarY + 12);
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.stroke();

    // 5. User Personal Details
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 22px 'Segoe UI', Tahoma, Geneva, sans-serif";
    ctx.fillText(nickname || "ยังไม่ได้ตั้งชื่อเล่น", 214, 168);

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "14px 'Segoe UI', Tahoma, Geneva, sans-serif";
    ctx.fillText(firstName || lastName ? `${firstName} ${lastName}`.trim() : "ยังไม่ได้ตั้งชื่อจริง", 214, 192);

    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.font = "12px 'Segoe UI', Tahoma, Geneva, sans-serif";
    ctx.fillText(`🎂 ${birthday ? `${birthday} (${age !== null ? `อายุ ${age} ปี` : "ไม่ระบุ"})` : "ไม่ระบุวันเกิด"}`, 214, 214);

    // 6. Grid Parameter Box 1 (INVESTOR PARAMS)
    const box1X = 90;
    const boxY = 250;
    const boxW = 300;
    const boxH = 175;

    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    drawRoundRect(ctx, box1X, boxY, boxW, boxH, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.stroke();

    const drawParam = (title, val, x, y) => {
      ctx.font = "bold 9px 'Segoe UI', sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillText(title, x, y);
      ctx.font = "bold 13px 'Segoe UI', sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(val || "ไม่ได้ระบุ", x, y + 18);
    };

    drawParam("STYLE", traderStyle, box1X + 20, boxY + 28);
    drawParam("RISK TOLERANCE", riskLevel, box1X + 20, boxY + 74);
    drawParam("TARGET PORTFOLIO", portfolioTarget ? `${Number(portfolioTarget).toLocaleString()} THB` : "ไม่ได้ระบุ", box1X + 20, boxY + 120);
    drawParam("TARGET YIELD", targetYield ? `${targetYield} %/Yr` : "ไม่ได้ระบุ", box1X + 160, boxY + 28);
    drawParam("FAVORITE STOCK", favoriteStock ? `⭐ ${favoriteStock}` : "ไม่ได้ระบุ", box1X + 160, boxY + 74);

    // 7. Grid Parameter Box 2 (PORTFOLIO STATS)
    const box2X = 410;
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    drawRoundRect(ctx, box2X, boxY, boxW, boxH, 16);
    ctx.fill();
    ctx.stroke();

    const fmtUSDVal = (val) => {
      if (val == null) return "$0.00";
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
    };

    const gainVal = totalGainUSD || 0;
    const gainPctVal = totalGainPct || 0;
    const gainSign = gainVal >= 0 ? "+" : "";
    const gainColor = gainVal >= 0 ? "#10B981" : "#EF4444";

    drawParam("NET WORTH (USD)", fmtUSDVal(totalUSD), box2X + 20, boxY + 28);
    
    ctx.font = "bold 9px 'Segoe UI', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("TOTAL RETURN", box2X + 20, boxY + 74);
    ctx.font = "bold 13px 'Segoe UI', sans-serif";
    ctx.fillStyle = gainColor;
    ctx.fillText(`${gainSign}${fmtUSDVal(Math.abs(gainVal))} (${gainSign}${gainPctVal.toFixed(2)}%)`, box2X + 20, boxY + 92);

    drawParam("ASSETS TRACKED", assetsCount ? `${assetsCount} Assets` : "0 Assets", box2X + 20, boxY + 120);

    // 8. Quote / Bio
    ctx.font = "italic 13px 'Segoe UI', Tahoma, Geneva, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.textAlign = "center";
    ctx.fillText(`"${bio || "ชีวิตการลงทุนที่เรียบง่าย แต่มีวินัย"}"`, 400, 465);

    // 9. Watermark branding
    ctx.font = "bold 11px 'Segoe UI', Tahoma, Geneva, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("⚡ US STOCK PORTFOLIO PASSPORT", 400, 520);

    // Trigger download
    const link = document.createElement("a");
    link.download = `investor-passport-${nickname || "profile"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (profilePic) {
    const img = new Image();
    img.onload = () => drawContent(img);
    img.onerror = () => drawContent(null);
    img.src = profilePic;
  } else {
    drawContent(null);
  }
}
