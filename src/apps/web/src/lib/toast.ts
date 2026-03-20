type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (toasts: Toast[]) => void;

let nextId = 0;
let toasts: Toast[] = [];
const listeners: Set<Listener> = new Set();

function notify() {
  for (const listener of listeners) {
    listener([...toasts]);
  }
}

export function showToast(message: string, type: ToastType = 'success') {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  notify();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 3000);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts(): Toast[] {
  return toasts;
}

export type { Toast };
