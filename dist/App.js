import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import HomePage from './pages/HomePage';
import TestPage from './pages/TestPage';
import ReportPage from './pages/ReportPage';
import ContactPage from './pages/ContactPage';
function App() {
    return (_jsx(Router, { children: _jsx(Routes, { children: _jsxs(Route, { element: _jsx(Layout, {}), children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/test", element: _jsx(TestPage, {}) }), _jsx(Route, { path: "/report", element: _jsx(ReportPage, {}) }), _jsx(Route, { path: "/contact", element: _jsx(ContactPage, {}) })] }) }) }));
}
export default App;
