import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Phone } from "lucide-react";

const RegistrationSection = ({
    name,
    phone,
    isSubmitting,
    onNameChange,
    onPhoneChange,
    onSubmit
}) => {
    const { t } = useTranslation();

    return (
        <section className="registration-section">
            <div className="wave-divider top">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
                </svg>
            </div>
            <div className="container">
                <motion.h2
                    className="section-title"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    {t("home.registration_title")}
                </motion.h2>
                <motion.p
                    className="section-subtitle"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    {t("home.registration_subtitle")}
                </motion.p>

                <motion.form
                    className="home-registration-form glass-form"
                    onSubmit={onSubmit}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.4 }}
                >
                    <div className="home-form-row">
                        <div className="home-form-group">
                            <input
                                type="text"
                                placeholder={t("home.name_placeholder")}
                                value={name}
                                onChange={onNameChange}
                                required={true}
                                maxLength={200}
                                className="glass-input"
                            />
                        </div>
                        <div className="home-form-group">
                            <input
                                type="tel"
                                placeholder={t("home.phone_placeholder")}
                                value={phone}
                                onChange={onPhoneChange}
                                required={true}
                                maxLength={13}
                                pattern="[0-9\s]{10,13}"
                                className="glass-input"
                            />
                        </div>
                    </div>
                    <motion.button
                        type="submit"
                        className="submit-button-home"
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.05, translateY: -3 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Phone size={20} />
                        <span>{isSubmitting ? t("home.submitting") : t("home.call_me")}</span>
                    </motion.button>
                </motion.form>
            </div>
            <div className="wave-divider bottom">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
                </svg>
            </div>
        </section>
    );
};

export default RegistrationSection;
