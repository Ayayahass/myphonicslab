function playSound(letter) {
  const audio = new Audio(`sounds/${letter}.mp3`);
  audio.play();
}
