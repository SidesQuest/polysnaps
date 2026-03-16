let toasts = $state([]);
let nextId = 0;

export function getToasts() {
  return toasts;
}

export function addToast(message, type = "info", duration = 3500) {
  const id = ++nextId;
  toasts.push({ id, message, type, timestamp: Date.now() });
  setTimeout(() => {
    const idx = toasts.findIndex((t) => t.id === id);
    if (idx !== -1) toasts.splice(idx, 1);
  }, duration);
  return id;
}
