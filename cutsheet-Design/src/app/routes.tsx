import { createBrowserRouter, Navigate } from "react-router";
import AppLayout from "./components/AppLayout";
import PaidAdPage from "./pages/PaidAdPage";
import VideoPaidAdPage from "./pages/VideoPaidAdPage";
import OrganicStaticPage from "./pages/OrganicStaticPage";
import OrganicVideoPage from "./pages/OrganicVideoPage";
import DisplayPage from "./pages/DisplayPage";
import AdBreakdownPage from "./pages/AdBreakdownPage";
import ABTestPage from "./pages/ABTestPage";
import CompetitorPage from "./pages/CompetitorPage";
import CompetitorWinningPage from "./pages/CompetitorWinningPage";
import RankPage from "./pages/RankPage";
import EmptyStatePage from "./pages/EmptyStatePage";
import SettingsPage from "./pages/SettingsPage";
import UpgradePage from "./pages/UpgradePage";

import SavedAdsPage from "./pages/SavedAdsPage";
import SavedAdDetailPage from "./pages/SavedAdDetailPage";
import LandingPage from "./pages/LandingPage";

import { OnboardingFlow } from "./components/OnboardingFlow";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/onboarding" replace />
  },
  {
    path: "/onboarding",
    element: <OnboardingFlow />
  },
  {
    path: "/landing",
    element: <LandingPage />
  },
  {
    path: "/app",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/app/paid-ad" replace /> },
      { path: "paid-ad", element: <PaidAdPage /> },
      { path: "paid-ad/video", element: <VideoPaidAdPage /> },
      { path: "organic", element: <OrganicStaticPage /> },
      { path: "organic/video", element: <OrganicVideoPage /> },
      { path: "display", element: <DisplayPage /> },
      { path: "ad-breakdown", element: <AdBreakdownPage /> },
      { path: "a-b-test", element: <ABTestPage /> },
      { path: "competitor", element: <CompetitorPage /> },
      { path: "competitor/winning", element: <CompetitorWinningPage /> },
      { path: "rank", element: <RankPage /> },
      { path: "saved", element: <SavedAdsPage /> },
      { path: "saved/:id", element: <SavedAdDetailPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "upgrade", element: <UpgradePage /> },
    ]
  }
]);