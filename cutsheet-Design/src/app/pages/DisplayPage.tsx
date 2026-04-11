import React, { useState } from "react";
import DisplayUploadState from "../components/DisplayUploadState";
import DisplayLoadingState from "../components/DisplayLoadingState";
import DisplayResultsScreen from "../components/DisplayResultsScreen";

type View = 'upload' | 'loading' | 'results';

export default function DisplayPage() {
  const [view, setView] = useState<View>('upload');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] relative font-['Geist',sans-serif]">
      <div className="flex-1 overflow-y-auto relative">
        {view === 'upload' && (
          <DisplayUploadState onFileSelect={() => setView('loading')} />
        )}

        {view === 'loading' && (
          <DisplayLoadingState onComplete={() => setView('results')} />
        )}

        {view === 'results' && (
          <div className="w-full h-full">
            <DisplayResultsScreen />
          </div>
        )}
      </div>
    </div>
  );
}
