import { notFound } from 'next/navigation';
import { DesignSystemView } from '@/components/design-system-view';
import { PREVIEW_ROUTES } from '@/lib/preview';

export default function DesignSystemPage() {
  if (!PREVIEW_ROUTES) notFound();
  return <DesignSystemView />;
}
