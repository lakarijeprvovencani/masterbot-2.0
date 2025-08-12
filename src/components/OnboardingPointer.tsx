import React from 'react';

interface OnboardingPointerProps {
  text: string;
  onNext: () => void;
  onDismiss: () => void;
  nextButtonText?: string;
  position: { top?: string; right?: string; bottom?: string; left?: string; };
  arrowPosition: 'top' | 'right' | 'bottom' | 'left';
}

const OnboardingPointer: React.FC<OnboardingPointerProps> = ({ text, onNext, onDismiss, nextButtonText = 'Dalje', position, arrowPosition }) => {
  const arrowClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 border-b-8 border-b-[#F56E36]',
    right: 'left-full top-1/2 -translate-y-1/2 border-l-8 border-l-[#F56E36]',
    bottom: 'top-full left-1/2 -translate-x-1/2 border-t-8 border-t-[#F56E36]',
    left: 'right-full top-1/2 -translate-y-1/2 border-r-8 border-r-[#F56E36]',
  };

  return (
    <div className="fixed z-[100] animate-fade-in-up" style={position}>
      <div className="relative bg-[#0D1240] border-2 border-[#F56E36] rounded-xl p-5 shadow-2xl shadow-[#F56E36]/30 max-w-xs text-white">
        <div className={`absolute w-0 h-0 border-transparent ${arrowClasses[arrowPosition]}`}></div>
        <button 
          onClick={onDismiss}
          className="absolute top-2 right-2 text-white/50 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <p className="pr-4">{text}</p>
        <button
          onClick={onNext}
          className="mt-4 px-4 py-2 bg-gradient-to-r from-[#F56E36] to-[#d15a2c] text-white rounded-lg hover:opacity-90 transition-opacity duration-300 font-semibold"
        >
          {nextButtonText}
        </button>
      </div>
    </div>
  );
};

export default OnboardingPointer;
