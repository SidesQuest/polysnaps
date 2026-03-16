const audioCtx =
  typeof window !== "undefined"
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;
let muted = false;

export function isMuted() {
  return muted;
}
export function setMuted(val) {
  muted = val;
}
export function toggleMute() {
  muted = !muted;
  return muted;
}

function playTone(freq, duration, type = "square", volume = 0.08) {
  if (!audioCtx || muted) return;
  if (audioCtx.state === "suspended") audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + duration,
  );

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export function playClick() {
  playTone(800, 0.06, "square", 0.05);
}

export function playPlace() {
  playTone(440, 0.1, "triangle", 0.06);
  setTimeout(() => playTone(660, 0.1, "triangle", 0.06), 60);
}

export function playUpgrade() {
  playTone(523, 0.08, "square", 0.05);
  setTimeout(() => playTone(659, 0.08, "square", 0.05), 80);
  setTimeout(() => playTone(784, 0.12, "square", 0.05), 160);
}

export function playPrestige() {
  const notes = [440, 554, 659, 880];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, "sine", 0.07), i * 120);
  });
}

export function playCombo() {
  playTone(880, 0.15, "sine", 0.06);
  setTimeout(() => playTone(1100, 0.15, "sine", 0.06), 100);
  setTimeout(() => playTone(1320, 0.25, "sine", 0.08), 200);
}

export function playError() {
  playTone(200, 0.15, "sawtooth", 0.04);
}

export function playBurst() {
  playTone(330, 0.08, "sine", 0.06);
  setTimeout(() => playTone(523, 0.1, "sine", 0.07), 60);
  setTimeout(() => playTone(784, 0.15, "sine", 0.08), 130);
  setTimeout(() => playTone(1047, 0.2, "sine", 0.06), 220);
}

export function playAchievement() {
  const notes = [659, 784, 988, 1319];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.12, "sine", 0.06), i * 80);
  });
  setTimeout(() => playTone(1319, 0.3, "triangle", 0.05), 340);
}
