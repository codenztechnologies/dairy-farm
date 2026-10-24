import { notFound } from 'next/navigation';
import { DesignSystemView } from '@/components/design-system-view';

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <DesignSystemView />;
}
