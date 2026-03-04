import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import { useAuth } from "../../hooks/auth/useAuth";
import { ROUTES } from "../../constants/app.constants";
import leadService from "../../services/leads/leadService";
import { useToast } from "../../hooks/common/useToast";
import { formatPhoneNumber } from "../../utils/formatters/phoneUtils";

// Sub-components
import Hero from "../../components/feature/Home/Hero";
import PlatformSection from "../../components/feature/Home/PlatformSection";
import TemplateSection from "../../components/feature/Home/TemplateSection";
import MinigameSection from "../../components/feature/Home/MinigameSection";
import TutorialSection from "../../components/feature/Home/TutorialSection";
import RegistrationSection from "../../components/feature/Home/RegistrationSection";

function Home({ onLoginClick }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);

    try {
      const phoneNumber = phone.replace(/\s/g, "");

      const response = await leadService.createLead({
        lead_name: name.trim(),
        phone: phoneNumber,
      });

      if (response.success) {
        toast.success(
          response.message || "Đăng ký tư vấn thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất."
        );
        setName("");
        setPhone("");
      } else {
        toast.error(response.message || "Có lỗi xảy ra khi đăng ký");
      }
    } catch (error) {
      const errorMessage = error.message || "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleButtonClick = () => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    } else {
      onLoginClick();
    }
  };

  return (
    <div className="landing-page">
      <Hero
        isAuthenticated={isAuthenticated}
        user={user}
        onCtaClick={handleButtonClick}
      />

      <PlatformSection />

      <TemplateSection />

      <MinigameSection />

      <TutorialSection />

      <RegistrationSection
        name={name}
        phone={phone}
        isSubmitting={isSubmitting}
        onNameChange={handleNameChange}
        onPhoneChange={handlePhoneChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default Home;
