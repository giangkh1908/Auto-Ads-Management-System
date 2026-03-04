import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import rule1_tutorial from "../../../assets/home/autorule_1.png";
import rule2_tutorial from "../../../assets/home/autorule_2.png";
import rule3_tutorial from "../../../assets/home/autorule_3.png";
import rule4_tutorial from "../../../assets/home/autorule_4.png";

const TutorialSection = () => {
    const { t } = useTranslation();

    const tutorials = [
        { src: rule1_tutorial, alt: "Chatbot tutorial" },
        { src: rule2_tutorial, alt: "Setup tutorial" },
        { src: rule3_tutorial, alt: "Sales automation tutorial" },
        { src: rule4_tutorial, alt: "Game features tutorial" },
    ];

    return (
        <section className="tutorial-section">
            <div className="container">
                <motion.h2
                    className="section-title"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    {t("home.tutorial_title")}
                </motion.h2>
                <motion.p
                    className="section-subtitle"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    {t("home.tutorial_subtitle")}
                </motion.p>

                <div className="tutorial-grid">
                    {tutorials.map((tutorial, index) => (
                        <motion.div
                            key={index}
                            className="tutorial-card glass-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                        >
                            <div className="tutorial-thumbnail">
                                <img
                                    src={tutorial.src}
                                    alt={tutorial.alt}
                                    loading="lazy"
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TutorialSection;
