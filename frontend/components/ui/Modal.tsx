export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg border border-orange-100">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold text-primary-dark">{title}</h3>
          <button onClick={onClose} className="text-slate-500">ปิด</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
