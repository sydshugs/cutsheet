// pdfExport.tsx — Generate PDF report from analysis result using html2canvas + jsPDF
import React from "react";
import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ReportCover } from "../components/ReportCover";
import { ReportAnalysis } from "../components/ReportAnalysis";
import type { AnalysisResult } from "../services/analyzerService";

const A4_W_MM = 210;
const A4_H_MM = 297;
const PAGE_W_PX = 794; // A4 at 96dpi
const SCALE = 2;

function createOffscreenContainer(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: ${PAGE_W_PX}px;
    z-index: -1;
    pointer-events: none;
  `;
  document.body.appendChild(el);
  return el;
}

function CutsheetLogoWatermark() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        opacity: 0.25,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <polygon points="0,0 10,0 14,4 14,14 0,14" fill="#fff" opacity="0.9" />
        <line x1="9.5" y1="0.5" x2="13.5" y2="4.5" stroke="#FF4444" strokeWidth="1" />
      </svg>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "#fff",
        }}
      >
        CUTSHEET
      </span>
    </div>
  );
}

export async function exportToPdf(result: AnalysisResult): Promise<void> {
  const container = createOffscreenContainer();

  try {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // —— Page 1: Cover ——
    const coverDiv = document.createElement("div");
    container.appendChild(coverDiv);
    const coverRoot = createRoot(coverDiv);
    coverRoot.render(<ReportCover result={result} />);

    await new Promise((r) => setTimeout(r, 600));

    const coverCanvas = await html2canvas(coverDiv, {
      scale: SCALE,
      backgroundColor: "#0A0A0A",
      useCORS: true,
      logging: false,
    });
    pdf.addImage(coverCanvas.toDataURL("image/png"), "PNG", 0, 0, A4_W_MM, A4_H_MM);

    // Footer watermark on page 1
    const footerDiv = document.createElement("div");
    footerDiv.style.cssText = "display:flex;alignItems:center;gap:6px;opacity:0.25;padding:8px;background:#0A0A0A;";
    container.appendChild(footerDiv);
    const footerRoot = createRoot(footerDiv);
    footerRoot.render(<CutsheetLogoWatermark />);
    await new Promise((r) => setTimeout(r, 100));
    const footerCanvas = await html2canvas(footerDiv, { scale: 1, backgroundColor: "#0A0A0A", logging: false });
    const fw = 30;
    const fh = (footerCanvas.height / footerCanvas.width) * fw;
    pdf.addImage(footerCanvas.toDataURL("image/png"), "PNG", 10, A4_H_MM - fh - 10, fw, fh);

    coverRoot.unmount();
    footerRoot.unmount();
    container.removeChild(coverDiv);
    container.removeChild(footerDiv);

    // —— Page 2+: Full analysis ——
    const analysisDiv = document.createElement("div");
    analysisDiv.style.overflow = "visible";
    container.appendChild(analysisDiv);
    const analysisRoot = createRoot(analysisDiv);
    analysisRoot.render(<ReportAnalysis result={result} />);

    await new Promise((r) => setTimeout(r, 1200));

    const analysisCanvas = await html2canvas(analysisDiv, {
      scale: SCALE,
      backgroundColor: "#0A0A0A",
      useCORS: true,
      logging: false,
    });

    analysisRoot.unmount();
    container.removeChild(analysisDiv);

    const imgW = A4_W_MM;
    const imgH = (analysisCanvas.height / analysisCanvas.width) * imgW;
    const pageCount = Math.ceil(imgH / A4_H_MM);

    for (let i = 0; i < pageCount; i++) {
      pdf.addPage();
      const yOffset = -i * A4_H_MM;
      pdf.addImage(analysisCanvas.toDataURL("image/png"), "PNG", 0, yOffset, imgW, imgH);
      pdf.addImage(footerCanvas.toDataURL("image/png"), "PNG", 10, A4_H_MM - fh - 10, fw, fh);
    }

    const baseName = result.fileName.replace(/\.[^/.]+$/, "") || "report";
    pdf.save(`${baseName}_cutsheet_report.pdf`);
  } finally {
    if (container.parentNode) document.body.removeChild(container);
  }
}
