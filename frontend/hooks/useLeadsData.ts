'use client';

import { useState, useEffect } from 'react';
import { ScrapingI } from '@/lib/types';
import { useAppStore } from '@/lib/appStore';
import { fetchFilteredLeadsByCollectionId } from '@/services/leadServices';
import { fetchFilteredCollections, fetchCollectionByMonth } from '@/services/collectionService';
import { safeLog, sanitizeError, hashIdentifier } from '@/lib/safeLogging';

export const useLeadsData = (
  selectedDateRange: Date | undefined, // Conservé pour compatibilité, mais non utilisé
  selectedFile: string | null,
  selectedCollection: ScrapingI | null,
  page: number,
  limit: number,
  currentMonth: number,
  currentYear: number
) => {
  const setLeads = useAppStore((state) => state.setLeads);

  const [collections, setCollections] = useState<ScrapingI[]>([]);
  const [monthlyCollections, setMonthlyCollections] = useState<{ [date: string]: ScrapingI[] }>({});
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const fetchCollectionsData = async () => {
      try {
        const data = await fetchFilteredCollections(); // Appel sans paramètres de date
        safeLog('info', 'leads.collections.loaded', {
          itemCount: Array.isArray(data) ? data.length : undefined,
        });
        setCollections(data);
      } catch (error) {
        const se = sanitizeError(error);
        setError('Failed to fetch collections: ' + se.message);
        safeLog('error', 'leads.fetchCollections.failed', { message: se.message, code: se.code });
      } finally {
        setLoading(false);
      }
    };
    fetchCollectionsData();
  }, []); // Supprimé selectedDateRange des dépendances

  useEffect(() => {
    const fetchLeadsData = async () => {
      if (selectedFile && selectedCollection) {
        try {
          safeLog('info', 'leads.view', {
            action: 'view',
            scrapingIdHash: selectedFile ? hashIdentifier(String(selectedFile), 'scrapingId') : undefined,
          });
          const filters = {};
          const result = await fetchFilteredLeadsByCollectionId(selectedFile, filters, page, limit);
          setLeads(result.leads || []);
          setTotal(result.total);
        } catch (error) {
          const se = sanitizeError(error);
          setError('Error loading leads by collection ID: ' + se.message);
          safeLog('error', 'leads.fetchLeadsByCollection.failed', { message: se.message, code: se.code });
        }
      } else {
        setLeads([]);
        setTotal(0);
      }
    };
    fetchLeadsData();
  }, [selectedFile, selectedCollection, page, limit, setLeads]);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const data = await fetchCollectionByMonth(currentMonth, currentYear);
        setMonthlyCollections(data as { [date: string]: ScrapingI[] });
      } catch (error) {
        const se = sanitizeError(error);
        safeLog('error', 'leads.fetchMonthly.failed', { message: se.message, code: se.code });
      }
    };
    fetchMonthlyData();
  }, [currentMonth, currentYear]);

  return {
    collections,
    setCollections,
    monthlyCollections,
    setMonthlyCollections,
    total,
    setTotal,
    loading,
    setLoading,
    error,
    setError,
  };
};