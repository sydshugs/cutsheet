import React, { useState } from "react";
import OrganicUploadState from "../components/OrganicUploadState";
import OrganicLoadingState from "../components/OrganicLoadingState";
import OrganicVideoResultsScreen from "../components/OrganicVideoResultsScreen";

type View = 'upload' | 'loading' | 'results';

export default function OrganicVideoPage() {
  const [view, setView] = useState<View>('upload');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] relative font-['Geist',sans-serif]">
      <div className="flex-1 overflow-y-auto relative">
        {view === 'upload' && (
          <OrganicUploadState onFileSelect={() => setView('loading')} />
        )}

        {view === 'loading' && (
          <OrganicLoadingState onComplete={() => setView('results')} />
        )}

        {view === 'results' && (
          <div className="w-full h-full">
            <OrganicVideoResultsScreen />
          </div>
        )}
      </div>
    </div>
  );
}
