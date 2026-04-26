import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Home, Mic, FileText, Mail, Menu, X } from 'lucide-react';
const navLinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Test', href: '/test', icon: Mic },
    { label: 'Report', href: '/report', icon: FileText },
    { label: 'Contact', href: '/contact', icon: Mail },
];
export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const isActive = (href) => location.pathname === href;
    return (_jsxs("header", { className: "fixed top-0 left-0 right-0 z-50 border-b border-[#1F2937]/30 bg-[#0B1220]/95 backdrop-blur-xl", children: [_jsxs("nav", { className: "mx-auto flex max-w-7xl items-center justify-between px-6 py-4", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-2.5 hover:opacity-80 transition-opacity", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#06B6D4]", children: _jsx(Activity, { className: "h-5 w-5 text-[#0B1220]", strokeWidth: 2.5 }) }), _jsx("div", { children: _jsx("span", { className: "text-xl font-bold tracking-tight text-[#E5E7EB]", style: { fontFamily: 'var(--font-heading)' }, children: "NeuroVox" }) })] }), _jsx("ul", { className: "hidden items-center gap-1 md:flex", children: navLinks.map((link) => {
                            const Icon = link.icon;
                            const active = isActive(link.href);
                            return (_jsx("li", { children: _jsxs(Link, { to: link.href, className: `flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${active
                                        ? "bg-[#22D3EE]/10 text-[#22D3EE]"
                                        : "text-[#9CA3AF] hover:bg-[#1F2937]/50 hover:text-[#E5E7EB]"}`, children: [_jsx(Icon, { className: "h-4 w-4" }), link.label] }) }, link.label));
                        }) }), _jsx("button", { onClick: () => setMobileOpen(!mobileOpen), className: "flex h-10 w-10 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#1F2937]/50 md:hidden", "aria-label": mobileOpen ? "Close menu" : "Open menu", children: mobileOpen ? _jsx(X, { className: "h-5 w-5" }) : _jsx(Menu, { className: "h-5 w-5" }) })] }), mobileOpen && (_jsx("div", { className: "border-t border-[#1F2937]/30 bg-[#0B1220]/95 backdrop-blur-xl md:hidden", children: _jsx("ul", { className: "flex flex-col gap-1 px-6 py-4", children: navLinks.map((link) => {
                        const Icon = link.icon;
                        const active = isActive(link.href);
                        return (_jsx("li", { children: _jsxs(Link, { to: link.href, onClick: () => setMobileOpen(false), className: `flex items-center gap-3 rounded-lg px-4 py-3 text-base font-semibold transition-all ${active
                                    ? "bg-[#22D3EE]/10 text-[#22D3EE]"
                                    : "text-[#9CA3AF] hover:bg-[#1F2937]/50 hover:text-[#E5E7EB]"}`, children: [_jsx(Icon, { className: "h-5 w-5" }), link.label] }) }, link.label));
                    }) }) }))] }));
}
