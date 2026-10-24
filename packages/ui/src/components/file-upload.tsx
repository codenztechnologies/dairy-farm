import { ImagePlus, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { useFieldContext } from './field';

export interface FileProblem {
  name: string;
  reason: 'type' | 'size' | 'count';
}

interface FileUploadProps {
  files: readonly File[];
  onFilesChange: (files: File[]) => void;
  /** MIME types or extensions, as for <input accept>. */
  accept?: string;
  maxFiles?: number;
  maxSizeBytes?: number;
  /** Called with files that were rejected, so the form can show a clear message. */
  onProblems?: (problems: FileProblem[]) => void;
  disabled?: boolean;
}

function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  return accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .some((rule) =>
      rule.startsWith('.')
        ? file.name.toLowerCase().endsWith(rule)
        : rule.endsWith('/*')
          ? file.type.startsWith(rule.slice(0, -1))
          : file.type === rule,
    );
}

function Thumbnail({ file, onRemove }: { file: File; onRemove: () => void }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string>();
  // FileReader (async) instead of object URLs: nothing to revoke, safe under React strict mode.
  useEffect(() => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setUrl(reader.result);
    };
    reader.readAsDataURL(file);
    return () => {
      reader.abort();
    };
  }, [file]);
  return (
    <li className="relative size-20 overflow-hidden rounded-md border border-border bg-bg-sunken">
      {url ? (
        // Local preview of a file the user just chose; alt text names the file.
        <img src={url} alt={file.name} className="size-full object-cover" />
      ) : (
        <span className="grid size-full place-items-center p-1 text-center text-xs text-text-muted">
          {file.name}
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t('upload.remove', { name: file.name })}
        className="absolute end-1 top-1 grid size-6 place-items-center rounded-full bg-surface-inverse text-text-inverse"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </li>
  );
}

/** Drop zone plus a real file button (keyboard and screen-reader friendly), with removable previews. */
export function FileUpload({
  files,
  onFilesChange,
  accept,
  maxFiles = 5,
  maxSizeBytes = 5 * 1024 * 1024,
  onProblems,
  disabled,
}: FileUploadProps) {
  const { t } = useTranslation();
  const field = useFieldContext();
  const fallbackId = useId();
  const id = field?.id ?? fallbackId;
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function add(list: FileList | null) {
    if (!list) return;
    const problems: FileProblem[] = [];
    const accepted: File[] = [];
    for (const file of Array.from(list)) {
      if (!matchesAccept(file, accept)) problems.push({ name: file.name, reason: 'type' });
      else if (file.size > maxSizeBytes) problems.push({ name: file.name, reason: 'size' });
      else if (files.length + accepted.length >= maxFiles)
        problems.push({ name: file.name, reason: 'count' });
      else accepted.push(file);
    }
    if (accepted.length > 0) onFilesChange([...files, ...accepted]);
    if (problems.length > 0) onProblems?.(problems);
    if (input.current) input.current.value = '';
  }

  return (
    <div className="space-y-3">
      <div
        role="presentation"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => {
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) add(event.dataTransfer.files);
        }}
      >
        <label
          htmlFor={id}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center',
            'transition-colors duration-(--duration-fast) has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
            dragging
              ? 'border-primary bg-primary-softer'
              : 'border-border-input bg-surface hover:bg-bg-sunken',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          <ImagePlus className="size-8 text-text-muted" aria-hidden />
          <span className="text-base font-medium text-text">{t('upload.prompt')}</span>
          <span className="text-sm text-text-muted">
            {t('upload.limits', {
              count: maxFiles,
              size: Math.round(maxSizeBytes / (1024 * 1024)),
            })}
          </span>
          <input
            ref={input}
            id={id}
            type="file"
            multiple={maxFiles > 1}
            {...(accept ? { accept } : {})}
            disabled={disabled}
            aria-describedby={field?.describedBy}
            className="sr-only"
            onChange={(event) => {
              add(event.target.files);
            }}
          />
        </label>
      </div>
      {files.length > 0 ? (
        <ul className="flex flex-wrap gap-3" aria-label={t('upload.selected')}>
          {files.map((file, index) => (
            <Thumbnail
              key={`${file.name}-${String(file.size)}-${String(index)}`}
              file={file}
              onRemove={() => {
                onFilesChange(files.filter((_, i) => i !== index));
              }}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
