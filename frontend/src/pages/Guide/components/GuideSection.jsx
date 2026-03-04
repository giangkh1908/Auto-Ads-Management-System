import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const GuideSection = ({ id, title, icon: Icon, children }) => {
    return (
        <motion.section
            id={id}
            className="guide-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
        >
            <h2 className="guide-section-title">
                <Icon size={24} className="guide-section-icon" />
                {title}
            </h2>
            <div className="guide-section-content">
                {children}
            </div>
        </motion.section>
    );
};

export default GuideSection;
