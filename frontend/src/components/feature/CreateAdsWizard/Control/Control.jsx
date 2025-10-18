import { Folder, Grid, FileText, Eye } from "lucide-react";
import "./Control.css";

function Control({
  wizardStep,
  setWizardStep,
  completedSteps,
  campaignsList = [],
  setSelectedCampaignIndex,
  adsetsByCampaign = [],
  adsByAdset = [],
  setSelectedAdsetIndex,
  setSelectedAdIndex,
}) {
  // Function to check if a step can be clicked
  const canClickStep = (targetStep) => {
    if (targetStep === wizardStep) return true;
    if (completedSteps[targetStep]) return true;
    if (targetStep === 0) return true;
    if (targetStep === 1 && completedSteps[0]) return true;
    if (targetStep === 2 && completedSteps[1]) return true;
    if (targetStep === 3 && completedSteps[2]) return true;
    if (targetStep === 4 && completedSteps[3]) return true;
    return false;
  };

  // Function to handle step click
  const handleStepClick = (targetStep, campaignIndex, adsetIndex, adIndex) => {
    if (!canClickStep(targetStep)) return;
    
    if (campaignIndex !== undefined) setSelectedCampaignIndex?.(campaignIndex);
    if (adsetIndex !== undefined) setSelectedAdsetIndex?.(adsetIndex);
    if (adIndex !== undefined) setSelectedAdIndex?.(adIndex);
    setWizardStep(targetStep);
  };

  // Get current campaign, adset, and ad (simplified structure)
  const currentCampaign = campaignsList[0] || {};
  const currentAdsets = adsetsByCampaign[0] || [];
  const currentAdset = currentAdsets[0] || {};
  const currentAds = adsByAdset[0]?.[0] || [];
  const currentAd = currentAds[0] || {};

  return (
    <div className="wizard-sidebar">
      <div className="hierarchy-container">
        <div className="hierarchy-list">
          {/* Campaign */}
          <div
            className={`hierarchy-item campaign-item ${
              wizardStep === 1 ? "current" : completedSteps[1] ? "completed" : ""
            } ${!canClickStep(1) ? "disabled" : ""}`}
            onClick={() => handleStepClick(1, 0, 0, 0)}
          >
            <div className="hierarchy-icon">
              <Folder size={16} />
            </div>
            <div className="hierarchy-content">
              <div className="hierarchy-label">Chiến dịch</div>
              <div className="hierarchy-name">{currentCampaign?.name || "Chiến dịch mới"}</div>
            </div>
            <div className="hierarchy-status">
              {wizardStep === 1 ? "●" : completedSteps[1] ? "✓" : ""}
            </div>
          </div>

          {/* Adset */}
          <div
            className={`hierarchy-item adset-item ${
              wizardStep === 2 ? "current" : completedSteps[2] ? "completed" : ""
            } ${!canClickStep(2) ? "disabled" : ""}`}
            onClick={() => handleStepClick(2, 0, 0, 0)}
          >
            <div className="hierarchy-icon">
              <Grid size={16} />
            </div>
            <div className="hierarchy-content">
              <div className="hierarchy-label">Nhóm quảng cáo</div>
              <div className="hierarchy-name">{currentAdset?.name || "Nhóm quảng cáo mới"}</div>
            </div>
            <div className="hierarchy-status">
              {wizardStep === 2 ? "●" : completedSteps[2] ? "✓" : ""}
            </div>
          </div>

          {/* Ad */}
          <div
            className={`hierarchy-item ad-item ${
              wizardStep === 3 ? "current" : completedSteps[3] ? "completed" : ""
            } ${!canClickStep(3) ? "disabled" : ""}`}
            onClick={() => handleStepClick(3, 0, 0, 0)}
          >
            <div className="hierarchy-icon">
              <FileText size={16} />
            </div>
            <div className="hierarchy-content">
              <div className="hierarchy-label">Quảng cáo</div>
              <div className="hierarchy-name">{currentAd?.name || "Quảng cáo mới"}</div>
            </div>
            <div className="hierarchy-status">
              {wizardStep === 3 ? "●" : completedSteps[3] ? "✓" : ""}
            </div>
          </div>

          {/* Creative Review */}
          <div
            className={`hierarchy-item creative-item ${
              wizardStep === 4 ? "current" : completedSteps[4] ? "completed" : ""
            } ${!canClickStep(4) ? "disabled" : ""}`}
            onClick={() => handleStepClick(4)}
          >
            <div className="hierarchy-icon">
              <Eye size={16} />
            </div>
            <div className="hierarchy-content">
              <div className="hierarchy-label">Xem trước</div>
              <div className="hierarchy-name">Creative Review</div>
            </div>
            <div className="hierarchy-status">
              {wizardStep === 4 ? "●" : completedSteps[4] ? "✓" : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Control;