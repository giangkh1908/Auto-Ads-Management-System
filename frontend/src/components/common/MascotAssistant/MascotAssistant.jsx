import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, PresentationControls, Html, useAnimations, Environment } from '@react-three/drei';
import { useAuth } from '../../../hooks/auth/useAuth';
import { useChat } from '../../../hooks/chat/useChat';
import { MessageCircle, X, Send, Minimize2, Sparkles, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeHtml } from '../../../utils/security/sanitizeHtml';
import './MascotAssistant.css';

// Component để render mô hình 3D (Tạm thời dùng Stork animated cực kỳ ổn định của Three.js)
function MascotModel(props) {
    const { scene, animations } = useGLTF('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Stork.glb');
    const group = useRef();
    const { actions } = useAnimations(animations, group);

    useEffect(() => {
        if (actions && actions['StorkFly_']) {
            actions['StorkFly_'].play();
        } else if (actions && Object.keys(actions).length > 0) {
            actions[Object.keys(actions)[0]].play();
        }
    }, [actions]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (group.current) {
            // Bay lượn theo vòng tròn nhỏ
            const radius = 0.5;
            const speed = 0.8;
            group.current.position.x = Math.sin(t * speed) * radius;
            group.current.position.z = Math.cos(t * speed) * radius;
            group.current.position.y = Math.sin(t * 2) * 0.2; // Bay lên xuống nhẹ

            // Xoay hướng theo hướng bay
            group.current.rotation.y = t * speed + Math.PI;
        }
    });

    return <primitive ref={group} object={scene} {...props} />;
}

// Fallback khi model không tải được để tránh trắng trang
function ModelFallback() {
    return (
        <mesh>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="#6366f1" wireframe />
        </mesh>
    );
}

const CrownDecoration = () => (
    <div className="imperial-crown-container">
        <svg viewBox="0 0 120 40" className="crown-svg">
            <defs>
                <linearGradient id="crownRoyal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f093fb" />
                    <stop offset="100%" stopColor="#f5576c" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Angel Wings */}
            <path
                d="M10 35 Q30 5 60 15 M110 35 Q90 5 60 15"
                fill="none"
                stroke="url(#crownRoyal)"
                strokeWidth="2"
                filter="url(#glow)"
            />
            {/* Central Crown Body */}
            <path
                d="M40 38 L35 25 L50 30 L60 10 L70 30 L85 25 L80 38 Z"
                fill="url(#crownRoyal)"
                filter="url(#glow)"
            />
            {/* Soul Gem */}
            <circle cx="60" cy="22" r="3" fill="#fff">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
        </svg>
    </div>
);

const MascotAssistant = () => {
    const { myPackage } = useAuth();
    const [showBubble, setShowBubble] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [selectedAccount, setSelectedAccount] = useState(localStorage.getItem('selectedAdAccount') || '');

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    // Sync account from localStorage
    useEffect(() => {
        const handleStorageChange = () => {
            setSelectedAccount(localStorage.getItem('selectedAdAccount') || '');
        };
        window.addEventListener('storage', handleStorageChange);

        // Polling as fallback because 'storage' event only fires between windows
        const interval = setInterval(handleStorageChange, 2000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    const { messages, isLoading, sendMessage } = useChat(selectedAccount);

    // Auto-scroll chat
    useEffect(() => {
        if (isChatOpen && !isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isChatOpen, isMinimized]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(scrollHeight, 100)}px`;
        }
    }, [inputValue]);

    useEffect(() => {
        if (!myPackage) return;

        const packageId = myPackage?.package_id?.toLowerCase() || '';
        const packageName = myPackage?.package?.name?.toLowerCase() || '';
        const pkgNameRaw = myPackage?.name?.toLowerCase() || '';

        // Chỉ hiển thị cho gói Chí Tôn (Elite / Chatbot AI)
        const isElite = packageId.includes('elite') ||
            packageId.includes('supreme') ||
            packageId.includes('1year') ||
            packageName.includes('chatbot ai') ||
            pkgNameRaw.includes('chatbot ai');

        setIsVisible(isElite);
    }, [myPackage]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading || !selectedAccount) return;
        const msg = inputValue.trim();
        setInputValue('');
        if (textareaRef.current) textareaRef.current.style.height = '24px';
        await sendMessage(msg);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isVisible) return null;

    return (
        <div className={`mascot-assistant-container ${isChatOpen ? 'chat-active' : ''}`}>
            <motion.div
                className="mascot-wrapper"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                onClick={() => !isChatOpen && setIsChatOpen(true)}
                onMouseEnter={() => !isChatOpen && setShowBubble(true)}
                onMouseLeave={() => setShowBubble(false)}
            >
                <div className="mascot-canvas-wrapper">
                    <Canvas
                        shadows
                        camera={{ position: [0, 0, 5], fov: 45 }}
                        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
                        style={{ background: 'transparent' }}
                    >
                        <Suspense fallback={<ModelFallback />}>
                            <ambientLight intensity={1} />
                            <pointLight position={[10, 10, 10]} intensity={1.5} />
                            <Environment preset="city" />

                            <PresentationControls
                                global
                                config={{ mass: 2, tension: 500 }}
                                snap={{ mass: 4, tension: 1500 }}
                                rotation={[0.2, 0.5, 0]}
                                polar={[-Math.PI / 3, Math.PI / 3]}
                                azimuth={[-Math.PI / 1.4, Math.PI / 2]}
                            >
                                <MascotModel scale={0.015} position={[0, -0.5, 0]} />
                            </PresentationControls>
                        </Suspense>
                    </Canvas>
                </div>

                <AnimatePresence>
                    {showBubble && !isChatOpen && (
                        <motion.div
                            className="mascot-status-bubble"
                            initial={{ x: 20, opacity: 0, scale: 0.8 }}
                            animate={{ x: 0, opacity: 1, scale: 1 }}
                            exit={{ x: 20, opacity: 0, scale: 0.8 }}
                        >
                            <Sparkles size={14} className="sparkle-icon" />
                            <span>Chí Tôn AI đang sẵn sàng!</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        className={`mascot-chat-window ${isMinimized ? 'minimized' : ''}`}
                        initial={{ y: 50, opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                        animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ y: 50, opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    >
                        <CrownDecoration />
                        <div className="mascot-chat-header">
                            <div className="header-left">
                                <Crown size={18} className="royal-icon" />
                                <div className="header-info">
                                    <span className="title">Trợ lý Chí Tôn</span>
                                    {selectedAccount && <span className="subtitle">Đang phân tích dữ liệu...</span>}
                                </div>
                            </div>
                            <div className="header-actions">
                                <button onClick={() => setIsMinimized(!isMinimized)}>
                                    <Minimize2 size={16} />
                                </button>
                                <button onClick={() => setIsChatOpen(false)}>
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <motion.div
                                className="chat-content-wrapper"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="mascot-chat-body">
                                    {messages.length === 0 && (
                                        <div className="welcome-screen">
                                            <h3>Chào Chủ sở hữu Chí Tôn!</h3>
                                            <p>Tôi đã sẵn sàng phân tích dữ liệu quảng cáo. Bạn muốn biết gì hôm nay?</p>
                                            <div className="quick-suggestions">
                                                <button onClick={() => setInputValue("Chi tiêu hôm nay thế nào?")}>Chi tiêu hôm nay</button>
                                                <button onClick={() => setInputValue("Campaign nào hiệu quả nhất?")}>Campaign tốt nhất</button>
                                                <button onClick={() => setInputValue("Phân tích xu hướng CTR")}>Xu hướng CTR</button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="messages-list">
                                        {messages.map((m) => (
                                            <motion.div
                                                key={m.id}
                                                className={`message-bubble ${m.role}`}
                                                initial={{ y: 10, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                            >
                                                <div className="content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(m.content) }} />
                                            </motion.div>
                                        ))}
                                        {isLoading && (
                                            <div className="message-bubble assistant loading">
                                                <div className="typing-dots"><span></span><span></span><span></span></div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>
                                <div className="mascot-chat-footer">
                                    <textarea
                                        ref={textareaRef}
                                        placeholder="Hỏi trợ lý Chí Tôn..."
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={isLoading || !selectedAccount}
                                    />
                                    <motion.button
                                        className="send-btn"
                                        onClick={handleSend}
                                        disabled={isLoading || !inputValue.trim()}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Send size={18} />
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MascotAssistant;
