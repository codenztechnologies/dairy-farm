import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';

interface SpinnerProps {
  className?: string;
  /** Hide from assistive tech when a parent already announces the busy state. */
  decorative?: boolean;
}

/** The only spinner in the product. Respects reduced motion. */
export function Spinner({ className, decorative = false }: SpinnerProps) {
  const { t } = useTranslation();
  return (
    <Loader2
      className={cn('size-4 animate-spin motion-reduce:animate-none', className)}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : t('state.loading')}
      role={decorative ? undefined : 'status'}
    />
  );
}
