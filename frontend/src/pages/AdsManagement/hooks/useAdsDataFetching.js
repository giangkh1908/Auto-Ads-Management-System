import { useCallback, useRef, useEffect } from "react";
import axiosInstance from "../../../utils/axios";
import {
  transformCampaign,
  transformAdset,
  transformAd,
  mergeInsights,
} from "../services/adsDataService";
import {
  getCacheKey,
  isCacheValid,
  updateCacheTimestamp,
} from "../services/adsCacheService";

const BATCH_SIZE = 50;
const PAGE_SIZE = 200;
const CACHE_TTL = Number.POSITIVE_INFINITY;

/**
 * Custom hook to manage data fetching for campaigns, adsets, and ads
 * Handles caching, insights fetching, and data transformation
 */
export function useAdsDataFetching(datasets, setDatasets, cache, setCache) {
  const cacheRef = useRef(cache);
  const datasetsRef = useRef(datasets);

  // Update refs when state changes
  useEffect(() => {
    cacheRef.current = cache;
    datasetsRef.current = datasets;
  }, [cache, datasets]);

  /**
   * Fetch insights in batches
   */
  const fetchInsightsBatch = useCallback(async (entityIds, endpoint) => {
    if (!entityIds.length) return {};
    
    const insightsMap = {};
    try {
      for (let i = 0; i < entityIds.length; i += BATCH_SIZE) {
        const batch = entityIds.slice(i, i + BATCH_SIZE);
        const { data: ins } = await axiosInstance.get(
          `${endpoint}?ids=${batch.join(',')}`
        );
        if (ins?.items?.length) {
          ins.items.forEach(it => {
            insightsMap[it.id] = it.insights || {};
          });
        }
        // Delay between batches to avoid rate limit
        if (i + BATCH_SIZE < entityIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (e) {
      console.warn(`${endpoint} insights fetch failed`, e);
    }
    return insightsMap;
  }, []);

  const fetchPaginated = useCallback(async (endpoint, params, onChunk) => {
    let page = 1;
    let keepFetching = true;

    while (keepFetching) {
      const response = await axiosInstance.get(endpoint, {
        params: {
          ...params,
          page,
          limit: PAGE_SIZE,
        },
      });

      const data = response.data || {};
      const items = data.items || [];
      const pages = data.pages || null;

      await onChunk(items, {
        page,
        total: data.total || 0,
      });

      if (pages) {
        keepFetching = page < pages;
      } else {
        keepFetching = items.length === PAGE_SIZE;
      }

      if (!keepFetching) break;
      page += 1;
    }
  }, []);

  /**
   * Fetch campaigns for account
   */
  const fetchCampaignsForAccount = useCallback(async (accountId, options = {}) => {
    if (!accountId) return;
    const { force = false } = options;
    const cacheKey = getCacheKey(accountId, 'campaigns');
    const currentCache = cacheRef.current;
    const currentDatasets = datasetsRef.current;
    const lastFetch = currentCache.lastFetch?.[cacheKey];
    if (!force && isCacheValid(lastFetch, CACHE_TTL)) {
      if (currentDatasets.campaigns.length > 0) {
        console.log(`✅ Using cached campaigns for account ${accountId}`);
        return;
      }
    }
    
    setDatasets(prev => ({ ...prev, campaigns: [] }));

    const aggregated = [];

    try {
      await fetchPaginated(
        `/api/campaigns`,
        {
          account_id: accountId,
          fetch_all: false,
        },
        async (items) => {
          if (items.length === 0) return;

          if (import.meta.env.DEV) {
            const statusCount = items.reduce((acc, item) => {
              acc[item.status] = (acc[item.status] || 0) + 1;
              return acc;
            }, {});
            console.log(`📊 Backend returned campaigns by status:`, statusCount);
          }

          const mapped = items.map(transformCampaign);
          const campaignIds = mapped.map((c) => c.external_id).filter(Boolean);
          const insightsMap = await fetchInsightsBatch(campaignIds, '/api/campaigns/insights');
          
          const merged = mapped.map((c) => mergeInsights(c, insightsMap[c.external_id] || {}));
          aggregated.push(...merged);

          setDatasets(prev => ({
            ...prev,
            campaigns: [...aggregated],
          }));
        }
      );

      setCache(prev => updateCacheTimestamp(prev, cacheKey));
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  }, [fetchInsightsBatch, setDatasets, setCache, fetchPaginated]);

  /**
   * Fetch adsets for campaign
   */
  const fetchAdsetsForCampaign = useCallback(async (campaignId, accountId, options = {}) => {
    if (!campaignId || !accountId) return;
    const { force = false } = options;
    
    const cacheKey = getCacheKey(accountId, 'adsets', campaignId);
    const currentCache = cacheRef.current;
    const currentDatasets = datasetsRef.current;
    
    const lastFetch = currentCache.lastFetch?.[cacheKey];
    if (!force && isCacheValid(lastFetch, CACHE_TTL)) {
      const cachedAdsets = currentDatasets.adsets.filter(
        a => String(a.campaignId) === String(campaignId) && 
             a.status !== "DELETED" && 
             a.status !== "ARCHIVED"
      );
      if (cachedAdsets.length > 0) {
        console.log(`✅ Using ${cachedAdsets.length} cached adsets for campaign ${campaignId}`);
        return;
      }
    }
    
    const preservedAdsets = datasetsRef.current.adsets.filter(
      a => String(a.campaignId) !== String(campaignId)
    );

    setDatasets(prev => ({
      ...prev,
      adsets: preservedAdsets,
    }));

    const aggregated = [];

    try {
      await fetchPaginated(
        `/api/adsets`,
        {
          campaign_id: campaignId,
          account_id: accountId,
          fetch_all: false,
        },
        async (items) => {
          if (items.length === 0) return;

          if (import.meta.env.DEV) {
            const statusCount = items.reduce((acc, item) => {
              acc[item.status] = (acc[item.status] || 0) + 1;
              return acc;
            }, {});
            console.log(`📊 Backend returned adsets by status:`, statusCount);
          }

          const mapped = items.map((adset) => transformAdset(adset, campaignId));
          const adsetIds = mapped.map((a) => a.external_id).filter(Boolean);
          const insightsMap = await fetchInsightsBatch(adsetIds, '/api/adsets/insights');
          
          const merged = mapped.map((a) => mergeInsights(a, insightsMap[a.external_id] || {}));
          aggregated.push(...merged);

          setDatasets((prev) => ({
            ...prev,
            adsets: [...preservedAdsets, ...aggregated],
          }));
        }
      );

      setCache(prev => updateCacheTimestamp(prev, cacheKey));
    } catch (error) {
      console.error("Error fetching adsets:", error);
    }
  }, [fetchInsightsBatch, setDatasets, setCache, fetchPaginated]);

  /**
   * Fetch ads for adset
   */
  const fetchAdsForAdset = useCallback(async (adsetId, accountId = null, options = {}) => {
    if (!adsetId) return;
    const { force = false } = options;
    
    const cacheKey = getCacheKey(accountId, 'ads', adsetId);
    const currentCache = cacheRef.current;
    const currentDatasets = datasetsRef.current;
    
    const lastFetch = currentCache.lastFetch?.[cacheKey];
    if (!force && isCacheValid(lastFetch, CACHE_TTL)) {
      const cachedAds = currentDatasets.ads.filter(
        a => String(a.adsetId) === String(adsetId) && 
             a.status !== "DELETED" && 
             a.status !== "ARCHIVED"
      );
      if (cachedAds.length > 0) {
        console.log(`✅ Using ${cachedAds.length} cached ads for adset ${adsetId}`);
        return;
      }
    }
    
    const preservedAds = datasetsRef.current.ads.filter(
      a => String(a.adsetId) !== String(adsetId)
    );

    setDatasets(prev => ({
      ...prev,
      ads: preservedAds,
    }));

    const aggregated = [];

    try {
      await fetchPaginated(
        `/api/ads`,
        {
          adset_id: adsetId,
          account_id: accountId,
          fetch_all: false,
        },
        async (items) => {
          if (items.length === 0) return;

          if (import.meta.env.DEV) {
            const statusCount = items.reduce((acc, item) => {
              acc[item.status] = (acc[item.status] || 0) + 1;
              return acc;
            }, {});
            console.log(`📊 Backend returned ads by status:`, statusCount);
          }

          const mapped = items.map((ad) => transformAd(ad, adsetId));
          const adIds = mapped.map((a) => a.external_id).filter(Boolean);
          const insightsMap = await fetchInsightsBatch(adIds, '/api/ads/insights');
          
          const merged = mapped.map((a) => ({
            ...mergeInsights(a, insightsMap[a.external_id] || {}),
            updated_at: a.updated_at || a.updatedAt,
          }));
          aggregated.push(...merged);

          setDatasets((prev) => ({
            ...prev,
            ads: [...preservedAds, ...aggregated],
          }));
        }
      );

      setCache(prev => updateCacheTimestamp(prev, cacheKey));
    } catch (error) {
      console.error("Error fetching ads:", error);
    }
  }, [fetchInsightsBatch, setDatasets, setCache, fetchPaginated]);

  /**
   * Fetch all adsets for account
   */
  const fetchAllAdsetsForAccount = useCallback(async (accountId, options = {}) => {
    if (!accountId) return;
    const { force = false } = options;
    
    const cacheKey = getCacheKey(accountId, 'adsets');
    const currentCache = cacheRef.current;
    const currentDatasets = datasetsRef.current;
    
    const lastFetch = currentCache.lastFetch?.[cacheKey];
    if (!force && isCacheValid(lastFetch, CACHE_TTL)) {
      const cachedAdsets = currentDatasets.adsets.filter(
        a => a.status !== "DELETED" && a.status !== "ARCHIVED"
      );
      if (cachedAdsets.length > 0) {
        console.log(`✅ Using ${cachedAdsets.length} cached adsets for account ${accountId}`);
        return;
      }
    }
    
    setDatasets(prev => ({ ...prev, adsets: [] }));
    const aggregated = [];

    try {
      await fetchPaginated(
        `/api/adsets`,
        {
          account_id: accountId,
          fetch_all: false,
        },
        async (items) => {
          if (items.length === 0) return;

          if (import.meta.env.DEV) {
            const statusCount = items.reduce((acc, item) => {
              acc[item.status] = (acc[item.status] || 0) + 1;
              return acc;
            }, {});
            console.log(`📊 Backend returned adsets by status:`, statusCount);
          }

          const mapped = items.map((adset) => transformAdset(adset));
          const adsetIds = mapped.map((a) => a.external_id).filter(Boolean);
          const insightsMap = await fetchInsightsBatch(adsetIds, '/api/adsets/insights');
          
          const merged = mapped.map((a) => mergeInsights(a, insightsMap[a.external_id] || {}));
          aggregated.push(...merged);

          setDatasets((prev) => ({
            ...prev,
            adsets: [...aggregated],
          }));
        }
      );

      setCache(prev => updateCacheTimestamp(prev, cacheKey));
    } catch (error) {
      console.error("Error fetching adsets:", error);
    }
  }, [fetchInsightsBatch, setDatasets, setCache, fetchPaginated]);

  /**
   * Fetch all ads for account
   */
  const fetchAllAdsForAccount = useCallback(async (accountId, options = {}) => {
    if (!accountId) return;
    const { force = false } = options;
    
    const cacheKey = getCacheKey(accountId, 'ads');
    const currentCache = cacheRef.current;
    const currentDatasets = datasetsRef.current;
    
    const lastFetch = currentCache.lastFetch?.[cacheKey];
    if (!force && isCacheValid(lastFetch, CACHE_TTL)) {
      const cachedAds = currentDatasets.ads.filter(
        a => a.status !== "DELETED" && a.status !== "ARCHIVED"
      );
      if (cachedAds.length > 0) {
        console.log(`✅ Using ${cachedAds.length} cached ads for account ${accountId}`);
        return;
      }
    }
    
    setDatasets(prev => ({ ...prev, ads: [] }));
    const aggregated = [];

    try {
      await fetchPaginated(
        `/api/ads`,
        {
          account_id: accountId,
          fetch_all: false,
        },
        async (items) => {
          if (items.length === 0) return;

          if (import.meta.env.DEV) {
            const statusCount = items.reduce((acc, item) => {
              acc[item.status] = (acc[item.status] || 0) + 1;
              return acc;
            }, {});
            console.log(`📊 Backend returned ads by status:`, statusCount);
          }

          const mapped = items.map((ad) => transformAd(ad));
          const adIds = mapped.map((a) => a.external_id).filter(Boolean);
          const insightsMap = await fetchInsightsBatch(adIds, '/api/ads/insights');
          
          const merged = mapped.map((a) => ({
            ...mergeInsights(a, insightsMap[a.external_id] || {}),
            updated_at: a.updated_at || a.updatedAt,
          }));
          aggregated.push(...merged);

          setDatasets((prev) => ({
            ...prev,
            ads: [...aggregated],
          }));
        }
      );

      setCache(prev => updateCacheTimestamp(prev, cacheKey));
    } catch (error) {
      console.error("Error fetching ads:", error);
    }
  }, [fetchInsightsBatch, setDatasets, setCache, fetchPaginated]);

  return {
    fetchCampaignsForAccount,
    fetchAdsetsForCampaign,
    fetchAdsForAdset,
    fetchAllAdsetsForAccount,
    fetchAllAdsForAccount,
  };
}

