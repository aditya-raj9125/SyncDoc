'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TEMPLATE_CATEGORIES } from '@syncdoc/types';
import type { Workspace, Template } from '@syncdoc/types';
import {
  FileText, Briefcase, FileSearch, BookOpen, PenLine,
  User, ClipboardList, CalendarDays, Users, File, LayoutTemplate,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

const templateIcons: Record<string, React.ReactNode> = {
  'Meeting Notes': <CalendarDays className="h-6 w-6" />,
  'Project Brief': <Briefcase className="h-6 w-6" />,
  'Product Spec': <FileSearch className="h-6 w-6" />,
  'Research Report': <BookOpen className="h-6 w-6" />,
  'Blog Post': <PenLine className="h-6 w-6" />,
  Resume: <User className="h-6 w-6" />,
  Proposal: <ClipboardList className="h-6 w-6" />,
  'Weekly Update': <FileText className="h-6 w-6" />,
  '1:1 Notes': <Users className="h-6 w-6" />,
  Blank: <File className="h-6 w-6" />,
};

interface TemplatesContentProps {
  workspace: Workspace;
  templates: Template[];
}

export function TemplatesContent({ workspace, templates }: TemplatesContentProps) {
  const router = useRouter();
  const supabase = createClient();
  const basePath = `/workspace/${workspace.slug}`;

  async function handleUseTemplate(template?: Template) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: doc, error } = await supabase
      .from('documents')
      .insert({
        workspace_id: workspace.id,
        owner_id: user.id,
        title: template ? template.name : 'Untitled',
        source_type: template ? 'template' : 'blank',
        ydoc_state: template?.ydoc_state ?? null,
      })
      .select()
      .single();

    if (template) {
      await supabase
        .from('templates')
        .update({ use_count: (template.use_count || 0) + 1 })
        .eq('id', template.id);
    }

    if (!error && doc) {
      router.push(`${basePath}/doc/${doc.id}`);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Templates</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {TEMPLATE_CATEGORIES.map((category, i) => {
          const template = templates.find((t) => t.category === category);
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -2 }}
              className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--bg-border)] bg-[var(--bg-surface)] p-6 text-center hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleUseTemplate(template ?? undefined)}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-elevated)] text-[var(--text-tertiary)]">
                {templateIcons[category] ?? <LayoutTemplate className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-sm font-medium">{category}</p>
                {template?.description ? (
                  <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">{template.description}</p>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
