import { ComingSoon } from '@/components/coming-soon';

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  return <ComingSoon module={module} />;
}
