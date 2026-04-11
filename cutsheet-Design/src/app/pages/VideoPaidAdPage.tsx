import React, { useState } from "react";
import UploadState from "../components/UploadState";
import AnalysisLoadingState from "../components/AnalysisLoadingState";
import VideoResultsScreen from "../components/VideoResultsScreen";

type View = 'upload' | 'loading' | 'results';

export default function VideoPaidAdPage() {
  const [view, setView] = useState<View>('upload');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] relative font-['Geist',sans-serif]">
      <div className="flex-1 overflow-y-auto relative">
        {view === 'upload' && (
          <UploadState onFileSelect={() => setView('loading')} />
        )}

        {view === 'loading' && (
          <AnalysisLoadingState onComplete={() => setView('results')} />
        )}

        {view === 'results' && (
          <div className="w-full h-full">
            <VideoResultsScreen />
          </div>
        )}
      </div>
    </div>
  );
}
