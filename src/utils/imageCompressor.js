/**
 * Compresses an image to max 1024px width/height and 75% JPEG quality.
 * Returns a Promise resolving to { base64, mime }.
 */
export const compressImage = (file) => new Promise((resolve) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    URL.revokeObjectURL(url);
    const MAX = 1024;
    let { width, height } = img;
    if (width > MAX || height > MAX) {
      if (width > height) {
        height = Math.round(height * MAX / width);
        width = MAX;
      } else {
        width = Math.round(width * MAX / height);
        height = MAX;
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ base64: reader.result.split(",")[1], mime: "image/jpeg" });
      reader.readAsDataURL(blob);
    }, "image/jpeg", 0.75);
  };
  img.onerror = () => {
    // Fallback: use original file uncompressed
    const reader = new FileReader();
    reader.onload = () => resolve({ base64: reader.result.split(",")[1], mime: file.type || "image/jpeg" });
    reader.readAsDataURL(file);
  };
  img.src = url;
});
