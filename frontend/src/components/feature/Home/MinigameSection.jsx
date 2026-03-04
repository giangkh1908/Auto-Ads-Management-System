import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import review_1 from "../../../assets/home/review_1.png";
import review_2 from "../../../assets/home/review_2.png";
import review_3 from "../../../assets/home/review_3.png";
import review_4 from "../../../assets/home/review_4.png";
import review_5 from "../../../assets/home/review_5.png";
import review_6 from "../../../assets/home/review_6.png";
import review_7 from "../../../assets/home/review_7.png";
import review_8 from "../../../assets/home/review_8.png";
import review_9 from "../../../assets/home/review_9.png";

const MinigameSection = () => {
    const { t } = useTranslation();

    const reviews = [
        review_1, review_2, review_3, review_4, review_5,
        review_6, review_7, review_8, review_9,
    ];

    return (
        <section className="minigame-section">
            <div className="container">
                <motion.h2
                    className="section-title"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    {t("home.minigame_title")}
                </motion.h2>
                <motion.p
                    className="section-subtitle"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    {t("home.minigame_subtitle")}
                </motion.p>

                <div className="carousel-wrapper">
                    <motion.div
                        className="carousel-track"
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{
                            duration: 30,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        {[...reviews, ...reviews].map((review, index) => (
                            <div key={index} className="minigame-card glass-card">
                                <img
                                    src={review}
                                    alt={`Dashboard Review ${index + 1}`}
                                    className="minigame-image"
                                    loading="lazy"
                                />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default MinigameSection;
