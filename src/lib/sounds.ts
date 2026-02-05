const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

export function playCorrectSound() {
  playTone(523.25, 0.1, 'sine', 0.3);
  setTimeout(() => playTone(659.25, 0.1, 'sine', 0.3), 100);
  setTimeout(() => playTone(783.99, 0.15, 'sine', 0.3), 200);
}

export function playWrongSound() {
  playTone(200, 0.15, 'sawtooth', 0.2);
  setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.2), 150);
}

export function playTickSound() {
  playTone(800, 0.05, 'sine', 0.1);
}

export function playCountdownSound() {
  playTone(440, 0.1, 'sine', 0.2);
}

export function playGameOverSound() {
  const notes = [392, 349.23, 329.63, 293.66, 261.63];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.25), i * 150);
  });
}

export function resumeAudioContext() {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}
