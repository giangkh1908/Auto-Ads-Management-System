import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
    ShoppingCart, DollarSign, Package, TrendingUp, Users, Briefcase, Calendar, Sparkles, ShoppingBag,
} from "lucide-react";

const TemplateSection = () => {
    const { t } = useTranslation();

    const templates = [
        { icon: <ShoppingCart size={28} />, label: t("home.buy_product") },
        { icon: <DollarSign size={28} />, label: t("home.recharge") },
        { icon: <Package size={28} />, label: t("home.order_tracking") },
        { icon: <TrendingUp size={28} />, label: t("home.sales_capability") },
        { icon: <Users size={28} />, label: t("home.sales_consulting") },
        { icon: <Briefcase size={28} />, label: t("home.recruitment") },
        { icon: <Calendar size={28} />, label: t("home.booking") },
        { icon: <Sparkles size={28} />, label: t("home.viral") },
        { icon: <ShoppingBag size={28} />, label: t("home.order_management") },
    ];

    return (
        <section className="templates-section">
            <div className="container">
                <motion.h2
                    className="section-title"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    {t("home.templates_title")}
                </motion.h2>
                <motion.p
                    className="section-subtitle"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    {t("home.templates_subtitle")}
                </motion.p>

                <div className="bento-grid">
                    {templates.map((template, index) => (
                        <motion.div
                            key={index}
                            className="template-card bento-item"
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            whileHover={{ y: -8, boxShadow: "0 12px 24px rgba(0,0,0,0.15)" }}
                        >
                            <div className="template-icon">
                                {template.icon}
                            </div>
                            <span>{template.label}</span>
                        </motion.div>
                    ))}
                </div>
                <p className="templates-footer">{t("home.templates_footer")}</p>
            </div>
        </section>
    );
};

export default TemplateSection;
