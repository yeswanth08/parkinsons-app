import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
export default function Layout() {
    return (_jsxs("div", { className: "min-h-screen bg-[#0B1220] flex flex-col", children: [_jsx(Navbar, {}), _jsx("main", { className: "flex-1 pt-20", children: _jsx(Outlet, {}) }), _jsx(Footer, {})] }));
}
