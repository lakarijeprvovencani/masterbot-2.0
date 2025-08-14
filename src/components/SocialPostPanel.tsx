import React from 'react';

export interface SocialPost {
  title: string;
  caption: string;
  hashtags: string[];
  imageUrl: string;
  size: '1024x1024' | '1024x1792' | '1792x1024';
  cta: string;
  notes?: string;
}

interface SocialPostPanelProps {
  post: SocialPost;
  onClose: () => void;
}

const SocialPostPanel: React.FC<SocialPostPanelProps> = ({ post, onClose }) => {
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // You can add a toast notification for better UX
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = post.imageUrl;
    link.download = `${post.title.replace(/\s+/g, '_').toLowerCase()}_${post.size}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-editor-gradient border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col h-full max-h-[90vh] animate-fade-in-up">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">{post.title}</h2>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-grow overflow-hidden">
        {/* Left: Image Preview */}
        <div className="flex flex-col items-center justify-center bg-black/20 rounded-lg p-4">
          <img src={post.imageUrl} alt={post.title} className="max-w-full max-h-full object-contain rounded-md" />
          <button
            onClick={handleDownload}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-[#F56E36] to-[#d15a2c] text-white font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity"
          >
            Download Image
          </button>
        </div>

        {/* Right: Content */}
        <div className="flex flex-col space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          <div>
            <label className="text-sm font-medium text-white/80 mb-2 block">Caption</label>
            <div className="relative">
              <textarea
                value={post.caption}
                readOnly
                className="w-full h-40 bg-black/20 border border-white/15 rounded-xl p-3 text-white/90 resize-none"
              />
              <button onClick={() => handleCopy(post.caption)} className="absolute top-2 right-2 text-white/50 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-white/80 mb-2 block">Hashtags</label>
            <div className="relative">
                <div className="p-3 bg-black/20 border border-white/15 rounded-xl text-white/90">
                    {post.hashtags.join(' ')}
                </div>
              <button onClick={() => handleCopy(post.hashtags.join(' '))} className="absolute top-2 right-2 text-white/50 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            </div>
          </div>
           <div>
            <label className="text-sm font-medium text-white/80 mb-2 block">Call to Action</label>
            <p className="p-3 bg-black/20 border border-white/15 rounded-xl text-white/90">{post.cta}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialPostPanel;
