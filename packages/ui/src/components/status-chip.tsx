import {
  Baby,
  CircleDashed,
  Droplet,
  HeartPulse,
  Sun,
  Thermometer,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';

export type AnimalStatus = 'lactating' | 'dry' | 'pregnant' | 'calf' | 'sick' | 'inactive';

const STYLES: Record<AnimalStatus, { className: string; Icon: LucideIcon }> = {
  lactating: { className: 'bg-status-lactating-soft text-status-lactating', Icon: Droplet },
  dry: { className: 'bg-status-dry-soft text-status-dry', Icon: Sun },
  pregnant: { className: 'bg-status-pregnant-soft text-status-pregnant', Icon: HeartPulse },
  calf: { className: 'bg-status-calf-soft text-status-calf', Icon: Baby },
  sick: { className: 'bg-status-sick-soft text-status-sick', Icon: Thermometer },
  inactive: { className: 'bg-status-inactive-soft text-status-inactive', Icon: CircleDashed },
};

interface StatusChipProps {
  status: AnimalStatus;
  className?: string;
}

/** Status is always icon + text, never colour alone. */
export function StatusChip({ status, className }: StatusChipProps) {
  const { t } = useTranslation();
  const { className: tone, Icon } = STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium',
        tone,
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {t(`status.${status}`)}
    </span>
  );
}
