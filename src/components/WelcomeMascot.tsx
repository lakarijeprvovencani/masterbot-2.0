import React, { useState, useEffect } from 'react';
import logoSrc from '../assets/images/logobotprovidan.png';

interface WelcomeMascotProps {
  firstName: string;
  onStartTour?: () => void;
  mode: 'welcome' | 'goodbye';
}

const WelcomeMascot: React.FC<WelcomeMascotProps> = ({ firstName, onStartTour, mode }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), mode === 'welcome' ? 1500 : 100);
    return () => clearTimeout(timer);
  }, [mode]);

  if (!isVisible) return null;

  const content = {
    welcome: {
      title: `Hej ${firstName}! 👋`,
      text: "Spreman da pokreneš svoj marketing? Klikni na dugme ispod da ti pokažem kako!",
      button: "Započni Vodič"
    },
    goodbye: {
      title: "Sjajno! ✨",
      text: "Ako ti ikad ponovo zatreba vodič, možeš ga aktivirati u podešavanjima. Srećno!",
      button: null
    }
  }

  const currentContent = content[mode];

  const wrapperClasses = mode === 'goodbye'
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in"
    : "fixed bottom-8 right-8 z-50 flex items-end space-x-4 animate-fade-in-up";

  return (
    <div className={wrapperClasses}>
      {mode === 'goodbye' && (
        <div className="w-24 h-24 mb-4 bg-gradient-to-br from-[#F56E36] to-[#d15a2c] rounded-full flex items-center justify-center shadow-2xl shadow-[#F56E36]/40">
          <img src={logoSrc} alt="Masterbot Mascot" className="w-20 h-20" />
        </div>
      )}
      <div className="relative bg-gradient-to-br from-[#1E234E] to-[#0D1240] border border-white/15 rounded-2xl p-6 shadow-2xl max-w-sm text-center text-white">
        <p className="text-2xl font-bold mb-2 text-white">{currentContent.title}</p>
        <p className="text-white/80">{currentContent.text}</p>
        {currentContent.button && onStartTour && (
          <button
            onClick={onStartTour}
            className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-[#F56E36] to-[#d15a2c] text-white rounded-lg hover:opacity-90 transition-opacity duration-300 font-semibold"
          >
            {currentContent.button}
          </button>
        )}
      </div>
      {mode === 'welcome' && (
        <div className="w-20 h-20 bg-gradient-to-br from-[#F56E36] to-[#d15a2c] rounded-full flex items-center justify-center shadow-2xl shadow-[#F56E36]/40">
          <img src={logoSrc} alt="Masterbot Mascot" className="w-14 h-14" />
        </div>
      )}
    </div>
  );
};

export default WelcomeMascot;
