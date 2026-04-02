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

    // Video files: seek to 1.0s (skip black intros), capture frame via canvas
    let revoked = false;
    let seekTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "auto";
    video.playsInline = true;
    // NOTE: do NOT set crossOrigin — it blocks local blob URLs
    video.src = url;

    const cleanup = () => {
      if (seekTimeoutId) clearTimeout(seekTimeoutId);
      if (!revoked) {
        URL.revokeObjectURL(url);
        revoked = true;
      }
      video.removeAttribute("src");
      video.load();
    };

    const captureFrame = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setThumbnailDataUrl(canvas.toDataURL("image/jpeg", 0.8));
        }
      } catch (err) {
        console.warn('[useThumbnail] Canvas capture failed:', err);
      } finally {
        cleanup();
      }
    };

    const onSeeked = () => {
      if (seekTimeoutId) clearTimeout(seekTimeoutId);
      captureFrame();
    };

    const onLoaded = () => {
      video.currentTime = 1.0;
      // Timeout fallback: if seeked hasn't fired in 3s, try again at 0s
      seekTimeoutId = setTimeout(() => {
        if (!revoked) {
          console.warn('[useThumbnail] seeked timeout — retrying at 0s');
          video.currentTime = 0;
        }
      }, 3000);
    };

    const onError = () => {
      console.warn('[useThumbnail] Video error event');
      cleanup();
    };

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
