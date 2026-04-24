import { useState, useEffect } from 'react';
import { Globe, X } from 'lucide-react';

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' }
  ];

  const handleLanguageChange = (langCode) => {
    setCurrentLang(langCode);
    setIsOpen(false);
    
    // Set the cookie manually to persist language across reloads
    document.cookie = `googtrans=/en/${langCode}; path=/;`;
    
    // Find the hidden Google Translate select element
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = langCode;
      // Google Translate listeners require the event to bubble
      select.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // Fallback: reload the page to apply the cookie if combo isn't loaded
      window.location.reload();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && !e.target.closest('#language-switcher')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div id="language-switcher" className="fixed bottom-6 right-6 z-[100]">
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 bg-bg-card/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 w-40 flex flex-col gap-1 transform transition-all animate-in slide-in-from-bottom-2 opacity-100">
          <div className="px-3 py-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 border-b border-white/5">Select Language</div>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                currentLang === lang.code 
                  ? 'bg-green-primary/20 text-green-primary border border-green-primary/30' 
                  : 'text-text-primary hover:bg-white/10 border border-transparent'
              }`}
            >
              <span className="block font-bold">{lang.native}</span>
              <span className="text-[10px] opacity-70 block">{lang.label}</span>
            </button>
          ))}
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-green-primary text-white flex items-center justify-center shadow-[0_4px_20px_rgba(5,150,105,0.4)] hover:shadow-[0_8px_30px_rgba(5,150,105,0.6)] hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-primary/30"
        aria-label="Change Language"
      >
        {isOpen ? <X size={24} /> : <Globe size={24} />}
      </button>
      
      {/* Hidden div required for Google Translate initialization */}
      <div id="google_translate_element" className="hidden"></div>
    </div>
  );
}
