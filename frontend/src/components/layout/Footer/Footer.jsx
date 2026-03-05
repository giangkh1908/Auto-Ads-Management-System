import { useTranslation } from 'react-i18next'
import { MapPin, Phone, PhoneCall, Mail, Clock, Facebook, Youtube, ExternalLink } from 'lucide-react'
import './Footer.css'
import logo_1 from "../../../assets/Logo_Fchat.png";

function Footer() {
    const { t } = useTranslation()

    return (
        <footer className="app-footer">
            <div className="footer-inner">
                <div className="footer-col brand-col">
                    <div className="brand">
                        <img src={logo_1} alt="Fchat Logo" className="brand-logo-image" />
                    </div>
                    <ul className="contact-list">
                        <li><MapPin size={15} className="contact-icon" /> {t('footer.address')}</li>
                        <li><Phone size={15} className="contact-icon" /> {t('footer.support')}</li>
                        <li><PhoneCall size={15} className="contact-icon" /> {t('footer.complaint')}</li>
                        <li><Mail size={15} className="contact-icon" /> {t('footer.email')}</li>
                        <li><Clock size={15} className="contact-icon" /> {t('footer.working_hours')}</li>
                    </ul>
                </div>

                <div className="footer-col links-col">
                    <h4>{t('footer.help_center')}</h4>
                    <ul>
                        <li><a href="service-package">{t('footer.pricing')}</a></li>
                        <li><a href="guide">{t('footer.guide')}</a></li>
                    </ul>
                </div>

                <div className="footer-col links-col">
                    <h4>{t('footer.policy')}</h4>
                    <ul>
                        <li>
                            <a href="https://www.facebook.com/groups/fchat.vn" target="_blank" rel="noopener noreferrer">
                                {t('footer.support_group')} <ExternalLink size={12} className="external-icon" />
                            </a>
                        </li>
                        <li>
                            <a href="https://fchat.vn/blog" target="_blank" rel="noopener noreferrer">
                                {t('footer.blog')} <ExternalLink size={12} className="external-icon" />
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="footer-col store-col">
                    <h4>{t('footer.download_app')}</h4>
                    <div className="store-badges">
                        <a className="store-badge play" href="https://play.google.com/store/apps/details?id=com.fchatapp" aria-label="Google Play" target="_blank" rel="noopener noreferrer">{t('footer.google_play')}</a>
                        <a className="store-badge app" href="https://apps.apple.com/vn/app/fchat-chatbot-messenger/id1596079328" aria-label="App Store" target="_blank" rel="noopener noreferrer">{t('footer.app_store')}</a>
                    </div>
                    <h4>{t('footer.connect_fchat')}</h4>
                    <div className="socials">
                        <a className="social fb" href="https://www.facebook.com/fchat.chatbot" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                            <Facebook size={18} />
                        </a>
                        <a className="social yt" href="https://www.youtube.com/channel/UCjzpv6N7pKvw1oSOmgAsNig" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                            <Youtube size={18} />
                        </a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>© {new Date().getFullYear()} Fchat. All rights reserved.</p>
            </div>
        </footer>
    )
}
export default Footer;