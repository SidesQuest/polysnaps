const audioCtx =
  typeof window !== "undefined"
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;
let muted = false;
let masterVolume = 0.5;

const STORAGE_KEY = "polysnaps_volume";

if (typeof localStorage !== "undefined") {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) masterVolume = parseFloat(saved) || 0.5;
}

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

export function getVolume() {
  return masterVolume;
}

export function setVolume(val) {
  masterVolume = Math.max(0, Math.min(1, val));
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, String(masterVolume));
  }
}

function playTone(freq, duration, type = "square", volume = 0.15) {
  if (!audioCtx || muted) return;
  if (audioCtx.state === "suspended") audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  const vol = volume * masterVolume;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
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
  playTone(800, 0.06, "square", 0.12);
}

export function playPlace() {
  playTone(440, 0.12, "triangle", 0.14);
  setTimeout(() => playTone(660, 0.12, "triangle", 0.14), 60);
}

export function playUpgrade() {
  playTone(523, 0.1, "square", 0.12);
  setTimeout(() => playTone(659, 0.1, "square", 0.12), 80);
  setTimeout(() => playTone(784, 0.14, "square", 0.12), 160);
}

export function playPrestige() {
  const notes = [440, 554, 659, 880];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.25, "sine", 0.16), i * 120);
  });
}

export function playCombo() {
  playTone(880, 0.18, "sine", 0.14);
  setTimeout(() => playTone(1100, 0.18, "sine", 0.14), 100);
  setTimeout(() => playTone(1320, 0.3, "sine", 0.16), 200);
}

export function playError() {
  playTone(200, 0.15, "sawtooth", 0.08);
}

export function playBurst() {
  playTone(330, 0.1, "sine", 0.14);
  setTimeout(() => playTone(523, 0.12, "sine", 0.16), 60);
  setTimeout(() => playTone(784, 0.18, "sine", 0.16), 130);
  setTimeout(() => playTone(1047, 0.25, "sine", 0.14), 220);
}

export function playAchievement() {
  const notes = [659, 784, 988, 1319];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, "sine", 0.14), i * 80);
  });
  setTimeout(() => playTone(1319, 0.4, "triangle", 0.12), 340);
}
