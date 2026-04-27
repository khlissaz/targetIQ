"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { TiqCard } from "@/components/tiq/TiqCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';import {
  createMessageTemplate,
  deleteMessageTemplate,
  getMessageTemplates,
} from "@/services/messageTemplateServices";
import { sanitizeError } from "@/lib/safeLogging";
import { toast } from "sonner";
import type { MessageTemplateRow } from "@/types/api/messaging";
import { PageShell } from "@/components/tiq/PageShell";
import { PageHeader } from "@/components/tiq/PageHeader";

type TemplateForm = {
  name: string;
  subject: string;
  body: string;
  channel: "email" | "phone" | "linkedin" | "whatsapp" | "multi";
  status: "draft" | "active" | "archived";
};

const initialForm: TemplateForm = {
  name: "",
  subject: "",
  body: "",
  channel: "email",
  status: "draft",
};

export default function TemplatesPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const [items, setItems] = useState<MessageTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<TemplateForm>(initialForm);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMessageTemplates({ page: 1, limit: 100, search });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      load();
    }
  }, [user, load]);

  const handleCreate = async () => {
    try {
      if (!form.name.trim()) {
        toast.error(t('outreach.template.nameRequired'));
        return;
      }

      await createMessageTemplate({
        name: form.name.trim(),
        subject: form.subject.trim(),
        body: form.body,
        channel: form.channel,
        status: form.status,
      });

      toast.success("Template created");
      setForm(initialForm);
      setOpen(false);
      await load();
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || "Failed to create template");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('outreach.template.confirmDelete'))) return;
    try {
      await deleteMessageTemplate(id);
      toast.success(t('outreach.template.deleted'));
      await load();
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || "Failed to delete template");
    }
  };

  return (
    <DashboardLayout>
      <PageShell className="space-y-6">
        <PageHeader
          title="Message Templates"
          subtitle="Reusable outreach content blocks for campaigns and sequences."
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/dashboard/${params?.businessId}/sequences`)
                }
              >
                Sequences
              </Button>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>Create template</Button>
                </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('outreach.createTemplate')}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                  <Input
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />

                  <Input
                    placeholder="Subject"
                    value={form.subject}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, subject: e.target.value }))
                    }
                  />

                  <Textarea
                    placeholder="Body"
                    value={form.body}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, body: e.target.value }))
                    }
                  />

                  <Select
                    value={form.channel}
                    onValueChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        channel: v as TemplateForm["channel"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="multi">Multi</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        status: v as TemplateForm["status"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>

                    <Button onClick={handleCreate}>{t('save')}</Button>
                </div>
              </DialogContent>
              </Dialog>
            </div>
          }
        />

        <TiqCard title={t('outreach.templatesTitle')}>
          <div className="mb-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates"
            />
          </div>

          {loading ? (
            <div className="text-sm text-tiq-muted">{t('loading')}</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-tiq-muted">{t('outreach.noTemplates')}</div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-tiqLg border border-tiq-border bg-tiq-surface p-4 flex items-start justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold text-tiq-navy">
                        {item.name}
                      </div>
                      <Badge variant="secondary">{item.channel}</Badge>
                      <Badge variant="outline">{item.status}</Badge>
                    </div>

                    <div className="text-sm text-tiq-muted">
                      {item.subject || t('outreach.noSubject')}
                    </div>

                    <div className="text-xs text-tiq-muted whitespace-pre-wrap">
                      {item.body}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    {t('delete')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TiqCard>
      </PageShell>
    </DashboardLayout>
  );
}