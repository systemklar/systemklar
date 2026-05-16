type SaveButtonProps = {
  visible: boolean;
  saving: boolean;
  onClick: () => void;
  label?: string;
};

export function SaveButton({ visible, saving, onClick, label = "Gem ændringer" }: SaveButtonProps) {
  if (!visible) return null;
  return (
    <button
      type="button"
      disabled={saving}
      onClick={onClick}
      className="rounded-full bg-[#0A6EBD] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0859A0] disabled:opacity-60"
    >
      {saving ? "Gemmer…" : label}
    </button>
  );
}
