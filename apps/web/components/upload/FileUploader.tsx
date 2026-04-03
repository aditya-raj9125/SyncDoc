'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { createBrowserClient } from '@/lib/supabase/client';
import { Upload, FileText, FileImage, X, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploaderProps {
  workspaceId: string;
  onFileImported?: (content: Record<string, unknown>) => void;
  onImageUploaded?: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

const ALLOWED_DOC_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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

export function FileUploader({
  workspaceId,
  onFileImported,
  onImageUploaded,
  accept = '.docx,.pdf,.md,.txt,.png,.jpg,.jpeg,.gif,.webp',
  maxSizeMB = 10,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createBrowserClient();

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setFileName(file.name);

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File must be under ${maxSizeMB}MB`);
        return;
      }

      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const isDocument = ALLOWED_DOC_TYPES.includes(file.type);

      if (!isImage && !isDocument) {
        setError('Unsupported file type. Use DOCX, PDF, MD, TXT, or image files.');
        return;
      }

      setUploading(true);
      setProgress(10);

      try {
        if (isImage) {
          // Compress image client-side if > 2MB
          let uploadFile = file;
          if (file.size > 2 * 1024 * 1024 && file.type !== 'image/gif') {
            uploadFile = await compressImage(file);
          }

          setProgress(30);

          const fileName = `${workspaceId}/${Date.now()}-${file.name}`;
          const { data, error: uploadError } = await supabase.storage
            .from('document-assets')
            .upload(fileName, uploadFile, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) throw uploadError;

          setProgress(80);

          const { data: urlData } = supabase.storage
            .from('document-assets')
            .getPublicUrl(data.path);

          setProgress(100);
          onImageUploaded?.(urlData.publicUrl);
        } else {
          // Document import via Edge Function
          setProgress(30);

          const formData = new FormData();
          formData.append('file', file);
          formData.append('workspace_id', workspaceId);

          const { data: { session } } = await supabase.auth.getSession();

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-upload`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${session?.access_token}`,
              },
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
          onFileImported?.(result.content);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [workspaceId, maxSizeMB, supabase, onFileImported, onImageUploaded]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

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
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/20'
            : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600'
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
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-brand-500" />
            <div className="w-48">
              <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <motion.div
                  className="h-full rounded-full bg-brand-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="mt-1.5 text-xs text-neutral-500">{fileName}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-neutral-400" />
              <FileImage size={20} className="text-neutral-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Drop a file here or{' '}
                <span className="text-brand-600 dark:text-brand-400">browse</span>
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">
                DOCX, PDF, Markdown, TXT, or images (max {maxSizeMB}MB)
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
