import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logoSrc from '../assets/images/logobotprovidan.png'

const Icon: React.FC<{ name: 'home' | 'book' | 'settings'; className?: string }> = ({ name, className }) => {
  const common = 'w-5 h-5';
  switch (name) {
    case 'home':
      return (
        <svg className={`${common} ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5.5 9.5V20a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1V9.5" />
        </svg>
      )
    case 'book':
      return (
        <svg className={`${common} ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z" />
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19" />
        </svg>
      )
    case 'settings':
      return (
        <svg className={`${common} ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a1.2 1.2 0 0 0 .24 1.32l.03.03a1.5 1.5 0 0 1-2.12 2.12l-.03-.03a1.2 1.2 0 0 0-1.32-.24 1.2 1.2 0 0 0-.73 1.1V20a1.5 1.5 0 0 1-3 0v-.03a1.2 1.2 0 0 0-.73-1.1 1.2 1.2 0 0 0-1.32.24l-.03.03a1.5 1.5 0 0 1-2.12-2.12l.03-.03a1.2 1.2 0 0 0 .24-1.32 1.2 1.2 0 0 0-1.1-.73H4a1.5 1.5 0 0 1 0-3h.03a1.2 1.2 0 0 0 1.1-.73 1.2 1.2 0 0 0-.24-1.32l-.03-.03a1.5 1.5 0 1 1 2.12-2.12l.03.03a1.2 1.2 0 0 0 1.32.24h0A1.2 1.2 0 0 0 9.5 6.5V6a1.5 1.5 0 0 1 3 0v.03a1.2 1.2 0 0 0 .73 1.1 1.2 1.2 0 0 0 1.32-.24l.03-.03a1.5 1.5 0 0 1 2.12 2.12l-.03.03a1.2 1.2 0 0 0-.24 1.32v0c.17.46.61.77 1.1.77H20a1.5 1.5 0 0 1 0 3h-.03c-.5 0-.93.31-1.1.77Z" />
        </svg>
      )
  }
}

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: 'home' as const },
  { label: 'Biznis profil', path: '/business-profile', icon: 'book' as const },
]

const Sidebar: React.FC = () => {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const iconWrap = (active: boolean) =>
    `w-10 h-10 flex items-center justify-center rounded-full border ${
      active ? 'bg-[#F56E36]/30 border-[#F56E36]/50 text-white' : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/15'
    }`

  return (
    <div className={`fixed left-0 top-0 h-screen z-30 transition-all duration-300 ${open ? 'w-64' : 'w-16'}`}>
      <div className="h-full bg-gradient-to-b from-white/10 via-white/5 to-white/10 backdrop-blur-xl border-r border-white/20 shadow-2xl flex flex-col">
        {/* Header */}
        <div className={`flex items-center ${open ? 'justify-between' : 'justify-end'} px-3 py-3 border-b border-white/10`}>
          {open && (
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <img src={logoSrc} alt="Masterbot" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-white font-semibold">Masterbot</span>
            </div>
          )}
          <button
            aria-label="Toggle sidebar"
            onClick={() => setOpen(v => !v)}
            className="w-8 h-8 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10"
            title={open ? 'Sakrij' : 'Prikaži'}
          >
            {open ? '⟨' : '⟩'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-2 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                aria-label={item.label}
                className={`mx-2 flex items-center rounded-xl px-2 py-2 text-sm transition-colors ${
                  active
                    ? 'text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <div className={iconWrap(active)}>
                  <Icon name={item.icon} />
                </div>
                <span className={`truncate ml-2 ${open ? 'block' : 'hidden'}`}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer - Settings */}
        <div className="p-2 border-t border-white/10">
          <Link
            to="/settings"
            title="Podesavanja"
            className={`mx-2 flex items-center ${open ? 'justify-start' : 'justify-center'} rounded-xl px-2 py-2 text-sm text-white/70 hover:text-white`}
          >
            <div className={iconWrap(location.pathname === '/settings')}>
              <Icon name="settings" />
            </div>
            <span className={`ml-2 ${open ? 'block' : 'hidden'}`}>Podesavanja</span>
          </Link>
          <div className="text-center text-[11px] text-white/40 mt-2">v1.0</div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
