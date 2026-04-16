'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { createBrowserClient } from '@/lib/supabase/client';
import { Upload, FileText, FileImage, X, AlertCircle, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploaderProps {
  workspaceId: string;
  onFileImported?: (content: Record<string, unknown>) => void;
  onImageUploaded?: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

// FIX 10: Include .doc (legacy binary Word) in allowed types
const ALLOWED_DOC_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc (legacy binary)
  'application/pdf',
  'text/markdown',
  'text/plain',
];

const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

// FIX 10: 3-stage progress stepper type
type UploadStage = 'reading' | 'converting' | 'opening' | null;

const STAGE_LABELS: Record<NonNullable<UploadStage>, string> = {
  reading: 'Reading file...',
  converting: 'Converting...',
  opening: 'Opening editor...',
};

const STAGE_ORDER: NonNullable<UploadStage>[] = ['reading', 'converting', 'opening'];

export function FileUploader({
  workspaceId,
  onFileImported,
  onImageUploaded,
  // FIX 10: Accept .doc in addition to .docx
  accept = '.doc,.docx,.pdf,.md,.txt,.png,.jpg,.jpeg,.gif,.webp',
  maxSizeMB = 10,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<UploadStage>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createBrowserClient();

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setFileName(file.name);

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File must be under ${maxSizeMB}MB`);
        return;
      }

      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.docx');
      const isDoc = file.type === 'application/msword' || file.name.endsWith('.doc');
      const isWordDoc = isDocx || isDoc;
      const isDocument = ALLOWED_DOC_TYPES.includes(file.type) || isWordDoc;

      if (!isImage && !isDocument) {
        setError('Unsupported file type. Use DOCX, DOC, PDF, MD, TXT, or image files.');
        return;
      }

      setUploading(true);
      setProgress(5);

      try {
        if (isImage) {
          let uploadFile = file;
          if (file.size > 2 * 1024 * 1024 && file.type !== 'image/gif') {
            uploadFile = await compressImage(file);
          }

          setProgress(30);

          const uploadFileName = `${workspaceId}/${Date.now()}-${file.name}`;
          const { data, error: uploadError } = await supabase.storage
            .from('document-assets')
            .upload(uploadFileName, uploadFile, { cacheControl: '3600', upsert: false });

          if (uploadError) throw uploadError;

          setProgress(90);

          const { data: urlData } = supabase.storage
            .from('document-assets')
            .getPublicUrl(data.path);

          setProgress(100);
          onImageUploaded?.(urlData.publicUrl);
        } else if (isWordDoc) {
          // FIX 10: 3-stage pipeline for Word documents
          // Stage 1: Reading file
          setStage('reading');
          setProgress(15);
          const arrayBuffer = await file.arrayBuffer();
          setProgress(30);

          // Stage 2: Converting with mammoth (preserves headings, bold, italic, lists, tables)
          setStage('converting');
          setProgress(45);

          // Dynamic import — mammoth is large, only load when needed
          const mammoth = await import('mammoth');

          // FIX 10: Use convertToHtml (NOT extractRawText) — preserves rich formatting
          const result = await mammoth.convertToHtml({ arrayBuffer });
          const htmlContent = result.value;

          if (result.messages.length > 0) {
            console.warn('[FileUploader] Mammoth conversion warnings:', result.messages);
          }

          setProgress(65);

          // FIX 10: Return HTML content to parent
          // Parent (HomeContent) will create the document and the editor
          // will render it from the HTML via mammoth's HTML output
          setProgress(100);
          setStage(null);

          onFileImported?.({
            type: 'html_content',
            html: htmlContent,
            title: file.name.replace(/\.(docx?|txt|md|rtf)$/i, '') || 'Untitled',
          });
        } else {
          // Plain text / markdown / PDF — via Edge Function
          setStage('reading');
          setProgress(30);

          const formData = new FormData();
          formData.append('file', file);
          formData.append('workspace_id', workspaceId);

          const { data: { session } } = await supabase.auth.getSession();

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-upload`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${session?.access_token}` },
              body: formData,
            }
          );

          setProgress(70);

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Import failed');
          }

          const result = await response.json();
          setProgress(100);
          setStage(null);
          onFileImported?.(result.content);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
        setStage(null);
      } finally {
        setUploading(false);
      }
    },
    [workspaceId, maxSizeMB, supabase, onFileImported, onImageUploaded]
  );

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
            : 'border-[var(--bg-border)] hover:border-[var(--brand-primary)]/50 hover:bg-[var(--bg-elevated)]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        {uploading ? (
          // FIX 10: 3-stage progress stepper — NOT just a spinner
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              {STAGE_ORDER.map((s, idx) => {
                const currentIdx = stage ? STAGE_ORDER.indexOf(stage) : -1;
                const isDone = idx < currentIdx;
                const isActive = idx === currentIdx;

                return (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                      isDone
                        ? 'border-green-500 bg-green-500 text-white'
                        : isActive
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10'
                        : 'border-[var(--bg-border)] bg-transparent'
                    }`}>
                      {isDone ? (
                        <Check size={12} />
                      ) : isActive ? (
                        <Loader2 size={12} className="animate-spin text-[var(--brand-primary)]" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--bg-border)]" />
                      )}
                    </div>
                    <span className={`text-xs whitespace-nowrap ${
                      isActive ? 'text-[var(--brand-primary)] font-medium' :
                      isDone ? 'text-green-600 dark:text-green-400' :
                      'text-[var(--text-tertiary)]'
                    }`}>
                      {STAGE_LABELS[s]}
                    </span>
                    {idx < STAGE_ORDER.length - 1 && (
                      <div className={`h-0.5 w-6 rounded-full ${isDone ? 'bg-green-400' : 'bg-[var(--bg-border)]'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="w-56">
              <div className="h-1 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                <motion.div
                  className="h-full rounded-full bg-[var(--brand-primary)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="mt-1.5 text-xs text-[var(--text-tertiary)] truncate">{fileName}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-[var(--text-tertiary)]" />
              <FileImage size={20} className="text-[var(--text-tertiary)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Drop a file here or{' '}
                <span className="text-[var(--brand-primary)]">browse</span>
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                DOC, DOCX, PDF, Markdown, TXT, or images (max {maxSizeMB}MB)
              </p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
          >
            <AlertCircle size={14} />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      const maxDim = 1920;
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim;
          width = maxDim;
        } else {
          width = (width / height) * maxDim;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.85
      );
    };

    img.src = URL.createObjectURL(file);
  });
}
