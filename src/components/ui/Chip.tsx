import { cn } from '@/src/lib/utils';

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  error?: boolean;
}

export const Chip = ({ label, selected, onClick }: ChipProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-12 px-6 rounded-custom text-sm font-medium transition-all border",
        selected
          ? "bg-primary border-primary text-white"
          : "bg-white border-gris-border text-gris-med hover:border-gris-light"
      )}
    >
      {label}
    </button>
  );
};
