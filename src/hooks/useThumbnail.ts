import { useState, useEffect } from "react";

/** Capture a poster frame from a video file via canvas, or use objectURL for images. */
export function useThumbnail(file: File | null): string | null {
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);

  useEffect(() => {
    setThumbnailDataUrl(null);
    if (!file) return;

    // Image files: use object URL directly — no canvas needed
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setThumbnailDataUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    // Video files: seek to 0.1s, capture frame via canvas
    let revoked = false;
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "auto";
    video.playsInline = true;
    video.src = url;

    const cleanup = () => {
      if (!revoked) {
        URL.revokeObjectURL(url);
        revoked = true;
      }
      video.removeAttribute("src");
      video.load();
    };

    const onSeeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setThumbnailDataUrl(canvas.toDataURL("image/jpeg", 0.8));
        }
      } catch {
        // Silently fall back to gray placeholder
      } finally {
        cleanup();
      }
    };

    const onLoaded = () => {
      video.currentTime = 0.1;
    };

    const onError = () => cleanup();

    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      cleanup();
    };
  }, [file]);

  return thumbnailDataUrl;
}
