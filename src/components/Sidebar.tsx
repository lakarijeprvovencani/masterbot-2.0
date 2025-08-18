import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logoSrc from '../assets/images/logobotprovidan.png'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: 'home' as const },
  { label: 'Biznis profil', path: '/business-profile', icon: 'book' as const },
]

const Icon: React.FC<{ name: 'home' | 'book' | 'settings' | 'toggle'; className?: string, open?: boolean }> = ({ name, className, open }) => {
  const common = 'w-6 h-6';
  switch (name) {
    case 'home':
      return <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    case 'book':
      return <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    case 'settings':
      return <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    case 'toggle':
      return <svg className={`w-6 h-6 transition-transform duration-300 ${open ? '' : 'transform rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
  }
}

const Sidebar: React.FC = () => {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <aside className={`fixed left-0 top-0 h-screen z-30 transition-all duration-300 ease-in-out ${open ? 'w-64' : 'w-20'}`}>
      <div className="h-full bg-gradient-to-b from-[#0D1240] to-[#040A3E] border-r border-white/10 shadow-2xl flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className={`flex items-center p-4 border-b border-white/10 ${open ? 'justify-between' : 'justify-center'}`}>
            {open && (
              <div className="flex items-center space-x-3">
                <img src={logoSrc} alt="Masterbot" className="w-9 h-9" />
                <span className="text-white font-bold text-lg">Masterbot</span>
              </div>
            )}
            <button
              onClick={() => setOpen(v => !v)}
              className="w-10 h-10 rounded-full text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              title={open ? 'Sakrij' : 'Prikaži'}
            >
              <Icon name="toggle" open={open} />
            </button>
          </div>

          {/* Nav */}
          <nav className="mt-6 space-y-2">
            {navItems.map(item => {
              const active = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={open ? '' : item.label}
                  className={`flex items-center py-3 mx-3 rounded-lg transition-all duration-200 group ${
                    active
                      ? 'bg-gradient-to-r from-[#F56E36]/20 to-transparent text-white shadow-inner'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className={`absolute left-0 w-1 h-6 bg-[#F56E36] rounded-r-full transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}></div>
                  <div className={`px-3 transition-all duration-300 ${active ? 'text-[#F56E36]' : ''}`}>
                    <Icon name={item.icon} />
                  </div>
                  <span className={`transition-opacity duration-200 whitespace-nowrap ${open ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
                </Link>
              )
            })}
          </nav>
          <div className="mt-4 mx-3">
            <a
              href="/feedback"
              className="flex items-center py-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <div className="px-3 text-[#F56E36]">💬</div>
              <span className={`${open ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>Predlozi i komentari</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10">
          <Link
            to="/settings"
            title={open ? '' : "Podesavanja"}
            className="flex items-center py-3 mx-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors group"
          >
            <div className={`px-3 ${location.pathname === '/settings' ? 'text-[#F56E36]' : ''}`}>
              <Icon name="settings" />
            </div>
            <span className={`transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}>Podesavanja</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
