const audioContext = new AudioContext();

function playBeep(frequency: number, duration: number, volume: number = 0.3) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

export function playAddToCartSound() {
  playBeep(800, 0.1);
}

export function playCashRegisterSound() {
  playBeep(600, 0.15);
  setTimeout(() => playBeep(800, 0.15), 100);
  setTimeout(() => playBeep(1000, 0.2), 200);
}

export function playErrorSound() {
  playBeep(200, 0.3, 0.5);
  setTimeout(() => playBeep(180, 0.3, 0.5), 150);
}

export function playSuccessSound() {
  playBeep(523, 0.1);
  setTimeout(() => playBeep(659, 0.1), 100);
  setTimeout(() => playBeep(784, 0.15), 200);
}
