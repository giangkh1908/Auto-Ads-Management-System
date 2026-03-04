import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import shop_icon from "../../../assets/home/shop.png";
import meta_icon from "../../../assets/home/meta.png";
import website_icon from "../../../assets/home/AAMS_2.png";
import tryai_icon from "../../../assets/home/chatbot.png";

const PlatformSection = () => {
    const { t } = useTranslation();

    const platforms = [
        { key: "shop", icon: shop_icon, label: t("platforms.shop") },
        { key: "meta", icon: meta_icon, label: t("platforms.meta") },
        { key: "website", icon: website_icon, label: t("platforms.website") },
        { key: "tryai", icon: tryai_icon, label: t("platforms.tryai") },
    ];

    return (
        <section className="platform-section">
            <div className="container">
                <motion.h2
                    className="section-title"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    {t("home.platform_title")}
                </motion.h2>
                <motion.p
                    className="section-subtitle"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    {t("home.platform_subtitle")}
                </motion.p>

                <div className="platform-grid">
                    {platforms.map((platform, index) => (
                        <motion.div
                            key={platform.key}
                            className="platform-card glass-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -10 }}
                        >
                            <div className={`platform-icon ${platform.key}`}>
                                <img
                                    src={platform.icon}
                                    alt={platform.label}
                                    className="platform-icon-image"
                                    loading="lazy"
                                />
                            </div>
                            <h3>{platform.label}</h3>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PlatformSection;
