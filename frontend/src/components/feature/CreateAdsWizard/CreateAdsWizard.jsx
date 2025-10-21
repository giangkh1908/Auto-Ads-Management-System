import { useEffect, useRef } from "react";
import Control from "../CreateAdsWizard/Control/Control.jsx";
import FooterWizard from "../CreateAdsWizard/FooterWizard/FooterWizard.jsx";
import TargetStep from "../CreateAdsWizard/TargetStep/TargetStep.jsx";
import CreateChild from "../CreateAdsWizard/CreateChild/CreateChild.jsx";
import CampaignStep from "../CreateAdsWizard/CampaignStep/CampaignStep.jsx";
import AdsetStep from "../CreateAdsWizard/AdsetStep/AdsetStep.jsx";
import AdStep from "../CreateAdsWizard/AdStep/AdStep.jsx";
import Creative from "./Creative/Creative.jsx";
import "./CreateAdsWizard.css";

// Import custom hooks
import { useWizardState, useWizardData } from "../../../hooks/useWizardState.js";
import { useFacebookPages } from "../../../hooks/useFacebookPages.js";
import { useEditMode } from "../../../hooks/useEditMode.js";
import { useWizardPublish } from "../../../hooks/useWizardPublish.js";

// Import utils and constants
import { getInitialWizardStep } from "../../../utils/wizardUtils.js";
import { WIZARD_STEPS, EDITING_ITEM_TYPES, TAB_TYPES } from "../../../constants/wizardConstants.js";

function CreateAdsWizard({
  onClose,
  onSuccess = null,
  mode = "create",
  editingItem = null,
  selectedAccountId = null,
  selectedCampaign: _selectedCampaign = null, // eslint-disable-line no-unused-vars
  setDatasets: _setDatasets = null, // eslint-disable-line no-unused-vars
}) {
  const contentRef = useRef(null);
  
  // Refs for step validation
  const campaignRef = useRef(null);
  const adsetRef = useRef(null);
  const adRef = useRef(null);

  // Custom hooks
  const {
    wizardStep,
    setWizardStep,
    activeTab,
    setActiveTab,
    loading,
    setLoading,
    success,
    completedSteps,
    setCompletedSteps,
  } = useWizardState();

  const {
    campaignsList,
    setCampaignsList,
    selectedCampaignIndex,
    setSelectedCampaignIndex,
    campaign,
    setCampaign,
    selectedAdsetIndex,
    setSelectedAdsetIndex,
    adsetsList,
    setAdsetsList,
    adset,
    setAdset,
    selectedAdIndex,
    setSelectedAdIndex,
    adsList,
    setAdsList,
    ad,
    setAd,
  } = useWizardData();

  const facebookPages = useFacebookPages();

  const { handleSmartPublish } = useWizardPublish();

  // Edit mode logic
  useEditMode({
    mode,
    editingItem,
    selectedAccountId,
    setCampaign,
    setAdset,
    setAd,
    setLoading,
  });

  // Lock background scroll while wizard is open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Scroll to top when wizard step changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [wizardStep]);

  // Set initial wizard step based on editingItem
  useEffect(() => {
    if (mode === "edit" && editingItem) {
      const initialStep = getInitialWizardStep(mode, editingItem);
      setWizardStep(initialStep);
    }
  }, [mode, editingItem, setWizardStep]);

  // Handle publish with proper parameters - SMART PUBLISH
  const handlePublishClick = () => {
    // Sequential publish - xử lý từng campaign một cách tuần tự
    handleSmartPublish({
      campaignsList, // THÊM DÒNG NÀY
      selectedAccountId,
      editingItem,
      mode,
      onSuccess,
      onClose,
    });
  };

  // Get title for modal header
  const getModalTitle = () => {
      if (mode === "edit") {
      const typeMap = {
        [EDITING_ITEM_TYPES.CAMPAIGN]: "chiến dịch",
        [EDITING_ITEM_TYPES.ADSET]: "nhóm quảng cáo",
        [EDITING_ITEM_TYPES.AD]: "quảng cáo",
      };
      return `Chỉnh sửa ${typeMap[editingItem?.type] || "quảng cáo"}`;
    }
    return "Tạo chiến dịch";
  };


  return (
    <div className="ads-modal-overlay" role="dialog" aria-modal="true">
      <div className={`ads-modal ${(activeTab === TAB_TYPES.CHILD && wizardStep === WIZARD_STEPS.TARGET) ? "child-tab" : "campaign-tab"}`}>
        <div className="ads-modal-header">
          {wizardStep === WIZARD_STEPS.TARGET && (
            <div className="ads-modal-tabs">
              <button 
                className={`tab-button-campaign ${activeTab === TAB_TYPES.CAMPAIGN ? "active" : "inactive"}`}
                onClick={() => setActiveTab(TAB_TYPES.CAMPAIGN)}
              >
                {getModalTitle()}
              </button>
              <button 
                className={`tab-button-campaign ${activeTab === TAB_TYPES.CHILD ? "active" : "inactive"}`}
                onClick={() => setActiveTab(TAB_TYPES.CHILD)}
              >
                Nhóm quảng cáo hoặc quảng cáo mới
              </button>
            </div>
          )}
          {wizardStep > WIZARD_STEPS.TARGET && (
            <div className="ads-modal-title">
              {getModalTitle()}
            </div>
          )}
        </div>

        <div className="ads-modal-body">
          {(activeTab === TAB_TYPES.CAMPAIGN || wizardStep > WIZARD_STEPS.TARGET) ? (
            <>
              {/* Unified Left Panel - Campaign Hierarchy (hidden for step 0) */}
              {wizardStep > WIZARD_STEPS.TARGET && (
                <Control
                  wizardStep={wizardStep}
                  setWizardStep={setWizardStep}
                  campaignsList={campaignsList}
                  setCampaignsList={setCampaignsList}
                  selectedCampaignIndex={selectedCampaignIndex}
                  setSelectedCampaignIndex={setSelectedCampaignIndex}
                  selectedAdsetIndex={selectedAdsetIndex}
                  setSelectedAdsetIndex={setSelectedAdsetIndex}
                  selectedAdIndex={selectedAdIndex}
                  setSelectedAdIndex={setSelectedAdIndex}
                />
              )}

          <div className="wizard-content" ref={contentRef}>
                {wizardStep === WIZARD_STEPS.TARGET && (
                  <TargetStep campaign={campaign} setCampaign={setCampaign} />
            )}

            {/* Campaign Details Panel */}
                {wizardStep === WIZARD_STEPS.CAMPAIGN && (
              <CampaignStep
                ref={campaignRef}
                campaign={campaign}
                setCampaign={setCampaign}
                campaignsList={campaignsList}
                setCampaignsList={setCampaignsList}
                selectedCampaignIndex={selectedCampaignIndex}
                setSelectedCampaignIndex={setSelectedCampaignIndex}
                facebookPages={facebookPages}
              />
            )}

            {/* Adset Details Panel */}
                {wizardStep === WIZARD_STEPS.ADSET && (
              <AdsetStep
                ref={adsetRef}
                adset={adset}
                setAdset={setAdset}
                mode={mode}
                objective={campaign.objective}
                adsetsList={adsetsList}
                setAdsetsList={setAdsetsList}
              />
            )}

            {/* Ad Details Panel */}
                {wizardStep === WIZARD_STEPS.AD && (
              <AdStep
                ref={adRef}
                ad={ad}
                setAd={setAd}
                mode={mode}
                campaign={campaign}
                adsList={adsList}
                setAdsList={setAdsList}
              />
            )}

            {/* Creative Preview Panel */}
                {wizardStep === WIZARD_STEPS.CREATIVE && (
              <Creative ad={ad} campaign={campaign} adset={adset} />
            )}
          </div>
            </>
          ) : (
            /* CreateChild Mode - Full Width */
            <div className="create-child-full-mode">
              <CreateChild
                onClose={() => setActiveTab(TAB_TYPES.CAMPAIGN)}
                onSave={(data) => {
                  console.log("CreateChild data:", data);
                  // Handle save logic here
                  setActiveTab(TAB_TYPES.CAMPAIGN);
                }}
                isFullMode={true}
              />
            </div>
          )}
        </div>

        {/* Wizard Footer - Show in campaign mode or when wizardStep > 0 */}
        {(activeTab === TAB_TYPES.CAMPAIGN || wizardStep > WIZARD_STEPS.TARGET) && (
          <FooterWizard
            wizardStep={wizardStep}
            setWizardStep={setWizardStep}
            completedSteps={completedSteps}
            setCompletedSteps={setCompletedSteps}
            campaign={campaign}
            adset={adset}
            ad={ad}
            campaignRef={campaignRef}
            adsetRef={adsetRef}
            adRef={adRef}
            loading={loading}
            success={success}
            mode={mode}
            onClose={onClose}
            handlePublish={handlePublishClick}
          />
        )}
      </div>
    </div>
  );
}

export default CreateAdsWizard;