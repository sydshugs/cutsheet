// pdfExport.tsx — Generate PDF report from analysis result using html2canvas + jsPDF
import React from "react";
import { createRoot } from "react-dom/client";
// html2canvas and jspdf are dynamically imported to avoid 622kB+ in the main bundle
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

export async function exportToPdf(result: AnalysisResult): Promise<void> {
  const container = createOffscreenContainer();

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
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

    coverRoot.unmount();
    container.removeChild(coverDiv);

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

    // Trim trailing white page: skip last page if it has < 5% content
    const lastPageRemaining = imgH - (pageCount - 1) * A4_H_MM;
    const effectivePages = lastPageRemaining < A4_H_MM * 0.05 ? pageCount - 1 : pageCount;

    const analysisDataUrl = analysisCanvas.toDataURL("image/png");

    for (let i = 0; i < effectivePages; i++) {
      pdf.addPage();
      const yOffset = -i * A4_H_MM;
      pdf.addImage(analysisDataUrl, "PNG", 0, yOffset, imgW, imgH);
    }

    const baseName = result.fileName.replace(/\.[^/.]+$/, "") || "report";
    pdf.save(`${baseName}_cutsheet_report.pdf`);
  } finally {
    if (container.parentNode) document.body.removeChild(container);
  }
}
