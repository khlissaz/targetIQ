'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TiqCard } from '@/components/tiq/TiqCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TiqBadge } from '@/components/tiq/TiqBadge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { enrollProspectsInCampaign, getCampaignById, getCampaignEnrollments, orchestrateCampaignSend, removeCampaignEnrollments, updateCampaignEnrollmentFollowup, updateCampaignEnrollmentReply, updateCampaignEnrollmentStatus } from '@/services/campaignServices';
import { getOutreachProspects } from '@/services/outreachProspectServices';
import { getMessageTemplates } from '@/services/messageTemplateServices';
import { getOutreachSequences } from '@/services/outreachSequenceServices';
import { sanitizeError } from '@/lib/safeLogging';
import { toast } from 'sonner';
import { CampaignOrchestrationResult } from '@/types/api/campaigns';
import { PageShell } from '@/components/tiq/PageShell';
import { PageHeader } from '@/components/tiq/PageHeader';
import { MetricStrip } from '@/components/tiq/MetricStrip';

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const businessId = Array.isArray(params?.businessId) ? params.businessId[0] : params?.businessId;
  const campaignId = Array.isArray(params?.campaignId) ? params.campaignId[0] : params?.campaignId;
  const [campaign, setCampaign] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [prospects, setProspects] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEnrollments, setSearchEnrollments] = useState('');
  const [searchProspects, setSearchProspects] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [replyFilter, setReplyFilter] = useState('all');
  const [selectedProspects, setSelectedProspects] = useState<Record<string, boolean>>({});
  const [selectedEnrollments, setSelectedEnrollments] = useState<Record<string, boolean>>({});
  const [orchestration, setOrchestration] = useState({ templateId: 'none', sequenceId: 'none' });

  const load = async () => {
    if (!campaignId) return;
    try {
      setLoading(true);
      const [campaignRes, enrollmentsRes, prospectsRes, templatesRes, sequencesRes] = await Promise.all([
        getCampaignById(String(campaignId)),
        getCampaignEnrollments(String(campaignId), { page: 1, limit: 100, search: searchEnrollments, status: statusFilter, replyStatus: replyFilter }),
        getOutreachProspects({ page: 1, limit: 100, search: searchProspects, status: 'active' }),
        getMessageTemplates({ page: 1, limit: 100, status: 'active' }),
        getOutreachSequences({ page: 1, limit: 100, status: 'active' }),
      ]);
      setCampaign(campaignRes);
      setEnrollments(Array.isArray(enrollmentsRes?.items) ? enrollmentsRes.items : []);
      setProspects(Array.isArray(prospectsRes?.items) ? prospectsRes.items : []);
      setTemplates(Array.isArray(templatesRes?.items) ? templatesRes.items : []);
      setSequences(Array.isArray(sequencesRes?.items) ? sequencesRes.items : []);
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (!authLoading && !user) router.push('/auth/login'); }, [authLoading, user, router]);
  useEffect(() => { if (user && campaignId) load(); }, [user, campaignId, searchEnrollments, searchProspects, statusFilter, replyFilter]);

  const enrolledProspectIds = useMemo(() => new Set(enrollments.map((e) => e.prospectId)), [enrollments]);
  const selectedEnrollmentIds = useMemo(() => Object.entries(selectedEnrollments).filter(([, checked]) => checked).map(([id]) => id), [selectedEnrollments]);

  const handleEnroll = async () => {
    try {
      const prospectIds = Object.entries(selectedProspects).filter(([, checked]) => checked).map(([id]) => id);
      if (!prospectIds.length) { toast.error('Select prospects first'); return; }
      const result = await enrollProspectsInCampaign(String(campaignId), prospectIds);
      toast.success(`Enrolled ${result.enrolledCount} prospect(s)`);
      setSelectedProspects({});
      await load();
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to enroll prospects');
    }
  };

  const handleRemove = async () => {
    try {
      if (!selectedEnrollmentIds.length) { toast.error('Select enrollments first'); return; }
      await removeCampaignEnrollments(String(campaignId), selectedEnrollmentIds);
      toast.success('Enrollments removed');
      setSelectedEnrollments({});
      await load();
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to remove enrollments');
    }
  };

  const applyStatus = async (status: string) => {
    try {
      if (!selectedEnrollmentIds.length) { toast.error('Select enrollments first'); return; }
      await Promise.all(selectedEnrollmentIds.map((id) => updateCampaignEnrollmentStatus(String(campaignId), id, { status })));
      toast.success('Enrollment statuses updated');
      setSelectedEnrollments({});
      await load();
    } catch (error) { const se = sanitizeError(error); toast.error(se.message || 'Failed to update enrollment status'); }
  };

  const applyReply = async (replyStatus: string) => {
    try {
      if (!selectedEnrollmentIds.length) { toast.error('Select enrollments first'); return; }
      await Promise.all(selectedEnrollmentIds.map((id) => updateCampaignEnrollmentReply(String(campaignId), id, { replyStatus })));
      toast.success('Reply statuses updated');
      setSelectedEnrollments({});
      await load();
    } catch (error) { const se = sanitizeError(error); toast.error(se.message || 'Failed to update reply status'); }
  };

  const scheduleFollowup = async () => {
    try {
      if (!selectedEnrollmentIds.length) { toast.error('Select enrollments first'); return; }
      const nextDate = new Date(Date.now() + 3 * 86400000).toISOString();
      await Promise.all(selectedEnrollmentIds.map((id) => updateCampaignEnrollmentFollowup(String(campaignId), id, { nextFollowupAt: nextDate })));
      toast.success('Next follow-up scheduled');
      setSelectedEnrollments({});
      await load();
    } catch (error) { const se = sanitizeError(error); toast.error(se.message || 'Failed to schedule follow-up'); }
  };

  const runOrchestration = async (mode: 'preview' | 'execute') => {
    try {
      const result: CampaignOrchestrationResult = await orchestrateCampaignSend(
  String(campaignId),
  {
    mode,
    enrollmentIds: selectedEnrollmentIds.length ? selectedEnrollmentIds : undefined,
    templateId: orchestration.templateId !== 'none' ? orchestration.templateId : undefined,
    sequenceId: orchestration.sequenceId !== 'none' ? orchestration.sequenceId : undefined,
  },
);
      if (mode === 'preview') {
        toast.success(`Preview ready for ${result.count} enrollment(s)`);
      } else {
        toast.success(`Orchestration executed for ${result.count} enrollment(s)`);
        await load();
      }
    } catch (error) { const se = sanitizeError(error); toast.error(se.message || 'Failed to orchestrate send'); }
  };

  return <DashboardLayout>
    <PageShell className='space-y-6'>
      <PageHeader
        title={campaign?.name || 'Campaign'}
        subtitle='Manage enrollments, lifecycle status, templates, sequences and send orchestration.'
        actions={
          <div className='flex gap-2 flex-wrap'>
            <Button variant='outline' onClick={() => router.push(`/dashboard/${businessId}/templates`)}>Templates</Button>
            <Button variant='outline' onClick={() => router.push(`/dashboard/${businessId}/sequences`)}>Sequences</Button>
            <Button variant='outline' onClick={() => router.push(`/dashboard/${businessId}/campaigns`)}>Back to campaigns</Button>
          </div>
        }
      />

      <MetricStrip
        cols={4}
        metrics={[
          { label: 'Channel', value: campaign?.channel || '—' },
          { label: 'Status', value: campaign?.status || '—' },
          { label: 'Enrollments', value: enrollments.length },
          { label: 'Description', value: campaign?.description || 'No description' },
        ]}
      />

      <TiqCard title='Send orchestration'>
        <div className='grid gap-3 md:grid-cols-4'>
          <Select value={orchestration.templateId} onValueChange={(v) => setOrchestration((p) => ({ ...p, templateId: v }))}><SelectTrigger><SelectValue placeholder='Template' /></SelectTrigger><SelectContent><SelectItem value='none'>No template</SelectItem>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
          <Select value={orchestration.sequenceId} onValueChange={(v) => setOrchestration((p) => ({ ...p, sequenceId: v }))}><SelectTrigger><SelectValue placeholder='Sequence' /></SelectTrigger><SelectContent><SelectItem value='none'>No sequence</SelectItem>{sequences.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
          <Button variant='outline' onClick={() => runOrchestration('preview')}>Preview send</Button>
          <Button onClick={() => runOrchestration('execute')}>Execute orchestration</Button>
        </div>
      </TiqCard>

      <div className='grid gap-6 lg:grid-cols-2'>
        <TiqCard title='Enroll prospects'>
          <div className='space-y-3'>
            <Input value={searchProspects} onChange={(e) => setSearchProspects(e.target.value)} placeholder='Search prospects' />
            {loading ? <div className='text-sm text-tiq-muted'>Loading...</div> : prospects.length === 0 ? <div className='text-sm text-tiq-muted'>No prospects found.</div> : <div className='space-y-2 max-h-[480px] overflow-auto pr-1'>{prospects.map((item) => <label key={item.id} className='flex items-start gap-3 rounded-lg border border-tiq-border p-3 bg-tiq-surface'><Checkbox checked={!!selectedProspects[item.id]} disabled={enrolledProspectIds.has(item.id)} onCheckedChange={(checked) => setSelectedProspects((prev) => ({ ...prev, [item.id]: !!checked }))} /><div className='min-w-0 flex-1'><div className='flex items-center gap-2 flex-wrap'><div className='font-medium text-tiq-navy'>{item.fullName || 'Unnamed prospect'}</div><TiqBadge variant='neutral'>{item.primaryChannel || 'unknown'}</TiqBadge><TiqBadge variant='neutral'>{item.contactReadiness}</TiqBadge>{enrolledProspectIds.has(item.id) ? <TiqBadge variant='success'>Enrolled</TiqBadge> : null}</div><div className='text-sm text-tiq-muted'>{item.company || '—'}</div><div className='text-xs text-tiq-muted'>{item.email || item.phone || item.linkedinUrl || 'No channel details'}</div></div></label>)}</div>}
            <div className='flex justify-end'><Button onClick={handleEnroll}>Enroll selected prospects</Button></div>
          </div>
        </TiqCard>

        <TiqCard title='Campaign enrollments'>
          <div className='space-y-3'>
            <div className='grid gap-3 md:grid-cols-3'>
              <Input value={searchEnrollments} onChange={(e) => setSearchEnrollments(e.target.value)} placeholder='Search enrollments' />
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder='Status' /></SelectTrigger><SelectContent><SelectItem value='all'>All statuses</SelectItem><SelectItem value='queued'>Queued</SelectItem><SelectItem value='active'>Active</SelectItem><SelectItem value='contacted'>Contacted</SelectItem><SelectItem value='replied'>Replied</SelectItem><SelectItem value='failed'>Failed</SelectItem><SelectItem value='opted_out'>Opted out</SelectItem><SelectItem value='completed'>Completed</SelectItem></SelectContent></Select>
              <Select value={replyFilter} onValueChange={setReplyFilter}><SelectTrigger><SelectValue placeholder='Reply status' /></SelectTrigger><SelectContent><SelectItem value='all'>All reply states</SelectItem><SelectItem value='none'>None</SelectItem><SelectItem value='replied'>Replied</SelectItem><SelectItem value='interested'>Interested</SelectItem><SelectItem value='not_interested'>Not interested</SelectItem></SelectContent></Select>
            </div>
            <div className='flex gap-2 flex-wrap justify-end'>
              <Button variant='outline' size='sm' onClick={() => applyStatus('active')}>Mark active</Button>
              <Button variant='outline' size='sm' onClick={() => applyStatus('contacted')}>Mark contacted</Button>
              <Button variant='outline' size='sm' onClick={() => applyStatus('failed')}>Mark failed</Button>
              <Button variant='outline' size='sm' onClick={() => applyStatus('opted_out')}>Opt out</Button>
              <Button variant='outline' size='sm' onClick={() => applyReply('replied')}>Mark replied</Button>
              <Button variant='outline' size='sm' onClick={() => applyReply('interested')}>Interested</Button>
              <Button variant='outline' size='sm' onClick={scheduleFollowup}>+3d follow-up</Button>
            </div>
            {loading ? <div className='text-sm text-tiq-muted'>Loading...</div> : enrollments.length === 0 ? <div className='text-sm text-tiq-muted'>No enrollments yet.</div> : <div className='space-y-2 max-h-[560px] overflow-auto pr-1'>{enrollments.map((item) => <label key={item.id} className='flex items-start gap-3 rounded-lg border border-tiq-border p-3 bg-tiq-surface'><Checkbox checked={!!selectedEnrollments[item.id]} onCheckedChange={(checked) => setSelectedEnrollments((prev) => ({ ...prev, [item.id]: !!checked }))} /><div className='min-w-0 flex-1'><div className='flex items-center gap-2 flex-wrap'><div className='font-medium text-tiq-navy'>{item.prospectName || 'Unnamed prospect'}</div><TiqBadge variant={item.status === 'active' ? 'primary' : 'neutral'}>{item.status}</TiqBadge><TiqBadge variant='neutral'>Step {item.currentStep ?? 0}</TiqBadge><TiqBadge variant='neutral'>{item.replyStatus || 'none'}</TiqBadge><TiqBadge variant='neutral'>{item.primaryChannel || '—'}</TiqBadge></div><div className='text-sm text-tiq-muted'>{item.company || '—'}</div><div className='text-xs text-tiq-muted'>{item.email || item.phone || 'No channel details'}</div><div className='text-xs text-tiq-muted'>Last contact: {item.lastContactAt || '—'} | Next follow-up: {item.nextFollowupAt || '—'} | Messages: {item.messageCount ?? 0}</div>{item.lastError ? <div className='text-xs text-red-600'>Last error: {item.lastError}</div> : null}</div></label>)}</div>}
            <div className='flex justify-end'><Button variant='outline' onClick={handleRemove}>Remove selected enrollments</Button></div>
          </div>
        </TiqCard>
      </div>
    </PageShell>
  </DashboardLayout>;
}
