import React from 'react';
import { AlertTriangle, Trash2, Archive, X, Play, Pause } from 'lucide-react';
import './ConfirmationPopup.css';

const ConfirmationPopup = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Xác nhận", 
  cancelText = "Hủy",
  type = "delete", // "delete" | "archive" | "activate" | "deactivate"
  isLoading = false 
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <Trash2 size={24} className="confirmation-icon delete-icon" />;
      case 'archive':
        return <Archive size={24} className="confirmation-icon archive-icon" />;
      case 'activate':
        return <Play size={24} className="confirmation-icon activate-icon" />;
      case 'deactivate':
        return <Pause size={24} className="confirmation-icon deactivate-icon" />;
      default:
        return <AlertTriangle size={24} className="confirmation-icon warning-icon" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'delete':
        return 'btn-confirm-delete';
      case 'archive':
        return 'btn-confirm-archive';
      case 'activate':
        return 'btn-confirm-activate';
      case 'deactivate':
        return 'btn-confirm-deactivate';
      default:
        return 'btn-confirm-default';
    }
  };

  return (
    <div className="confirmation-overlay" onClick={handleBackdropClick}>
      <div className="confirmation-popup">
        <div className="confirmation-header">
          <div className="confirmation-icon-container">
            {getIcon()}
          </div>
          <button 
            className="confirmation-close-btn" 
            onClick={onClose}
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="confirmation-content">
          <h3 className="confirmation-title">{title}</h3>
          <p className="confirmation-message">{message}</p>
        </div>
        
        <div className="confirmation-footer">
          <button 
            className="btn-cancel" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            className={`btn-confirm ${getConfirmButtonClass()}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner-popup">
                <div className="spinner-popup"></div>
                <span>Đang xử lý...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
