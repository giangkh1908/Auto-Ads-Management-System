import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import laptop_white from "../../../assets/home/macbook-white.png";

const Hero = ({ isAuthenticated, user, onCtaClick }) => {
    const { t } = useTranslation();

    return (
        <section className="hero-section">
            <div className="hero-container">
                <div className="hero-content">
                    <motion.div
                        className="hero-text"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <motion.h1
                            className="hero-title"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            {t("home.hero_title")}
                        </motion.h1>
                        <motion.p
                            className="hero-description"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                        >
                            {t("home.hero_description")}
                        </motion.p>
                        {!user?.internal_role && (
                            <motion.button
                                className="cta-button-home"
                                onClick={onCtaClick}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.5, delay: 0.9 }}
                            >
                                {isAuthenticated && user?.avatar && (
                                    <img
                                        src={user.avatar}
                                        alt={user?.full_name || "Avatar"}
                                        className="cta-avatar"
                                    />
                                )}
                                {isAuthenticated ? (
                                    <span>SỬ DỤNG NGAY</span>
                                ) : (
                                    <span>{t("home.get_started")}</span>
                                )}
                            </motion.button>
                        )}
                    </motion.div>

                    <motion.div
                        className="hero-visual"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <img
                            src={laptop_white}
                            alt="Modern laptop mockup"
                            className="laptop-mockup"
                            loading="lazy"
                        />
                        <iframe
                            className="youtube-video"
                            src="https://www.youtube.com/embed/9U53xR0fhqI"
                            title="Video Trailer"
                            allow="autoplay; encrypted-media"
                        ></iframe>
                    </motion.div>
                </div>
            </div>
            <div className="wave-divider">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
                </svg>
            </div>
        </section>
    );
};

export default Hero;
