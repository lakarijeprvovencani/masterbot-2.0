import React, { useEffect, useState } from 'react';
import ImageEditor from './ImageEditor';

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
  const [isEditing, setIsEditing] = useState(false);
  // Lokalna, kontrolisana polja – resetuju se kada stigne nov "post"
  const [captionValue, setCaptionValue] = useState(post.caption);
  const [hashtagsText, setHashtagsText] = useState(post.hashtags.join(' '));
  const [ctaValue, setCtaValue] = useState(post.cta);

  useEffect(() => {
    setCaptionValue(post.caption);
    setHashtagsText(post.hashtags.join(' '));
    setCtaValue(post.cta);
  }, [post.imageUrl, post.title]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // You can add a toast notification for better UX
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(post.imageUrl)}`);
      if (!response.ok) {
        throw new Error('Failed to proxy image for download');
      }
      const { imageSrc } = await response.json();
      
      const blobResponse = await fetch(imageSrc);
      const blob = await blobResponse.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${post.title.replace(/\s+/g, '_').toLowerCase()}_${post.size}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  const handlePublish = async () => {
    // Placeholder za buduću direktnu objavu na mreže
    // Ovde ćemo kasnije dodati integracije (Meta API, TikTok, X...)
    alert('Objavljivanje će uskoro biti dostupno direktno iz aplikacije.');
  };

  if (isEditing) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-lg animate-fade-in-up">
        <div className="bg-editor-gradient p-6 pt-14 pr-14 rounded-2xl shadow-2xl relative w-11/12 h-5/6">
           <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 z-10 hover:bg-black/80 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <ImageEditor
            imageUrl={post.imageUrl}
            contextText={`Naslov: ${post.title}\nCaption: ${post.caption}\nHashtags: ${post.hashtags.join(' ')}\nCTA: ${post.cta}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-editor-gradient border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col h-full max-h-[90vh] animate-fade-in-up">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">{post.title}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => handleCopy(`${captionValue}\n\n${hashtagsText}\n${ctaValue}`)} className="px-3 py-1.5 text-xs rounded-lg bg-white/10 border border-white/15 text-white/80 hover:text-white hover:bg-white/15">Kopiraj sve</button>
          <button onClick={onClose} className="text-white/60 hover:text-white"> 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-grow grid grid-cols-2 gap-6 overflow-hidden">
        {/* Left: Image Preview & Edit Button */}
        <div className="flex flex-col space-y-4">
          <div className="relative group flex-grow">
            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-contain rounded-lg shadow-lg" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <button onClick={() => setIsEditing(true)} className="bg-gradient-to-br from-[#F56E36] to-[#d15a2c] text-white font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
                <span>Uredi Sliku</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Content */}
        <div className="flex flex-col h-full">
          <div className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white/80">Caption</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleCopy(post.caption)} className="px-2 py-1 text-[11px] rounded-md bg-white/10 border border-white/15 text-white/70 hover:text-white">Copy</button>
                  <span className="text-white/30 text-[11px]">autosave</span>
                </div>
              </div>
              <textarea
                value={captionValue}
                onChange={(e) => setCaptionValue(e.target.value)}
                onBlur={() => (post.caption = captionValue)}
                className="w-full h-40 bg-black/30 border border-white/10 rounded-lg p-3 text-white/90 resize-none focus:outline-none focus:ring-2 focus:ring-[#F56E36]/60"
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white/80">Hashtags</label>
                <button onClick={() => handleCopy(hashtagsText)} className="px-2 py-1 text-[11px] rounded-md bg-white/10 border border-white/15 text-white/70 hover:text-white">Copy</button>
              </div>
              <textarea
                value={hashtagsText}
                onChange={(e) => setHashtagsText(e.target.value)}
                onBlur={() => (post.hashtags = hashtagsText.split(/\s+/).filter(Boolean))}
                className="w-full h-24 bg-black/30 border border-white/10 rounded-lg p-3 text-white/90 resize-none focus:outline-none focus:ring-2 focus:ring-[#F56E36]/60"
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white/80">Call to Action</label>
                <span className="text-white/30 text-[11px]">autosave</span>
              </div>
              <input
                value={ctaValue}
                onChange={(e) => setCtaValue(e.target.value)}
                onBlur={() => (post.cta = ctaValue)}
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white/90 focus:outline-none focus:ring-2 focus:ring-[#F56E36]/60"
              />
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={handleDownload}
              className="w-full px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg text-sm transition-colors border border-white/15"
            >
              Preuzmi sliku
            </button>
            <button
              onClick={handlePublish}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#F56E36] to-[#5a67d8] text-white font-bold rounded-lg text-sm shadow-lg hover:opacity-95 transition-opacity"
            >
              Objavi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialPostPanel;
