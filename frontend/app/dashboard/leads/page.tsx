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

export default function LeadsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const { user, loading: authLoading } = useAuth();
  type Lead = {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    phone?: string;
    company?: string;
    position?: string;
    status: string;
    notes?: string;
    created_at?: string;
  };
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    status: 'new' as Lead['status'],
    notes: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (user) {
      loadLeads();
    }
  }, [user, authLoading]);

  useEffect(() => {
    filterLeads();
  }, [leads, searchQuery, statusFilter]);

  const loadLeads = async () => {
    try {
      const data = await apiFetch<Lead[]>(`/leads?user_id=${user!.id}`);
      setLeads(data || []);
    } catch (error: any) {
      toast.error(error.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (searchQuery) {
      filtered = filtered.filter(
        (lead) =>
          lead.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.company?.toLowerCase().includes(searchQuery.toLowerCase())
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
      notes: '',
    });
    setCurrentLead(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch<Lead>(
        '/leads',
        {
          method: 'POST',
          body: JSON.stringify({ ...formData, user_id: user!.id }),
        }
      );
      toast.success(t('leadAdded'));
      setIsAddDialogOpen(false);
      resetForm();
      loadLeads();
    } catch (error: any) {
      toast.error(error.message || t('error'));
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLead) return;
    try {
      await apiFetch<Lead>(
        `/leads/${currentLead.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(formData),
        }
      );
      toast.success(t('leadUpdated'));
      setIsEditDialogOpen(false);
      resetForm();
      loadLeads();
    } catch (error: any) {
      toast.error(error.message || t('error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await apiFetch(`/leads/${id}`, { method: 'DELETE' });
      toast.success(t('leadDeleted'));
      loadLeads();
    } catch (error: any) {
      toast.error(error.message || t('error'));
    }
  };

  const openEditDialog = (lead: Lead) => {
    setCurrentLead(lead);
    setFormData({
      full_name: lead.full_name,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      position: lead.position || '',
      status: lead.status,
      notes: lead.notes || '',
    });
    setIsEditDialogOpen(true);
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#1A2B3C]">{t('allLeads')}</h1>
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
                <DialogDescription>Add a new lead to your database</DialogDescription>
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
                    onValueChange={(value: Lead['status']) =>
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
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
            <div className="divide-y">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{lead.full_name}</h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {lead.email}
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {lead.phone}
                          </div>
                        )}
                        {lead.company && (
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {lead.company}
                          </div>
                        )}
                      </div>
                      {lead.position && (
                        <p className="text-sm text-gray-500 mt-1">{lead.position}</p>
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
                    <div className="flex gap-2">
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
                </div>
              ))}
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
                onValueChange={(value: Lead['status']) =>
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
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
