// useMediaDimensions.ts — Reads pixel dimensions from an uploaded file
// Works for both video and image files. Returns null until resolved.

import { useState, useEffect } from "react";

export interface MediaDimensions {
  width: number;
  height: number;
}

export function useMediaDimensions(file: File | null): MediaDimensions | null {
  const [dims, setDims] = useState<MediaDimensions | null>(null);

  useEffect(() => {
    if (!file) {
      setDims(null);
      return;
    }

    let revoked = false;
    const url = URL.createObjectURL(file);

    function cleanup() {
      if (!revoked) {
        revoked = true;
        URL.revokeObjectURL(url);
      }
    }

    if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.preload = "metadata";

      const onLoaded = () => {
        setDims({ width: video.videoWidth, height: video.videoHeight });
        cleanup();
      };
      const onError = () => {
        setDims(null);
        cleanup();
      };

      video.addEventListener("loadedmetadata", onLoaded, { once: true });
      video.addEventListener("error", onError, { once: true });
      video.src = url;

      return () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onError);
        video.src = "";
        cleanup();
      };
    }

    if (file.type.startsWith("image/")) {
      const img = new Image();

      const onLoad = () => {
        setDims({ width: img.naturalWidth, height: img.naturalHeight });
        cleanup();
      };
      const onError = () => {
        setDims(null);
        cleanup();
      };

      img.addEventListener("load", onLoad, { once: true });
      img.addEventListener("error", onError, { once: true });
      img.src = url;

      return () => {
        img.removeEventListener("load", onLoad);
        img.removeEventListener("error", onError);
        img.src = "";
        cleanup();
      };
    }

    // Unknown file type — can't detect dimensions
    setDims(null);
    cleanup();
    return undefined;
  }, [file]);

  return dims;
}
