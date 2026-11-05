'use client';

import * as React from 'react';
import { CheckIcon, FileIcon, UploadIcon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Files picked or dropped for upload. The drop zone is a dashed Concrete
// box that turns to a Slate edge on a Base wash while files are dragged
// over it; `variant="button"` is a plain outline button for tight spots.
// Chosen files list below as rows on an Ash hairline — name, size, a Hope
// progress bar while uploading, an error line in red — each with a remove
// button, or as square thumbnails with listType="picture-card".
//
// Only the choosing lives here: the upload itself is yours. Do it in
// `beforeUpload` (return false to keep the file out of the list) or on
// `onFilesChange`, and pass the files back with status/percent/error as it
// goes. Files the zone turns away — wrong type, too big, too many — come to
// `onReject` with the reason.

type FileUploadStatus = 'uploading' | 'done' | 'error';

type FileUploadFile = {
  uid: string;
  name: string;
  size?: number;
  type?: string;
  status?: FileUploadStatus;
  /** 0–100 while uploading */
  percent?: number;
  /** why it failed, shown under the name */
  error?: string;
  /** the File when it was just chosen; files already on the server may only have a url */
  originFile?: File;
  url?: string;
  thumbUrl?: string;
};

type FileUploadRejection = { file: File; reason: 'accept' | 'size' | 'count' };

/** Does a file match an HTML `accept` list (".pdf", "image/*", "application/pdf")? Drops aren't filtered by the browser, so this is. */
function fileMatchesAccept(file: File, accept?: string): boolean {
  const tokens = (accept ?? '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0 || tokens.some((t) => t === '*' || t === '*/*')) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return tokens.some((t) => (t.startsWith('.') ? name.endsWith(t) : t.endsWith('/*') ? type.startsWith(t.slice(0, -1)) : type === t));
}

function createUploadFile(file: File, overrides?: Partial<FileUploadFile>): FileUploadFile {
  const uid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`;
  return { uid, name: file.name, size: file.size, type: file.type, status: 'done', originFile: file, ...overrides };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`;
}

// clicks on these inside the zone are theirs, not the zone's
const NESTED_INTERACTIVE = 'button, a, input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="switch"]';

function FileUpload({
  accept,
  multiple = false,
  maxCount,
  maxSize,
  files: filesProp,
  defaultFiles,
  onFilesChange,
  beforeUpload,
  onRemove,
  onReject,
  onDrop,
  disabled = false,
  name = 'file',
  variant = 'dropzone',
  listType = 'text',
  showList = true,
  openOnClick = true,
  label,
  hint,
  className,
  children,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
  id,
}: {
  /** file types, as for <input accept> — also enforced on drop */
  accept?: string;
  multiple?: boolean;
  /** most files the list may hold */
  maxCount?: number;
  /** largest file, in bytes */
  maxSize?: number;
  /** the list, controlled */
  files?: FileUploadFile[];
  /** the starting list, uncontrolled */
  defaultFiles?: FileUploadFile[];
  onFilesChange?: (files: FileUploadFile[]) => void;
  /** runs per file before it's listed; return false to leave it out (upload here and pass the files back) */
  beforeUpload?: (file: File, files: File[]) => boolean | void | Promise<boolean | void>;
  /** return false to keep the file */
  onRemove?: (file: FileUploadFile) => boolean | void | Promise<boolean | void>;
  onReject?: (rejections: FileUploadRejection[]) => void;
  onDrop?: (event: React.DragEvent<HTMLElement>) => void;
  disabled?: boolean;
  name?: string;
  variant?: 'dropzone' | 'button';
  listType?: 'text' | 'picture-card';
  showList?: boolean;
  /** false: only drops (default true) */
  openOnClick?: boolean;
  /** the zone's or button's text */
  label?: React.ReactNode;
  /** a line under the label: types and size limit by default */
  hint?: React.ReactNode;
  className?: string;
  /** replaces the zone's contents entirely */
  children?: React.ReactNode;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  id?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  // nested dragenter/leave pairs: leaving a child mustn't end the drag look
  const dragDepth = React.useRef(0);
  const [dragging, setDragging] = React.useState(false);
  const [uncontrolled, setUncontrolled] = React.useState<FileUploadFile[]>(defaultFiles ?? []);
  const isControlled = filesProp !== undefined;
  const files = isControlled ? filesProp : uncontrolled;

  // async beforeUpload/onRemove commit against the latest list, not a stale one
  const filesRef = React.useRef(files);
  React.useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const commit = (next: FileUploadFile[]) => {
    filesRef.current = next;
    if (!isControlled) setUncontrolled(next);
    onFilesChange?.(next);
  };

  const select = async (selected: File[]) => {
    if (disabled || selected.length === 0) return;
    const rejections: FileUploadRejection[] = [];
    // one file at a time replaces the last; several add up to maxCount
    const pool = multiple ? selected : selected.slice(0, 1);
    if (!multiple) for (const file of selected.slice(1)) rejections.push({ file, reason: 'count' });
    const room = multiple && maxCount !== undefined ? Math.max(0, maxCount - filesRef.current.length) : Infinity;
    const candidates: File[] = [];
    for (const file of pool) {
      if (!fileMatchesAccept(file, accept)) rejections.push({ file, reason: 'accept' });
      else if (maxSize !== undefined && file.size > maxSize) rejections.push({ file, reason: 'size' });
      else if (candidates.length >= room) rejections.push({ file, reason: 'count' });
      else candidates.push(file);
    }
    if (rejections.length) onReject?.(rejections);

    const accepted: FileUploadFile[] = [];
    for (const file of candidates) {
      try {
        if ((await beforeUpload?.(file, candidates)) === false) continue;
        accepted.push(createUploadFile(file));
      } catch {
        // one file's failure doesn't stop the rest
      }
    }
    if (accepted.length) commit(multiple ? [...filesRef.current, ...accepted] : accepted);
  };

  const run = (selected: File[]) => {
    void select(selected).finally(() => {
      // so the same file can be picked again after it's removed
      if (inputRef.current) inputRef.current.value = '';
    });
  };

  const remove = async (file: FileUploadFile) => {
    if (disabled) return;
    try {
      if ((await onRemove?.(file)) === false) return;
      commit(filesRef.current.filter((f) => f.uid !== file.uid));
    } catch {
      // onRemove failing keeps the file
    }
  };

  const openDialog = () => {
    if (!disabled && openOnClick) inputRef.current?.click();
  };

  const fromNested = (e: { target: EventTarget | null; currentTarget: EventTarget }) => {
    const target = e.target as Element | null;
    if (!target?.closest || target === inputRef.current) return true;
    const nested = target.closest(NESTED_INTERACTIVE);
    return Boolean(nested && nested !== e.currentTarget);
  };

  const dragProps = {
    onDragEnter: (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      if (disabled) return;
      dragDepth.current += 1;
      setDragging(true);
    },
    onDragOver: (e: React.DragEvent<HTMLElement>) => e.preventDefault(),
    onDragLeave: (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    },
    onDrop: (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      onDrop?.(e);
      if (!disabled) run(Array.from(e.dataTransfer?.files ?? []));
    },
  };

  const defaultHint =
    hint ??
    ([
      accept && accept !== '*'
        ? accept
            .split(',')
            // ".pdf" reads as PDF; "image/*" as Images; "application/pdf" as PDF
            .map((t) => {
              const type = t.trim();
              const wildcard = type.match(/^([a-z]+)\/\*$/i);
              if (wildcard) return `${wildcard[1][0].toUpperCase()}${wildcard[1].slice(1).toLowerCase()}s`;
              return (type.includes('/') ? type.split('/')[1] : type.replace(/^\./, '')).toUpperCase();
            })
            .join(', ')
        : null,
      maxSize ? `up to ${formatFileSize(maxSize)}` : null,
    ]
      .filter(Boolean)
      .join(' · ') ||
      null);

  const input = (
    <input
      ref={inputRef}
      id={id}
      type="file"
      name={name}
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      tabIndex={-1}
      aria-hidden
      className="sr-only"
      data-slot="file-upload-input"
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => run(Array.from(e.target.files ?? []))}
    />
  );

  return (
    <div data-slot="file-upload" className={cn('flex w-full flex-col gap-2', className)}>
      {variant === 'button' ? (
        <div {...dragProps} role="group" aria-label="Upload" className="w-fit">
          {input}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            onClick={openDialog}
            data-dragging={dragging || undefined}
            className="data-dragging:bg-accent"
          >
            <UploadIcon data-icon="inline-start" />
            {label ?? (multiple ? 'Upload files' : 'Upload a file')}
          </Button>
        </div>
      ) : (
        // a div, not a <button>, so the zone can hold buttons of its own; its
        // role is "button" when it opens the dialog, "group" when it only takes drops
        // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
          {...dragProps}
          data-slot="file-upload-dropzone"
          data-dragging={dragging || undefined}
          role={openOnClick ? 'button' : 'group'}
          tabIndex={openOnClick && !disabled ? 0 : undefined}
          aria-disabled={disabled || undefined}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          aria-label={accept && accept !== '*' ? `Upload files (${accept})` : 'Upload files'}
          onClick={(e) => {
            if (!fromNested(e)) openDialog();
          }}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !fromNested(e)) {
              e.preventDefault();
              openDialog();
            }
          }}
          className={cn(
            'relative flex w-full flex-col items-center justify-center gap-2 rounded-none border border-dashed border-input bg-background px-6 py-8 text-center transition-colors outline-none focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring aria-invalid:border-error data-dragging:border-solid data-dragging:border-foreground data-dragging:bg-accent',
            openOnClick && !disabled && 'cursor-pointer hover:border-foreground',
            disabled && 'cursor-not-allowed opacity-40',
          )}
        >
          {input}
          {children ?? (
            <>
              <UploadIcon className="size-6 text-foreground" aria-hidden />
              <p className="text-base font-light text-foreground">
                {label ?? (
                  <>
                    Drop {multiple ? 'files' : 'a file'} here or <span className="underline decoration-1 underline-offset-4">browse</span>
                  </>
                )}
              </p>
              {defaultHint && <p className="text-sm text-muted-foreground">{defaultHint}</p>}
            </>
          )}
        </div>
      )}
      {showList && files.length > 0 && (
        <FileUploadList listType={listType}>
          {files.map((file) => (
            <FileUploadItem key={file.uid} file={file} listType={listType} disabled={disabled} onRemove={() => void remove(file)} />
          ))}
        </FileUploadList>
      )}
    </div>
  );
}

function FileUploadList({ className, listType = 'text', ...props }: React.ComponentProps<'ul'> & { listType?: 'text' | 'picture-card' }) {
  return (
    <ul
      data-slot="file-upload-list"
      aria-label="Chosen files"
      className={cn(
        'm-0 list-none p-0',
        listType === 'picture-card' ? 'flex flex-wrap gap-2' : 'flex flex-col border-t border-border',
        className,
      )}
      {...props}
    />
  );
}

/** One chosen file: a row (or a thumbnail) with its progress, error and a remove button. */
function FileUploadItem({
  file,
  listType = 'text',
  disabled,
  onRemove,
  className,
}: {
  file: FileUploadFile;
  listType?: 'text' | 'picture-card';
  disabled?: boolean;
  onRemove?: () => void;
  className?: string;
}) {
  const remote = file.thumbUrl ?? file.url;
  const [objectUrl, setObjectUrl] = React.useState<string>();
  const isCard = listType === 'picture-card';
  const localImage = !remote && isCard && file.originFile?.type.startsWith('image/') ? file.originFile : undefined;

  // a thumbnail of a local image comes from an object URL, freed when it goes
  React.useEffect(() => {
    if (!localImage || typeof URL.createObjectURL !== 'function') return;
    const url = URL.createObjectURL(localImage);
    // the object URL is an outside resource: made here, revoked on cleanup
    // oxlint-disable-next-line react/set-state-in-effect
    setObjectUrl(url);
    return () => URL.revokeObjectURL?.(url);
  }, [localImage]);

  const preview = remote ?? (localImage ? objectUrl : undefined);
  const uploading = file.status === 'uploading';
  const failed = file.status === 'error';
  const removeButton = onRemove && (
    <Button
      type="button"
      variant={isCard ? 'secondary' : 'ghost'}
      size="icon-xs"
      aria-label={`Remove ${file.name}`}
      disabled={disabled}
      onClick={onRemove}
      className={cn(isCard && 'absolute top-1 right-1')}
    >
      <XIcon />
    </Button>
  );

  if (isCard) {
    return (
      <li
        data-slot="file-upload-item"
        data-status={file.status}
        className={cn(
          'relative flex size-24 flex-col items-center justify-center gap-1 overflow-hidden border border-border bg-muted',
          failed && 'border-error',
          className,
        )}
      >
        {preview ? (
          <img alt={file.name} src={preview} className="size-full object-cover" />
        ) : (
          <>
            <FileIcon className="size-5 text-muted-foreground" aria-hidden />
            <span className="w-full truncate px-2 text-center text-xs">{file.name}</span>
          </>
        )}
        {uploading && (
          <Progress value={file.percent ?? null} aria-label={`Uploading ${file.name}`} className="absolute inset-x-1 bottom-1" />
        )}
        {removeButton}
      </li>
    );
  }

  return (
    <li
      data-slot="file-upload-item"
      data-status={file.status}
      className={cn('flex items-start gap-3 border-b border-border py-3', className)}
    >
      <FileIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline gap-3">
          {file.url && !uploading ? (
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 truncate text-sm font-light text-foreground underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              {file.name}
            </a>
          ) : (
            <span className="min-w-0 truncate text-sm font-light text-foreground">{file.name}</span>
          )}
          {file.size !== undefined && (
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatFileSize(file.size)}</span>
          )}
          {file.status === 'done' && <CheckIcon className="size-3.5 shrink-0 text-foreground" aria-label="Uploaded" />}
          {uploading && file.percent !== undefined && (
            <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">{Math.round(file.percent)}%</span>
          )}
        </div>
        {uploading && <Progress value={file.percent ?? null} aria-label={`Uploading ${file.name}`} />}
        {failed && <p className="text-sm text-error">{file.error ?? 'Upload failed'}</p>}
      </div>
      {removeButton}
    </li>
  );
}

export { createUploadFile, FileUpload, FileUploadItem, FileUploadList, fileMatchesAccept, formatFileSize };
export type { FileUploadFile, FileUploadRejection, FileUploadStatus };
