import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import { SharePage } from "./pages/SharePage.tsx";
import { SuccessPage } from "./pages/SuccessPage.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/s/:slug" element={<SharePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
