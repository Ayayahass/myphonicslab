function playSound(letter, isCapital = false) {
  // إذا كان الحرف كبير استخدم الملف الكبير
  const fileName = isCapital ? `${letter.toUpperCase()}.mp3` : `${letter.toLowerCase()}.mp3`;
  
  const audio = new Audio(`sounds/${fileName}`);
  audio.play().catch(() => {
    alert(`الصوت غير موجود: sounds/${fileName}`);
  });
}
