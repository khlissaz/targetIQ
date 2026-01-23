'use client';

import { useState, useEffect } from 'react';
import { ScrapingI } from '@/lib/types';
import { useAppStore } from '@/lib/appStore';
import { fetchFilteredLeadsByScrapingId } from '@/services/leadServices';
import { fetchFilteredScrapings, fetchScrapingsByMonth } from '@/services/scrapeService';

export const useLeadsData = (
  selectedDateRange: Date | undefined, // Conservé pour compatibilité, mais non utilisé
  selectedFile: string | null,
  selectedScrape: ScrapingI | null,
  page: number,
  limit: number,
  currentMonth: number,
  currentYear: number
) => {
  const setLeads = useAppStore((state) => state.setLeads);

  const [scrapings, setScrapings] = useState<ScrapingI[]>([]);
  const [monthlyScrapings, setMonthlyScrapings] = useState<{ [date: string]: ScrapingI[] }>({});
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const fetchScrapingsData = async () => {
      try {
        const data = await fetchFilteredScrapings(); // Appel sans paramètres de date
        console.log('Scrapings chargés dans useLeadsData:', data); // Log temporaire
        setScrapings(data);
      } catch (error) {
        setError('Failed to fetch scrapings: ' + error);
      } finally {
        setLoading(false);
      }
    };
    fetchScrapingsData();
  }, []); // Supprimé selectedDateRange des dépendances

  useEffect(() => {
    const fetchLeadsData = async () => {
      if (selectedFile && selectedScrape) {
        try {
          console.log(
            'view',
            'leads',
            'User viewed leads for scraping ID ' + selectedFile
          );
          const filters = {};
          const result = await fetchFilteredLeadsByScrapingId(selectedFile, filters, page, limit);
          setLeads(result.leads || []);
          setTotal(result.total);
        } catch (error) {
          setError('Error loading leads by scraping ID: ' + error);
        }
      } else {
        setLeads([]);
        setTotal(0);
      }
    };
    fetchLeadsData();
  }, [selectedFile, selectedScrape, page, limit, setLeads]);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const data = await fetchScrapingsByMonth(currentMonth, currentYear);
        setMonthlyScrapings(data);
      } catch (error) {
        console.error('Error fetching monthly scrapings:', error);
      }
    };
    fetchMonthlyData();
  }, [currentMonth, currentYear]);

  return {
    scrapings,
    setScrapings,
    monthlyScrapings,
    setMonthlyScrapings,
    total,
    setTotal,
    loading,
    setLoading,
    error,
    setError,
  };
};