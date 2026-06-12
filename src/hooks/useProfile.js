import { useState, useEffect } from "react";

export function useProfile({ user, showToast, onSessionExpired }) {
  const [portfolioName, setPortfolioName] = useState(() => localStorage.getItem(`portfolio_name_${user.username}`) || "StockVault");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [investorModalOpen, setInvestorModalOpen] = useState(false);
  
  const [profilePic, setProfilePic] = useState(() => localStorage.getItem(`profile_pic_${user.username}`) || "");
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [nickname, setNickname] = useState(() => localStorage.getItem(`profile_nickname_${user.username}`) || "");
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");

  // New Profile Fields
  const [firstName, setFirstName] = useState(() => localStorage.getItem(`profile_firstname_${user.username}`) || "");
  const [lastName, setLastName] = useState(() => localStorage.getItem(`profile_lastname_${user.username}`) || "");
  const [birthday, setBirthday] = useState(() => localStorage.getItem(`profile_birthday_${user.username}`) || "");
  const [traderStyle, setTraderStyle] = useState(() => localStorage.getItem(`profile_trader_style_${user.username}`) || "Value Investor (VI)");
  const [experience, setExperience] = useState(() => localStorage.getItem(`profile_experience_${user.username}`) || "Beginner");
  const [riskLevel, setRiskLevel] = useState(() => localStorage.getItem(`profile_risk_level_${user.username}`) || "Medium");
  const [portfolioTarget, setPortfolioTarget] = useState(() => localStorage.getItem(`profile_portfolio_target_${user.username}`) || "");
  const [targetYield, setTargetYield] = useState(() => localStorage.getItem(`profile_target_yield_${user.username}`) || "");
  const [favoriteStock, setFavoriteStock] = useState(() => localStorage.getItem(`profile_favorite_stock_${user.username}`) || "");
  const [bio, setBio] = useState(() => localStorage.getItem(`profile_bio_${user.username}`) || "");

  // Temp Edit States
  const [newNickname, setNewNickname] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newBirthday, setNewBirthday] = useState("");
  const [newTraderStyle, setNewTraderStyle] = useState("Value Investor (VI)");
  const [newExperience, setNewExperience] = useState("Beginner");
  const [newRiskLevel, setNewRiskLevel] = useState("Medium");
  const [newPortfolioTarget, setNewPortfolioTarget] = useState("");
  const [newTargetYield, setNewTargetYield] = useState("");
  const [newFavoriteStock, setNewFavoriteStock] = useState("");
  const [newBio, setNewBio] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (profileModalOpen) { setNewNickname(nickname); setOldPassword(""); setNewPassword(""); }
  }, [profileModalOpen, nickname]);

  useEffect(() => {
    if (investorModalOpen) {
      setNewFirstName(firstName); setNewLastName(lastName); setNewNickname(nickname); setNewBirthday(birthday);
      setNewTraderStyle(traderStyle); setNewExperience(experience); setNewRiskLevel(riskLevel);
      setNewPortfolioTarget(portfolioTarget); setNewTargetYield(targetYield); setNewFavoriteStock(favoriteStock); setNewBio(bio);
    }
  }, [investorModalOpen, firstName, lastName, nickname, birthday, traderStyle, experience, riskLevel, portfolioTarget, targetYield, favoriteStock, bio]);

  // Dynamic Age Calculation from Birthday (YYYY-MM-DD)
  const getAge = () => {
    if (!birthday) return null;
    const today = new Date();
    const birthDate = new Date(birthday);
    if (isNaN(birthDate.getTime())) return null;
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const syncProfileToServer = async (firstArg, pic, nick) => {
    if (user.username === "local_user") return;
    try {
      const bodyData = (typeof firstArg === "object" && firstArg !== null) ? firstArg : { portfolioName: firstArg, profilePic: pic, nickname: nick };
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${user.token}` },
        body: JSON.stringify(bodyData)
      });
      if (res.status === 401 && onSessionExpired) onSessionExpired();
    } catch (err) {
      console.error("Profile sync failed:", err);
    }
  };

  useEffect(() => {
    const fetchProfileSync = async () => {
      try {
        const res = await fetch("/api/profile", { headers: { "Authorization": `Bearer ${user.token}` } });
        if (res.status === 401 && onSessionExpired) { onSessionExpired(); return; }
        if (res.ok) {
          const data = await res.json();
          if (data.portfolioName) { setPortfolioName(data.portfolioName); localStorage.setItem(`portfolio_name_${user.username}`, data.portfolioName); }
          if (data.profilePic !== undefined) { setProfilePic(data.profilePic); localStorage.setItem(`profile_pic_${user.username}`, data.profilePic); }
          if (data.nickname !== undefined) { setNickname(data.nickname); localStorage.setItem(`profile_nickname_${user.username}`, data.nickname); }
          if (data.firstName !== undefined) { setFirstName(data.firstName); localStorage.setItem(`profile_firstname_${user.username}`, data.firstName); }
          if (data.lastName !== undefined) { setLastName(data.lastName); localStorage.setItem(`profile_lastname_${user.username}`, data.lastName); }
          if (data.birthday !== undefined) { setBirthday(data.birthday); localStorage.setItem(`profile_birthday_${user.username}`, data.birthday); }
          if (data.traderStyle !== undefined) { setTraderStyle(data.traderStyle); localStorage.setItem(`profile_trader_style_${user.username}`, data.traderStyle); }
          if (data.experience !== undefined) { setExperience(data.experience); localStorage.setItem(`profile_experience_${user.username}`, data.experience); }
          if (data.riskLevel !== undefined) { setRiskLevel(data.riskLevel); localStorage.setItem(`profile_risk_level_${user.username}`, data.riskLevel); }
          if (data.portfolioTarget !== undefined) { setPortfolioTarget(data.portfolioTarget); localStorage.setItem(`profile_portfolio_target_${user.username}`, data.portfolioTarget); }
          if (data.targetYield !== undefined) { setTargetYield(data.targetYield); localStorage.setItem(`profile_target_yield_${user.username}`, data.targetYield); }
          if (data.favoriteStock !== undefined) { setFavoriteStock(data.favoriteStock); localStorage.setItem(`profile_favorite_stock_${user.username}`, data.favoriteStock); }
          if (data.bio !== undefined) { setBio(data.bio); localStorage.setItem(`profile_bio_${user.username}`, data.bio); }
        }
      } catch (err) {
        console.error("Failed to fetch synced profile:", err);
      }
    };
    fetchProfileSync();
  }, [user.token, user.username, onSessionExpired]);

  const handleSaveName = async () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      setPortfolioName(trimmed);
      localStorage.setItem(`portfolio_name_${user.username}`, trimmed);
      await syncProfileToServer({
        portfolioName: trimmed, profilePic, nickname, firstName, lastName, birthday, traderStyle, experience, riskLevel, portfolioTarget, targetYield, favoriteStock, bio
      });
    }
    setIsEditingName(false);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast("ขนาดไฟล์ต้องไม่เกิน 10MB", "error"); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width, height = img.height;
        const MAX_DIM = 300;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
          else { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d"); ctx.drawImage(img, 0, 0, width, height);
        setProfilePic(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => { showToast("ไม่สามารถประมวลผลไฟล์รูปภาพนี้ได้", "error"); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    try {
      const trimmedNickname = newNickname.trim(), trimmedFirstName = newFirstName.trim(), trimmedLastName = newLastName.trim(), trimmedPortfolioTarget = newPortfolioTarget.trim(), trimmedTargetYield = newTargetYield.trim(), trimmedFavoriteStock = newFavoriteStock.trim(), trimmedBio = newBio.trim();

      localStorage.setItem(`profile_nickname_${user.username}`, trimmedNickname); setNickname(trimmedNickname);
      localStorage.setItem(`profile_pic_${user.username}`, profilePic);
      localStorage.setItem(`profile_firstname_${user.username}`, trimmedFirstName); setFirstName(trimmedFirstName);
      localStorage.setItem(`profile_lastname_${user.username}`, trimmedLastName); setLastName(trimmedLastName);
      localStorage.setItem(`profile_birthday_${user.username}`, newBirthday); setBirthday(newBirthday);
      localStorage.setItem(`profile_trader_style_${user.username}`, newTraderStyle); setTraderStyle(newTraderStyle);
      localStorage.setItem(`profile_experience_${user.username}`, newExperience); setExperience(newExperience);
      localStorage.setItem(`profile_risk_level_${user.username}`, newRiskLevel); setRiskLevel(newRiskLevel);
      localStorage.setItem(`profile_portfolio_target_${user.username}`, trimmedPortfolioTarget); setPortfolioTarget(trimmedPortfolioTarget);
      localStorage.setItem(`profile_target_yield_${user.username}`, trimmedTargetYield); setTargetYield(trimmedTargetYield);
      localStorage.setItem(`profile_favorite_stock_${user.username}`, trimmedFavoriteStock); setFavoriteStock(trimmedFavoriteStock);
      localStorage.setItem(`profile_bio_${user.username}`, trimmedBio); setBio(trimmedBio);

      showToast("บันทึกข้อมูลโปรไฟล์สำเร็จ!", "success");
      setInvestorModalOpen(false);

      await syncProfileToServer({
        portfolioName, profilePic, nickname: trimmedNickname, firstName: trimmedFirstName, lastName: trimmedLastName, birthday: newBirthday, traderStyle: newTraderStyle, experience: newExperience, riskLevel: newRiskLevel, portfolioTarget: trimmedPortfolioTarget, targetYield: trimmedTargetYield, favoriteStock: trimmedFavoriteStock, bio: trimmedBio
      });
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการบันทึกโปรไฟล์", "error");
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) { showToast("กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่ให้ครบถ้วน", "error"); return; }
    if (newPassword.length < 6) { showToast("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร", "error"); return; }
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, oldPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ", "error"); return; }
      showToast("เปลี่ยนรหัสผ่านสำเร็จแล้ว!", "success");
      setOldPassword(""); setNewPassword("");
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน", "error");
    }
  };

  return {
    portfolioName, setPortfolioName, isEditingName, setIsEditingName, tempName, setTempName,
    profileModalOpen, setProfileModalOpen, investorModalOpen, setInvestorModalOpen,
    profilePic, setProfilePic, avatarPreviewOpen, setAvatarPreviewOpen, avatarHovered,
    setAvatarHovered, presetModalOpen, setPresetModalOpen, nickname, setNickname,
    geminiKey, setGeminiKey, firstName, setFirstName, lastName, setLastName,
    birthday, setBirthday, traderStyle, setTraderStyle, experience, setExperience,
    riskLevel, setRiskLevel, portfolioTarget, setPortfolioTarget, targetYield, setTargetYield,
    favoriteStock, setFavoriteStock, bio, setBio, newNickname, setNewNickname,
    newFirstName, setNewFirstName, newLastName, setNewLastName, newBirthday, setNewBirthday,
    newTraderStyle, setNewTraderStyle, newExperience, setNewExperience, newRiskLevel, setNewRiskLevel,
    newPortfolioTarget, setNewPortfolioTarget, newTargetYield, setNewTargetYield,
    newFavoriteStock, setNewFavoriteStock, newBio, setNewBio, oldPassword, setOldPassword,
    newPassword, setNewPassword, handleSaveName, handleAvatarUpload, handleSaveProfile,
    handleChangePassword, syncProfileToServer, getAge
  };
}
