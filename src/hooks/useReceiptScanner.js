import { useState, useCallback } from "react";
import { compressImage } from "../utils/imageCompressor";
import { validateParsedReceipt } from "../utils/ocrParser";

export function useReceiptScanner({
  scannedQueue,
  setScannedQueue,
  setSymbol,
  setQuery,
  setName,
  setType,
  setQty,
  setPrice,
  setDate,
  setTime,
  setBroker,
  setTxType,
  setConfirmed,
  triggerToast,
  onSessionExpired
}) {
  const [scanning, setScanning] = useState(false);
  const [scanningStatus, setScanningStatus] = useState({ active: false, total: 0, completed: 0 });

  const processReceiptImages = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setScanning(true);
    setScanningStatus({ active: true, total: fileList.length, completed: 0, stage: "กำลังเตรียมไฟล์..." });

    const newScannedItems = [];
    const fileErrors = {};

    setScanningStatus(prev => ({ ...prev, stage: "📦 กำลังบีบอัดรูปภาพ..." }));
    const imagesToProcess = [];
    for (let idx = 0; idx < fileList.length; idx++) {
      try {
        const { base64, mime } = await compressImage(fileList[idx]);
        imagesToProcess.push({ index: idx, base64, mime });
      } catch (compressErr) {
        fileErrors[idx] = `รูป ${idx + 1} (Compression): ${compressErr.message}`;
      }
    }

    let completedImages = 0;
    const userSession = localStorage.getItem("portfolio_user");
    let token = "";
    if (userSession) {
      try {
        token = JSON.parse(userSession)?.token || "";
      } catch (_) {}
    }

    for (const img of imagesToProcess) {
      const idx = img.index;
      setScanningStatus(prev => ({
        ...prev,
        stage: `🤖 กำลังสแกนรูปที่ ${completedImages + 1}/${imagesToProcess.length}...`
      }));

      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            images: [{ base64: img.base64, mime: img.mime }],
            skipSave: true
          })
        });

        if (!res.ok) {
          if (res.status === 401 && onSessionExpired) {
            onSessionExpired();
            return;
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server status ${res.status}`);
        }

        const data = await res.json();
        if (data.errors && data.errors.length > 0) {
          throw new Error(data.errors[0].error);
        }

        if (data.results && data.results.length > 0) {
          const resObj = data.results[0];
          console.log(`🤖 [Scan Debug] Image ${idx + 1} — AI Raw:`, resObj.raw_ai);
          console.log(`🤖 [Scan Debug] Image ${idx + 1} — Validated:`, { action: resObj.action, symbol: resObj.symbol, price: resObj.actual_price, shares: resObj.share_amount, timestamp: resObj.timestamp });
          const ts = resObj.timestamp || "";
          const dateStr = ts ? ts.split("T")[0] : new Date().toISOString().split("T")[0];
          const timeStr = ts && ts.includes("T") ? ts.split("T")[1].slice(0, 5) : "";

          const validated = validateParsedReceipt({
            symbol:          resObj.symbol,
            name:            resObj.symbol,
            category:        "stock",
            qty:             resObj.share_amount,
            price:           resObj.actual_price,
            date:            dateStr,
            time:            timeStr,
            transactionType: resObj.action
          }, idx);

          if (validated) {
            if (validated.category === "stock" || validated.category === "gold") {
              try {
                const checkRes = await fetch(`/api/prices?q=${encodeURIComponent(validated.symbol)}`);
                if (checkRes.ok) {
                  const suggestions = await checkRes.json();
                  if (suggestions && suggestions.length > 0) {
                    const matched = suggestions.find(s => 
                      s.symbol.toUpperCase() === validated.symbol.toUpperCase() ||
                      s.symbol.toUpperCase().startsWith(validated.symbol.toUpperCase() + ".")
                    );
                    if (matched) {
                      validated.symbol = matched.symbol;
                      validated.name = matched.name;
                    }
                  }
                }
              } catch (err) {
                console.warn("Failed to auto-map OCR symbol:", err);
              }
            }

            newScannedItems.push({
              id: `${Date.now()}-workers-ai-${idx}`,
              symbol:          validated.symbol,
              name:            validated.name,
              type:            validated.category,
              qty:             String(validated.qty),
              avgPrice:        String(validated.price),
              date:            validated.date,
              time:            validated.time,
              broker:          "Dime!",
              transactionType: validated.transactionType
            });
            delete fileErrors[idx];
          } else {
            fileErrors[idx] = `รูป ${idx + 1}: AI สแกนผ่านแต่ข้อมูลไม่สมบูรณ์`;
          }
        } else {
          throw new Error("No results returned from server-side scan");
        }
      } catch (scanErr) {
        console.error(`Cloudflare scan failed for image ${idx + 1}:`, scanErr.message);
        fileErrors[idx] = `รูป ${idx + 1}: สแกนไม่สำเร็จ — ${scanErr.message}`;
      }

      completedImages++;
      setScanningStatus(prev => ({
        ...prev,
        completed: Math.min(fileList.length, completedImages)
      }));
    }

    setScanningStatus(prev => ({ ...prev, completed: fileList.length }));

    if (newScannedItems.length > 0) {
      newScannedItems.sort((a, b) => {
        const dtA = `${a.date || ""}T${a.time || "00:00"}`;
        const dtB = `${b.date || ""}T${b.time || "00:00"}`;
        return dtA.localeCompare(dtB);
      });

      if (newScannedItems.length === 1 && scannedQueue.length === 0) {
        const item = newScannedItems[0];
        setSymbol(item.symbol);
        setQuery(item.symbol);
        setName(item.name);
        setType(item.type);
        setQty(item.qty ? item.qty.toString() : "");
        setPrice(item.avgPrice ? item.avgPrice.toString() : "");
        setDate(item.date);
        setTime(item.time || "");
        setBroker(item.broker || "Dime!");
        setTxType(item.transactionType);
        setConfirmed(true);
        triggerToast(`🤖 สแกนใบเสร็จสำเร็จ!\nดึงข้อมูล: ${item.symbol} (${item.transactionType === "BUY" ? "ซื้อ/ฝาก" : "ขาย/ถอน"} · ${item.qty} หน่วย @ $${item.avgPrice})`, "success");
      } else {
        setScannedQueue(prev => {
          const combined = [...prev, ...newScannedItems];
          combined.sort((a, b) => {
            const dtA = `${a.date || ""}T${a.time || "00:00"}`;
            const dtB = `${b.date || ""}T${b.time || "00:00"}`;
            return dtA.localeCompare(dtB);
          });
          return combined;
        });
        triggerToast(`🤖 สแกนสำเร็จ ${newScannedItems.length} รายการ! ตรวจสอบและยืนยันด้านล่าง`, "success");
      }
    }

    const errors = Object.values(fileErrors);
    if (errors.length > 0) {
      triggerToast(`⚠️ สแกนเสร็จ (พบข้อผิดพลาด ${errors.length} รายการ):\n${errors.slice(0, 3).join("\n")}${errors.length > 3 ? `\n...และอีก ${errors.length - 3} รายการ` : ""}`, "warning");
    }

    setScanning(false);
    setScanningStatus({ active: false, total: 0, completed: 0 });
  }, [scannedQueue, setScannedQueue, setSymbol, setQuery, setName, setType, setQty, setPrice, setDate, setTime, setBroker, setTxType, setConfirmed, triggerToast]);

  const handleDropReceipt = useCallback((e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) processReceiptImages(files);
  }, [processReceiptImages]);

  const handleFileSelect = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) processReceiptImages(files);
  }, [processReceiptImages]);

  return {
    scanning,
    scanningStatus,
    processReceiptImages,
    handleDropReceipt,
    handleFileSelect
  };
}
