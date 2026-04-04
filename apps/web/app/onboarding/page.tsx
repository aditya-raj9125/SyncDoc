'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { STRINGS } from '@/lib/constants';
import { toast } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AVATAR_COLORS } from '@syncdoc/types';
import { generateSlug } from '@syncdoc/utils';
import {
  FileText,
  Briefcase,
  FileSearch,
  BookOpen,
  PenLine,
  User,
  ClipboardList,
  CalendarDays,
  Users,
  File,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

const templateIcons: Record<string, React.ReactNode> = {
  'Meeting Notes': <CalendarDays className="h-5 w-5" />,
  'Project Brief': <Briefcase className="h-5 w-5" />,
  'Product Spec': <FileSearch className="h-5 w-5" />,
  'Research Report': <BookOpen className="h-5 w-5" />,
  'Blog Post': <PenLine className="h-5 w-5" />,
  Resume: <User className="h-5 w-5" />,
  Proposal: <ClipboardList className="h-5 w-5" />,
  'Weekly Update': <FileText className="h-5 w-5" />,
  '1:1 Notes': <Users className="h-5 w-5" />,
  Blank: <File className="h-5 w-5" />,
};

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[0]);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  function handleWorkspaceNameChange(name: string) {
    setWorkspaceName(name);
    setWorkspaceSlug(generateSlug(name));
  }

  async function handleFinish() {
    if (!displayName.trim() || !workspaceName.trim() || !workspaceSlug.trim()) {
      toast.error(STRINGS.errors.generic);
      return;
    }

    setLoading(true);
    try {
      const docTitle = 'Untitled';

      let slug = workspaceSlug;
      let { data, error } = await supabase.rpc('complete_onboarding', {
        p_display_name: displayName,
        p_avatar_color: avatarColor,
        p_workspace_name: workspaceName,
        p_workspace_slug: slug,
        p_doc_title: docTitle,
      });

      // Slug already taken from a previous attempt — retry with a short random suffix
      if (
        error &&
        (error.code === '23505' ||
          error.message?.includes('duplicate') ||
          error.message?.includes('unique'))
      ) {
        slug = `${workspaceSlug}-${Math.random().toString(36).slice(2, 6)}`;
        ({ data, error } = await supabase.rpc('complete_onboarding', {
          p_display_name: displayName,
          p_avatar_color: avatarColor,
          p_workspace_name: workspaceName,
          p_workspace_slug: slug,
          p_doc_title: docTitle,
        }));
      }

      if (error) throw error;

      const { workspace_slug, doc_id } = data as {
        workspace_id: string;
        workspace_slug: string;
        doc_id: string;
      };

      window.location.href = `/workspace/${workspace_slug}/doc/${doc_id}`;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : STRINGS.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-canvas)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[520px] rounded-[var(--radius-xl)] bg-[var(--bg-surface)] p-8 shadow-lg border border-[var(--bg-border)]"
      >
        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: s <= step ? 'var(--brand-primary)' : 'var(--bg-border)',
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={step}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-semibold mb-1">{STRINGS.onboarding.step1Title}</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {STRINGS.onboarding.step1Subtitle}
              </p>

              <Input
                id="displayName"
                label={STRINGS.onboarding.nameLabel}
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoFocus
              />

              <div className="mt-6">
                <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-3 block">
                  {STRINGS.onboarding.colorLabel}
                </label>
                <div className="flex gap-3">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setAvatarColor(color)}
                      className="h-8 w-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-primary)]"
                      style={{
                        backgroundColor: color,
                        outline: avatarColor === color ? '2px solid var(--text-primary)' : 'none',
                        outlineOffset: '2px',
                      }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!displayName.trim()}>
                  {STRINGS.onboarding.next}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-semibold mb-1">{STRINGS.onboarding.step2Title}</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {STRINGS.onboarding.step2Subtitle}
              </p>

              <div className="space-y-4">
                <Input
                  id="workspaceName"
                  label={STRINGS.onboarding.workspaceNameLabel}
                  placeholder="Acme Inc."
                  value={workspaceName}
                  onChange={(e) => handleWorkspaceNameChange(e.target.value)}
                  autoFocus
                />
                <Input
                  id="workspaceSlug"
                  label={STRINGS.onboarding.workspaceSlugLabel}
                  placeholder="acme-inc"
                  value={workspaceSlug}
                  onChange={(e) => setWorkspaceSlug(e.target.value)}
                />
                <p className="text-xs text-[var(--text-tertiary)]">
                  syncdoc.app/workspace/{workspaceSlug || 'your-workspace'}
                </p>
              </div>

              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ChevronLeft className="h-4 w-4" />
                  {STRINGS.onboarding.back}
                </Button>
                <Button
                  onClick={handleFinish}
                  loading={loading}
                  disabled={!workspaceName.trim() || !workspaceSlug.trim()}
                >
                  {STRINGS.onboarding.finish}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
