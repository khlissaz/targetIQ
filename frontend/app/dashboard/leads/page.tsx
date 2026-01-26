'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, Mail, Phone, Building } from 'lucide-react';
import { LeadI, ScrapingI } from '@/lib/types';
import { useLeadsData } from '@/hooks/useLeadsData';
import EnrichLeadButton from '@/components/dashboard/leads/EnrichLeadButton';
import { ScrapingDataSelector } from '@/components/dashboard/leads/ScrapingDataSelector';
import { useAppStore } from '@/lib/appStore';
import { Zap } from 'lucide-react';
import EnrichmentProgress from '@/components/dashboard/leads/EnrichmentProgress';
import { fetchScrapings, getScrapedLeadsById } from '@/services/scrapeService';

export default function LeadsPage() {
    // Get enrichment credits from store
    const enrichmentCredits = useAppStore((state) => state.enrichmentCredits);
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const { user, loading: authLoading } = useAuth();

  const [scrapings, setScrapings] = useState<ScrapingI[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | undefined>(undefined);
  const [selectedScrape, setSelectedScrape] = useState<ScrapingI | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [leads, setLeads] = useState<LeadI[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LeadI[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<LeadI | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    status: 'new' as LeadI['status'],
    info: '',
  });

  const setLeadsStore = useAppStore((state) => state.setLeads);

  useEffect(() => {
    console.log('useEffect authLoading:', authLoading, 'User:', user);
    if (!authLoading && !user) {
      console.log('No user, should redirect');
      // router.push('/auth/login');
    } else if (user) {
      loadScrapings();
    }
  }, [user, authLoading]);
  // -------------------------------------------------------------
  // Load scraped leads
  // -------------------------------------------------------------

  const loadAllScrapedLeads = async () => {
    setLoading(true);
    try {
      console.log('Loading leads for scraping ID:', selectedFile);
      const data = await getScrapedLeadsById({ id: selectedFile || '', limit: 50, page: 1 });
      // Normalize API response
      const leadsArray =  data.items || [];
      console.log('Normalized leads from API:', leadsArray);
      setLeads(leadsArray);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Syncing leads to store:', leads);
    setLeadsStore(leads);
  }, [leads]);

  useEffect(() => {
    if (scrapings.length > 0 && !selectedFile) {
      const first = scrapings[0];
      setSelectedFile(first.id);
      setSelectedScrape(first);
      // No need to call loadAllScrapedLeads here; [selectedFile] effect will handle it
    }
  }, [scrapings]);

  useEffect(() => {
    if (selectedFile && scrapings.length > 0) {
      const scrape = scrapings.find((s) => s.id === selectedFile);
      setSelectedScrape(scrape || null);
      // Always reload leads for selected file
      loadAllScrapedLeads();
    }
  }, [selectedFile]);

  const loadScrapings = async () => {
    setLoading(true);
    try {
      const files = await fetchScrapings();

      setScrapings(files.items || []);
    } catch (error: any) {
      toast.error(error.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterLeads();
  }, [leads, searchQuery, statusFilter]);

  // const loadLeads = async () => {
  //   try {
  //     // You can pass limit/page if needed: getScrapedLeads({ limit: 20, page: 1 })
  //     const result = await getScrapedLeadsById({ id: selectedFile || '', limit: 20, page: 1 });
  //     setLeads(result.data || []);
  //   } catch (error: any) {
  //     toast.error(error.message || t('error'));
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const filterLeads = () => {
    let filtered = leads;

    if (searchQuery) {
      filtered = filtered.filter(
        (lead) =>
          lead.profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.profile.company?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    setFilteredLeads(filtered);
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      status: 'new',
      info: '',
    });
    setCurrentLead(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch<LeadI>(
        '/leads',
        {
          method: 'POST',
          body: JSON.stringify({ ...formData, user_id: user!.id }),
        }
      );
      toast.success(t('leadAdded'));
      setIsAddDialogOpen(false);
      resetForm();
      loadAllScrapedLeads();
    } catch (error: any) {
      toast.error(error.message || t('error'));
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLead) return;
    try {
      await apiFetch<LeadI>(
        `/leads/${currentLead.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(formData),
        }
      );
      toast.success(t('leadUpdated'));
      setIsEditDialogOpen(false);
      resetForm();
      loadAllScrapedLeads();
    } catch (error: any) {
      toast.error(error.message || t('error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await apiFetch(`/leads/${id}`, { method: 'DELETE' });
      toast.success(t('leadDeleted'));
      loadAllScrapedLeads();
    } catch (error: any) {
      toast.error(error.message || t('error'));
    }
  };

  const openEditDialog = (lead: LeadI) => {
    setCurrentLead(lead);
    setFormData({
      full_name: lead.profile.name,
      email: lead.profile?.email ?? '',
      phone: lead.profile.phone || '',
      company: lead.profile.company || '',
      position: lead.profile.job || '',
      status: lead.status,
      info: lead.profile.info || '',
    });
    setIsEditDialogOpen(true);
  };

  const exportToCSV = () => {
    const headers = [
      t('lead.name'),
      t('lead.source'),
      t('lead.contact'),
      t('lead.profile'),
      t('lead.createdAt'),
    ];

    const rows = filteredLeads.map((l) => [
      l.profile.name || "",
      l.source,
      l.profile.email || l.profile.phone || "",
      l.profile.profileLink || "",
      l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${c}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast.success(t('lead.exported'));
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B00]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Enrichment credits at the top */}
        <div className="flex items-center justify-end w-full pt-2 pb-1">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFF7E6] border-2 border-[#FFBA18] shadow text-[#1A2B3C] font-semibold text-base">
            <Zap className="w-5 h-5 text-[#FF6B00] animate-pulse" />
            <span>{t('lead.enrichmentCredits') || 'Enrichment Credits'}:</span>
            <span className="text-[#FF6B00] text-lg font-bold">{enrichmentCredits}</span>
          </div>
        </div>
        {/* Enrichment progress bar, always visible at top of leads page */}
        <EnrichmentProgress />
        <ScrapingDataSelector
          scrapings={scrapings}
          selectedFile={selectedFile ?? null}
          setSelectedFile={(id) => {
            setSelectedFile(id);
            // When a file is selected, load its leads immediately
            if (id) {
              (async () => {
                setLoading(true);
                try {
                  const data = await getScrapedLeadsById({ id, limit: 50, page: 1 });
                  setLeads(data.items || []);
                } catch (err) {
                  console.error(err);
                }
                setLoading(false);
              })();
            }
          }}
          setSelectedScrape={setSelectedScrape}
        />
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#1A2B3C]">{t('allLeads')}</h1>
          <div className="flex gap-2">
            <Button
              className="bg-[#FFBA18] hover:bg-[#FF6B00] text-[#1A2B3C] border border-[#FF6B00]"
              onClick={exportToCSV}
            >
              {t('lead.exportCSV') || 'Export CSV'}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#FF6B00] hover:bg-[#ff7d1a]">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('addLead')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('addLead')}</DialogTitle>
                  <DialogDescription>Add a new lead to your resultbase</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">{t('fullName')} *</Label>
                    <Input
                      id="full_name"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('phone')}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">{t('company')}</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">{t('position')}</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('status')}</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: LeadI['status']) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">{t('new')}</SelectItem>
                        <SelectItem value="contacted">{t('contacted')}</SelectItem>
                        <SelectItem value="qualified">{t('qualified')}</SelectItem>
                        <SelectItem value="converted">{t('converted')}</SelectItem>
                        <SelectItem value="lost">{t('lost')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">{t('notes')}</Label>
                    <Textarea
                      id="notes"
                      rows={3}
                      value={formData.info}
                      onChange={(e) => setFormData({ ...formData, info: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-[#FF6B00] hover:bg-[#ff7d1a]">
                      {t('save')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        resetForm();
                      }}
                    >
                      {t('cancel')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={t('search')}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">{t('new')}</SelectItem>
              <SelectItem value="contacted">{t('contacted')}</SelectItem>
              <SelectItem value="qualified">{t('qualified')}</SelectItem>
              <SelectItem value="converted">{t('converted')}</SelectItem>
              <SelectItem value="lost">{t('lost')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white rounded-lg border">
          {filteredLeads.length > 0 ? (
            <div>
              {/* Table header with select all checkbox */}
              <div className="flex items-center gap-2 p-4 border-b bg-gray-50 font-semibold text-[#1A2B3C]">
                <input
                  type="checkbox"
                  className="mr-3 w-5 h-5 rounded border-2 border-[#FFBA18] bg-white text-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00] transition-all duration-150 shadow-sm hover:scale-110 hover:border-[#FF6B00] cursor-pointer"
                  checked={filteredLeads.length > 0 && selectedLeadIds.length === filteredLeads.length}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedLeadIds(filteredLeads.map(l => l.id));
                    } else {
                      setSelectedLeadIds([]);
                    }
                  }}
                  aria-label="Select all leads"
                />
                <span className="flex-1">{t('lead.name')}</span>
                <span className="w-32">{t('lead.contact')}</span>
                <span className="w-32">{t('lead.company')}</span>
                <span className="w-32">{t('lead.status')}</span>
                <span className="w-32">{t('lead.actions') || 'Actions'}</span>
              </div>
              <div className="divide-y px-2">
                {filteredLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center gap-2p-4 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="mr-3 w-5 h-5 rounded border-2 border-[#FFBA18] bg-white text-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00] transition-all duration-150 shadow-sm hover:scale-110 hover:border-[#FF6B00] cursor-pointer"
                      checked={selectedLeadIds.includes(lead.id)}
                      onChange={() => {
                        setSelectedLeadIds(prev =>
                          prev.includes(lead.id)
                            ? prev.filter(id => id !== lead.id)
                            : [...prev, lead.id]
                        );
                      }}
                      aria-label={`Select lead ${lead.profile.name}`}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{lead.profile.name}</h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {lead.profile.email}
                        </div>
                        {lead.profile.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {lead.profile.phone}
                          </div>
                        )}
                        {lead.profile.company && (
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {lead.profile.company}
                          </div>
                        )}
                      </div>
                      {lead.profile.job && (
                        <p className="text-sm text-gray-500 mt-1">{lead.profile.job}</p>
                      )}
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.status === 'converted'
                              ? 'bg-green-100 text-green-800'
                              : lead.status === 'qualified'
                              ? 'bg-blue-100 text-blue-800'
                              : lead.status === 'contacted'
                              ? 'bg-yellow-100 text-yellow-800'
                              : lead.status === 'lost'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {t(lead.status as keyof typeof t)}
                        </span>
                      </div>
                    </div>
                    <span className="w-32 truncate">{lead.profile.email || lead.profile.phone}</span>
                    <span className="w-32 truncate">{lead.profile.company}</span>
                    <span className="w-32 truncate">{t(lead.status as keyof typeof t)}</span>
                   <div className="flex gap-2 items-center">
                      {lead.profile.email == null && (
                        <EnrichLeadButton leadId={lead.id} iconOnly />
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(lead)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(lead.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No leads found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editLead')}</DialogTitle>
            <DialogDescription>Update lead information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">{t('fullName')} *</Label>
              <Input
                id="edit_full_name"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">{t('email')} *</Label>
              <Input
                id="edit_email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">{t('phone')}</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_company">{t('company')}</Label>
              <Input
                id="edit_company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_position">{t('position')}</Label>
              <Input
                id="edit_position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_status">{t('status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(value: LeadI['status']) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t('new')}</SelectItem>
                  <SelectItem value="contacted">{t('contacted')}</SelectItem>
                  <SelectItem value="qualified">{t('qualified')}</SelectItem>
                  <SelectItem value="converted">{t('converted')}</SelectItem>
                  <SelectItem value="lost">{t('lost')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_notes">{t('notes')}</Label>
              <Textarea
                id="edit_notes"
                rows={3}
                value={formData.info}
                onChange={(e) => setFormData({ ...formData, info: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-[#FF6B00] hover:bg-[#ff7d1a]">
                {t('save')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
              >
                {t('cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
