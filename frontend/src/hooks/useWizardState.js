import { useState, useCallback } from "react";
import { INITIAL_DATA } from "../constants/wizardConstants";

/**
 * Custom hook để quản lý state của wizard
 */
export function useWizardState() {
  const [wizardStep, setWizardStep] = useState(0);
  const [activeTab, setActiveTab] = useState("campaign");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Track completed steps
  const [completedSteps, setCompletedSteps] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
  });

  return {
    wizardStep,
    setWizardStep,
    activeTab,
    setActiveTab,
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    completedSteps,
    setCompletedSteps,
  };
}

/**
 * Custom hook để quản lý state của campaigns, adsets và ads
 */
export function useWizardData() {
  // Support multiple campaigns with nested adsets and ads
  const [campaignsList, setCampaignsList] = useState([
    {
      ...INITIAL_DATA.campaign,
      adsets: [
        {
          ...INITIAL_DATA.adset,
          ads: [INITIAL_DATA.ad]
        }
      ]
    }
  ]);
  const [selectedCampaignIndex, setSelectedCampaignIndex] = useState(0);
  const [selectedAdsetIndex, setSelectedAdsetIndex] = useState(0);
  const [selectedAdIndex, setSelectedAdIndex] = useState(0);

  // Derived slices for currently selected campaign
  const campaign = campaignsList[selectedCampaignIndex] || INITIAL_DATA.campaign;
  const setCampaign = useCallback((updater) => {
    setCampaignsList((prev) => {
      const next = [...prev];
      const current = prev[selectedCampaignIndex] || {};
      const updated = typeof updater === 'function' ? updater(current) : updater;
      next[selectedCampaignIndex] = updated;
      return next;
    });
  }, [selectedCampaignIndex]);

  const adsetsList = campaign.adsets || [];
  const setAdsetsList = useCallback((updater) => {
    setCampaignsList((prev) => {
      const next = [...prev];
      const currentCampaign = next[selectedCampaignIndex] || {};
      const currentAdsets = currentCampaign.adsets || [];
      const updatedAdsets = typeof updater === 'function' ? updater(currentAdsets) : updater;
      next[selectedCampaignIndex] = {
        ...currentCampaign,
        adsets: updatedAdsets
      };
      return next;
    });
  }, [selectedCampaignIndex]);

  const adset = adsetsList[selectedAdsetIndex] || INITIAL_DATA.adset;
  const setAdset = useCallback((updater) => {
    setAdsetsList((prev) => {
      const next = [...prev];
      const current = prev[selectedAdsetIndex] || {};
      const updated = typeof updater === 'function' ? updater(current) : updater;
      next[selectedAdsetIndex] = updated;
      return next;
    });
  }, [selectedAdsetIndex, setAdsetsList]);

  const adsList = adset.ads || [];
  const setAdsList = useCallback((updater) => {
    setAdsetsList((prev) => {
      const next = [...prev];
      const currentAdset = next[selectedAdsetIndex] || {};
      const currentAds = currentAdset.ads || [];
      const updatedAds = typeof updater === 'function' ? updater(currentAds) : updater;
      next[selectedAdsetIndex] = {
        ...currentAdset,
        ads: updatedAds
      };
      return next;
    });
  }, [selectedAdsetIndex, setAdsetsList]);

  const ad = adsList[selectedAdIndex] || INITIAL_DATA.ad;
  const setAd = useCallback((updater) => {
    setAdsList((prev) => {
      const next = [...prev];
      const current = prev[selectedAdIndex] || {};
      const updated = typeof updater === 'function' ? updater(current) : updater;
      next[selectedAdIndex] = updated;
      return next;
    });
  }, [selectedAdIndex, setAdsList]);

  return {
    // Campaign state
    campaignsList,
    setCampaignsList,
    selectedCampaignIndex,
    setSelectedCampaignIndex,
    campaign,
    setCampaign,
    
    // Adset state
    selectedAdsetIndex,
    setSelectedAdsetIndex,
    adsetsList,
    setAdsetsList,
    adset,
    setAdset,
    
    // Ad state
    selectedAdIndex,
    setSelectedAdIndex,
    adsList,
    setAdsList,
    ad,
    setAd,
  };
}
