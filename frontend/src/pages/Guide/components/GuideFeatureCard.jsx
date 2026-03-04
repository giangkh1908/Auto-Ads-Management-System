import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const GuideFeatureCard = ({ title, description, icon: Icon }) => {
    return (
        <motion.div
            className="guide-feature-card"
            whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
        >
            <Icon size={24} className="guide-feature-icon" />
            <h3>{title}</h3>
            <p>{description}</p>
        </motion.div>
    );
};

export default GuideFeatureCard;
