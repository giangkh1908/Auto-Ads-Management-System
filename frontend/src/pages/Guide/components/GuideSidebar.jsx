import React from "react";
import { Search } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const GuideSidebar = ({ searchTerm, setSearchTerm, filteredSections, activeSection, scrollToSection, t }) => {
    return (
        <aside className="guide-page-sidebar">
            <div className="guide-page-search-box">
                <Search size={18} className="guide-page-search-icon" />
                <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="guide-page-search-input"
                />
            </div>

            <nav className="guide-page-nav">
                <h3 className="guide-page-nav-title">{t('tableOfContents')}</h3>
                <ul className="guide-page-nav-list">
                    {filteredSections.map((section, index) => {
                        const Icon = section.icon;
                        return (
                            <motion.li
                                key={section.id}
                                className="guide-page-nav-item"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <button
                                    onClick={() => scrollToSection(section.id)}
                                    className={`guide-page-nav-link ${activeSection === section.id ? "active" : ""}`}
                                >
                                    <Icon size={18} className="guide-page-nav-icon" />
                                    <span>{t(section.titleKey)}</span>
                                </button>
                            </motion.li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
};

export default GuideSidebar;
