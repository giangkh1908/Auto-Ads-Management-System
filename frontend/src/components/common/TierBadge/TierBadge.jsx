import React from 'react';
import { useTranslation } from 'react-i18next';
import { Gem, Crown, Shield } from 'lucide-react';
import './TierBadge.css';

const TierBadge = ({ tier, size = 'medium', showLabel = true }) => {
    const { t } = useTranslation();

    if (!tier) return null;

    const tierKey = tier.toLowerCase();

    const getBadgeConfig = () => {
        switch (tierKey) {
            case '3months':
            case 'basic':
                return {
                    icon: Shield,
                    label: t('tiers.basic', { defaultValue: 'Cơ Sở' }),
                    className: 'tier-basic'
                };
            case '6months':
            case 'pro':
                return {
                    icon: Crown,
                    label: t('tiers.pro', { defaultValue: 'Hoàng Kim' }),
                    className: 'tier-pro'
                };
            case '1year':
            case '12months':
            case 'elite':
                return {
                    icon: Gem,
                    label: t('tiers.elite', { defaultValue: 'Chí tôn' }),
                    className: 'tier-elite'
                };
            default:
                return {
                    icon: Shield,
                    label: tier,
                    className: 'tier-default'
                };
        }
    };

    const { icon: Icon, label, className } = getBadgeConfig();

    return (
        <div className={`tier-badge-container ${className} size-${size}`}>
            <div className="tier-badge-icon">
                <Icon size={size === 'small' ? 12 : size === 'medium' ? 16 : 20} />
            </div>
            {showLabel && <span className="tier-badge-label">{label}</span>}
            {tierKey === 'elite' && <div className="tier-elite-glow"></div>}
        </div>
    );
};

export default TierBadge;
