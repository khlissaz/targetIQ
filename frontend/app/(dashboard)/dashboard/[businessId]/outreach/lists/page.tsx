'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TiqCard } from '@/components/tiq/TiqCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeError } from '@/lib/safeLogging';
import { toast } from 'sonner';
import { createOutreachList, deleteOutreachList, getOutreachListById, getOutreachLists, type OutreachListDetails, type OutreachListRow, removeProspectsFromOutreachList } from '@/services/outreachListServices';
import { PageShell } from '@/components/tiq/PageShell';
import { PageHeader } from '@/components/tiq/PageHeader';
import { MetricStrip } from '@/components/tiq/MetricStrip';

export default function OutreachListsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<OutreachListRow[]>([]);
  const [selected, setSelected] = useState<OutreachListDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await getOutreachLists({ page, limit: 10, search });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setTotalPages(Number(res?.totalPages || 1));
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to load outreach lists');
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (id: string) => {
    try {
      const res = await getOutreachListById(id);
      setSelected(res);
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to load list details');
    }
  };

  useEffect(() => { if (!authLoading && !user) router.push('/auth/login'); }, [authLoading, user, router]);
  useEffect(() => { if (user) load(); }, [user, page, search]);

  const totalMembers = useMemo(() => items.reduce((sum, item) => sum + Number(item.membersCount || 0), 0), [items]);

  const handleCreate = async () => {
    try {
      const created = await createOutreachList({ name: createName, description: createDescription });
      toast.success('Outreach list created');
      setIsCreateOpen(false);
      setCreateName('');
      setCreateDescription('');
      await load();
      setSelected(created);
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to create list');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this outreach list?')) return;
    try {
      await deleteOutreachList(id);
      toast.success('Outreach list deleted');
      if (selected?.id === id) setSelected(null);
      await load();
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to delete list');
    }
  };

  const handleRemoveMember = async (prospectId: string) => {
    if (!selected) return;
    try {
      const updated = await removeProspectsFromOutreachList(selected.id, [prospectId]);
      setSelected(updated);
      await load();
      toast.success('Prospect removed from list');
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to remove prospect');
    }
  };

  return <DashboardLayout>
    <PageShell className="space-y-6">
      <PageHeader
        title="Outreach Lists"
        subtitle="Organize outreach-ready prospects into reusable lists before campaign enrollment."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/dashboard/${params?.businessId}/outreach/prospects`)}>Prospects</Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild><Button className="bg-tiq-primary hover:opacity-95">Create list</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create outreach list</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="List name" value={createName} onChange={(e) => setCreateName(e.target.value)} />
                  <Textarea placeholder="Description (optional)" value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} />
                  <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={!createName.trim()} className="bg-tiq-primary hover:opacity-95">Create</Button></div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      <MetricStrip
        cols={3}
        metrics={[
          { label: 'Lists', value: items.length },
          { label: 'Members in page', value: totalMembers },
          { label: 'Selected list members', value: selected?.membersCount || 0 },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,1.15fr)]">
        <TiqCard title="Lists overview">
          <div className="space-y-4">
            <Input placeholder="Search lists" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
            {loading ? <div className="text-sm text-tiq-muted">Loading...</div> : items.length === 0 ? <div className="text-sm text-tiq-muted">No outreach lists found.</div> : <div className="space-y-3">{items.map((item) => <div key={item.id} className="rounded-lg border p-4 flex items-center justify-between gap-4"><div className="space-y-1"><div className="font-semibold text-tiq-navy">{item.name}</div><div className="text-sm text-tiq-muted">{item.description || 'No description'}</div><div className="text-xs text-tiq-muted">Members: {item.membersCount || 0}</div></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => openDetails(item.id)}>Open</Button><Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button></div></div>)}</div>}
            <div className="flex items-center justify-between"><div className="text-sm text-tiq-muted">Page {page} / {Math.max(totalPages, 1)}</div><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button></div></div>
          </div>
        </TiqCard>
        <TiqCard title={selected ? `List details • ${selected.name}` : 'List details'}>
          {!selected ? <div className="text-sm text-tiq-muted">Select a list to inspect its members.</div> : <div className="space-y-4"><div><div className="font-medium text-tiq-navy">{selected.name}</div><div className="text-sm text-tiq-muted">{selected.description || 'No description'}</div><div className="text-xs text-tiq-muted mt-1">Members: {selected.membersCount || 0}</div></div>{Array.isArray(selected.members) && selected.members.length > 0 ? <div className="space-y-3 max-h-[460px] overflow-auto pr-1">{selected.members.map((member) => <div key={member.id} className="rounded-lg border p-3 flex items-start justify-between gap-3"><div className="space-y-1"><div className="font-medium text-tiq-navy">{member.prospect?.fullName || 'Unnamed prospect'}</div><div className="text-sm text-tiq-muted">{member.prospect?.company || '—'} {member.prospect?.jobTitle ? `• ${member.prospect.jobTitle}` : ''}</div><div className="text-xs text-tiq-muted">{member.prospect?.email || member.prospect?.phone || member.prospect?.linkedinUrl || 'No channel details'}</div></div><Button variant="outline" size="sm" onClick={() => handleRemoveMember(member.prospectId)}>Remove</Button></div>)}</div> : <div className="text-sm text-tiq-muted">This list has no members yet.</div>}</div>}
        </TiqCard>
      </div>
    </PageShell>
  </DashboardLayout>;
}
