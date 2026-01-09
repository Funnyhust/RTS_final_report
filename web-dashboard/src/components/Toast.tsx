export type ToastItem = {
  id: string;
  message: string;
  tone?: "alarm" | "warn" | "info";
};

type ToastStackProps = {
  items: ToastItem[];
};

export function ToastStack({ items }: ToastStackProps) {
  if (items.length === 0) return null;

  return (
    <div className="toast-stack">
      {items.map((toast) => (
        <div key={toast.id} className={`toast ${toast.tone ?? "info"}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
