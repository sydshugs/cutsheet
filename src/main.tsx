import { StrictMode, lazy, Suspense, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import "./index.css";

// ── Critical path (landing + auth) — eagerly loaded ──────────────────────────
import LandingPage from "./pages/LandingPage.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";

// ── Lazy-loaded routes — split into separate chunks ──────────────────────────
const AppLayout = lazy(() => import("./components/AppLayout"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage.tsx"));
const TermsPage = lazy(() => import("./pages/TermsPage.tsx"));
const SharePage = lazy(() => import("./pages/SharePage.tsx").then(m => ({ default: m.SharePage })));
const SuccessPage = lazy(() => import("./pages/SuccessPage.tsx").then(m => ({ default: m.SuccessPage })));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Welcome = lazy(() => import("./pages/Welcome.tsx"));
const Upgrade = lazy(() => import("./pages/Upgrade.tsx"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess.tsx"));
const CheckoutCancel = lazy(() => import("./pages/CheckoutCancel.tsx"));
const Changelog = lazy(() => import("./pages/Changelog.tsx"));
const DemoPage = lazy(() => import("./pages/DemoPage.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx").then(m => ({ default: m.Settings })));

// ── App pages (heaviest — analyzer bundles) ──────────────────────────────────
const PaidAdAnalyzer = lazy(() => import("./pages/app/PaidAdAnalyzer.tsx"));
const OrganicAnalyzer = lazy(() => import("./pages/app/OrganicAnalyzer.tsx"));
const DisplayAnalyzer = lazy(() => import("./pages/app/DisplayAnalyzer.tsx"));
const ABTestPage = lazy(() => import("./pages/app/ABTestPage.tsx"));
const BatchPage = lazy(() => import("./pages/app/BatchPage.tsx"));
const SwipeFilePage = lazy(() => import("./pages/app/SwipeFilePage.tsx"));
const CompetitorAnalyzer = lazy(() => import("./pages/app/CompetitorAnalyzer.tsx"));
const Deconstructor = lazy(() => import("./pages/app/Deconstructor.tsx"));
const PolicyCheck = lazy(() => import("./pages/app/PolicyCheck.tsx"));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

// Minimal loading fallback for lazy routes
function RouteLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#09090b" }}>
      <div style={{ width: 24, height: 24, border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Suspense fallback={<RouteLoader />}>
        <Routes>
          {/* Public — eagerly loaded */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Public — lazy loaded */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/s/:slug" element={<SharePage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Protected /app/* layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/app" element={<Navigate to="/app/paid" replace />} />
            <Route path="/app/paid" element={<PaidAdAnalyzer />} />
            <Route path="/app/organic" element={<OrganicAnalyzer />} />
            <Route path="/app/display" element={<DisplayAnalyzer />} />
            <Route path="/app/ab-test" element={<ABTestPage />} />
            <Route path="/app/competitor" element={<CompetitorAnalyzer />} />
            <Route path="/app/batch" element={<BatchPage />} />
            <Route path="/app/swipe-file" element={<SwipeFilePage />} />
            <Route path="/app/deconstructor" element={<Deconstructor />} />
            <Route path="/app/policy-check" element={<PolicyCheck />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
