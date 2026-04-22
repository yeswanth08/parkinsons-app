import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Activity, Home, Mic, FileText, Mail, Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Test', href: '/test', icon: Mic },
  { label: 'Report', href: '/report', icon: FileText },
  { label: 'Contact', href: '/contact', icon: Mail },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const isActive = (href: string) => location.pathname === href

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#1F2937]/30 bg-[#0B1220]/95 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#06B6D4]">
            <Activity className="h-5 w-5 text-[#0B1220]" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#E5E7EB]" style={{ fontFamily: 'var(--font-heading)' }}>
              NeuroVox
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href)
            return (
              <li key={link.label}>
                <Link
                  to={link.href}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                    active
                      ? "bg-[#22D3EE]/10 text-[#22D3EE]"
                      : "text-[#9CA3AF] hover:bg-[#1F2937]/50 hover:text-[#E5E7EB]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#1F2937]/50 md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-[#1F2937]/30 bg-[#0B1220]/95 backdrop-blur-xl md:hidden">
          <ul className="flex flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-semibold transition-all ${
                      active
                        ? "bg-[#22D3EE]/10 text-[#22D3EE]"
                        : "text-[#9CA3AF] hover:bg-[#1F2937]/50 hover:text-[#E5E7EB]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </header>
  )
}
