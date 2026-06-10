import { useState, useEffect } from "react";

export function useProfile({ user, showToast, onSessionExpired }) {
  const [portfolioName, setPortfolioName] = useState(() => localStorage.getItem(`portfolio_name_${user.username}`) || "StockVault");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profilePic, setProfilePic] = useState(() => localStorage.getItem(`profile_pic_${user.username}`) || "");
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [nickname, setNickname] = useState(() => localStorage.getItem(`profile_nickname_${user.username}`) || "");
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");

  const [newNickname, setNewNickname] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (profileModalOpen) {
      setNewNickname(nickname);
      setOldPassword("");
      setNewPassword("");
    }
  }, [profileModalOpen, nickname]);

  const syncProfileToServer = async (name, pic, nick) => {
    if (user.username === "local_user") return;
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          portfolioName: name,
          profilePic: pic,
          nickname: nick
        })
      });
      if (res.status === 401 && onSessionExpired) {
        onSessionExpired();
        return;
      }
    } catch (err) {
      console.error("Profile sync failed:", err);
    }
  };

  useEffect(() => {
    const fetchProfileSync = async () => {
      try {
        const res = await fetch("/api/profile", {
          headers: { "Authorization": `Bearer ${user.token}` }
        });
        if (res.status === 401 && onSessionExpired) {
          onSessionExpired();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data.portfolioName) {
            setPortfolioName(data.portfolioName);
            localStorage.setItem(`portfolio_name_${user.username}`, data.portfolioName);
          }
          if (data.profilePic) {
            setProfilePic(data.profilePic);
            localStorage.setItem(`profile_pic_${user.username}`, data.profilePic);
          }
          if (data.nickname) {
            setNickname(data.nickname);
            localStorage.setItem(`profile_nickname_${user.username}`, data.nickname);
          }
        }
      } catch (err) {
        console.error("Failed to fetch synced profile:", err);
      }
    };
    fetchProfileSync();
  }, [user.token, user.username]);

  const handleSaveName = async () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      setPortfolioName(trimmed);
      localStorage.setItem(`portfolio_name_${user.username}`, trimmed);
      await syncProfileToServer(trimmed, profilePic, nickname);
    }
    setIsEditingName(false);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("ขนาดไฟล์ต้องไม่เกิน 10MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_DIM = 300;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setProfilePic(compressedDataUrl);
      };
      img.onerror = () => {
        showToast("ไม่สามารถประมวลผลไฟล์รูปภาพนี้ได้", "error");
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    try {
      const trimmedNickname = newNickname.trim();
      localStorage.setItem(`profile_nickname_${user.username}`, trimmedNickname);
      setNickname(trimmedNickname);
      localStorage.setItem(`profile_pic_${user.username}`, profilePic);
      showToast("บันทึกข้อมูลโปรไฟล์สำเร็จ!", "success");
      setProfileModalOpen(false);
      await syncProfileToServer(portfolioName, profilePic, trimmedNickname);
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการบันทึกโปรไฟล์", "error");
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      showToast("กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่ให้ครบถ้วน", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร", "error");
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          oldPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ", "error");
        return;
      }
      showToast("เปลี่ยนรหัสผ่านสำเร็จแล้ว!", "success");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน", "error");
    }
  };

  return {
    portfolioName,
    setPortfolioName,
    isEditingName,
    setIsEditingName,
    tempName,
    setTempName,
    profileModalOpen,
    setProfileModalOpen,
    profilePic,
    setProfilePic,
    avatarPreviewOpen,
    setAvatarPreviewOpen,
    avatarHovered,
    setAvatarHovered,
    presetModalOpen,
    setPresetModalOpen,
    nickname,
    setNickname,
    geminiKey,
    setGeminiKey,
    newNickname,
    setNewNickname,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    handleSaveName,
    handleAvatarUpload,
    handleSaveProfile,
    handleChangePassword,
    syncProfileToServer
  };
}
