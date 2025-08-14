import React, { useState, useEffect } from 'react';

interface EmailEditorPanelProps {
  initialSubject: string;
  initialBody: string;
  onClose: () => void;
}

const EmailEditorPanel: React.FC<EmailEditorPanelProps> = ({ initialSubject, initialBody, onClose }) => {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);

  useEffect(() => {
    setSubject(initialSubject);
    setBody(initialBody);
  }, [initialSubject, initialBody]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Add a visual indicator for copy success if desired
  };

  return (
    <div className="bg-editor-gradient border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col h-full max-h-[90vh] animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Email Editor</h2>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-grow flex flex-col space-y-6 overflow-hidden">
        {/* Subject */}
        <div className="flex flex-col">
          <label htmlFor="subject" className="text-sm font-medium text-white/80 mb-2 ml-1">Subject</label>
          <div className="relative">
            <input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-black/20 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#F56E36]/80 transition-all focus:shadow-[0_0_15px_rgba(245,110,54,0.5)]"
            />
            <button onClick={() => handleCopy(subject)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col flex-grow overflow-hidden">
          <label htmlFor="body" className="text-sm font-medium text-white/80 mb-2 ml-1">Body</label>
          <div className="relative flex-grow">
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-full bg-black/20 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/40 resize-none focus:outline-none focus:ring-2 focus:ring-[#F56E36]/80 transition-all scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent focus:shadow-[0_0_15px_rgba(245,110,54,0.5)]"
            />
            <button onClick={() => handleCopy(body)} className="absolute right-3 top-3 text-white/50 hover:text-white transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailEditorPanel;
