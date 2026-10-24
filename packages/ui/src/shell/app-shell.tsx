import { Menu, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface AppShellProps {
  /** Render function so the same sidebar can appear in the desktop rail and the mobile drawer. */
  sidebar: (options: { mobile: boolean }) => ReactNode;
  topBar: ReactNode;
  children: ReactNode;
  /** Optional banners (offline, sync) shown above the page content. */
  banner?: ReactNode;
}

export function AppShell({ sidebar, topBar, children, banner }: AppShellProps) {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-(--z-toast) focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        {t('actions.skipToContent')}
      </a>

      <aside className="sticky top-0 hidden h-dvh shrink-0 lg:block">
        {sidebar({ mobile: false })}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-(--z-sticky) flex h-(--header-height) items-center gap-3 border-b border-border bg-surface px-4 sm:px-6 lg:px-8">
          <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <Dialog.Trigger
              aria-label={t('nav.primary')}
              className="grid size-(--control-height-md) shrink-0 place-items-center rounded-sm text-text-muted hover:bg-bg-sunken lg:hidden"
            >
              <Menu className="size-5" aria-hidden />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-(--z-overlay) bg-overlay" />
              <Dialog.Content
                aria-describedby={undefined}
                className="fixed inset-y-0 start-0 z-(--z-modal) shadow-lg outline-none"
              >
                <Dialog.Title className="sr-only">{t('nav.primary')}</Dialog.Title>
                <Dialog.Close
                  aria-label={t('actions.close')}
                  className="absolute end-2 top-3 z-10 grid size-9 place-items-center rounded-sm text-text-muted hover:bg-bg-sunken"
                >
                  <X className="size-5" aria-hidden />
                </Dialog.Close>
                {sidebar({ mobile: true })}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          {topBar}
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-(--content-max-width) flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8"
        >
          {banner}
          {children}
        </main>
      </div>
    </div>
  );
}
