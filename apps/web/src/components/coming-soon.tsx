'use client';

import { EmptyState, PageHeader, buttonStyles } from '@dairy/ui';
import { Hammer } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const KNOWN = new Set([
  'animals',
  'milk',
  'breeding',
  'health',
  'feed',
  'money',
  'people',
  'stock',
  'reports',
  'settings',
  'help',
]);

export function ComingSoon({ module }: { module: string }) {
  const { t } = useTranslation();
  const title = KNOWN.has(module) ? t(`nav.${module}` as 'nav.animals') : t('state.notFoundTitle');
  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        icon={Hammer}
        title={t('comingSoon.title')}
        body={t('comingSoon.body')}
        action={
          <Link href="/" className={buttonStyles({ variant: 'primary' })}>
            {t('comingSoon.back')}
          </Link>
        }
      />
    </>
  );
}
