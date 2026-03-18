import { StrictMode, lazy, Suspense, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import LandingPage from "./pages/LandingPage.tsx";
import PrivacyPage from "./pages/PrivacyPage.tsx";
import TermsPage from "./pages/TermsPage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import { SharePage } from "./pages/SharePage.tsx";
import { SuccessPage } from "./pages/SuccessPage.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Welcome from "./pages/Welcome.tsx";
import Upgrade from "./pages/Upgrade.tsx";
import CheckoutSuccess from "./pages/CheckoutSuccess.tsx";
import CheckoutCancel from "./pages/CheckoutCancel.tsx";
import Changelog from "./pages/Changelog.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { Settings } from "./pages/Settings.tsx";
import PaidAdAnalyzer from "./pages/app/PaidAdAnalyzer.tsx";
import OrganicAnalyzer from "./pages/app/OrganicAnalyzer.tsx";
import ABTestPage from "./pages/app/ABTestPage.tsx";
import BatchPage from "./pages/app/BatchPage.tsx";
import SwipeFilePage from "./pages/app/SwipeFilePage.tsx";
import ComingSoon from "./components/ComingSoon.tsx";
import "./index.css";
import { Monitor, Swords } from "lucide-react";

const DemoPage = lazy(() => import("./pages/DemoPage.tsx"));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/s/:slug" element={<SharePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route path="/demo" element={<Suspense fallback={null}><DemoPage /></Suspense>} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Protected /app/* layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/app" element={<Navigate to="/app/paid" replace />} />
            <Route path="/app/paid" element={<PaidAdAnalyzer />} />
            <Route path="/app/organic" element={<OrganicAnalyzer />} />
            <Route
              path="/app/display"
              element={
                <ComingSoon
                  title="Display & Banner Analysis"
                  description="Score Google Display and affiliate banner ads. See how your creative competes in real website contexts."
                  icon={Monitor}
                />
              }
            />
            <Route path="/app/ab-test" element={<ABTestPage />} />
            <Route
              path="/app/competitor"
              element={
                <ComingSoon
                  title="Competitor Analysis"
                  description="Upload your ad alongside a competitor's. Get a scored gap analysis and action plan to outperform them."
                  icon={Swords}
                />
              }
            />
            <Route path="/app/batch" element={<BatchPage />} />
            <Route path="/app/swipe-file" element={<SwipeFilePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
