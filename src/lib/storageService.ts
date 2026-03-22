// src/lib/storageService.ts — Shared Supabase Storage upload utility
// Used by policy-check and visualize to bypass Vercel 4.5MB body limit
// (mirrors the uploadToStorage pattern in analyzerService.ts)

import { supabase } from './supabase';

/** Resize any image or video file to JPEG, upload to Supabase Storage, return signed URL. */
export async function uploadImageToStorage(
  file: File,
  maxDim = 1200,
  quality = 0.85,
): Promise<{ signedUrl: string; storagePath: string }> {
  const blob = await resizeToJpegBlob(file, maxDim, quality);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error('Not authenticated');

  const storagePath = `${session.user.id}/${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(storagePath, blob, { cacheControl: '300', upsert: false, contentType: 'image/jpeg' });
  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  // 5-minute signed URL — just needs to survive the API call
  const { data: signedData, error: urlError } = await supabase.storage
    .from('uploads')
    .createSignedUrl(storagePath, 300);
  if (urlError || !signedData?.signedUrl) throw new Error('Failed to create signed URL');

  return { signedUrl: signedData.signedUrl, storagePath };
}

/** Remove an uploaded file (best-effort, never throws). */
export async function removeFromStorage(storagePath: string): Promise<void> {
  try {
    await supabase.storage.from('uploads').remove([storagePath]);
  } catch { /* best-effort */ }
}

// ─── INTERNAL ─────────────────────────────────────────────────────────────────

function resizeToJpegBlob(file: File, maxDim: number, quality: number): Promise<Blob> {
  if (file.type.startsWith('video/')) return extractVideoFrameBlob(file, maxDim, quality);
  return resizeImageBlob(file, maxDim, quality);
}

function resizeImageBlob(file: File, maxDim: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => { if (blob) resolve(blob); else reject(new Error('Failed to encode image')); },
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => reject(new Error('Failed to read image'));
    img.src = URL.createObjectURL(file);
  });
}

function extractVideoFrameBlob(file: File, maxDim: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.preload = 'metadata';
    video.onloadeddata = () => { video.currentTime = Math.min(1, video.duration * 0.1); };
    video.onseeked = () => {
      let { videoWidth: width, videoHeight: height } = video;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(video, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => { if (blob) resolve(blob); else reject(new Error('Failed to extract frame')); },
        'image/jpeg',
        quality,
      );
    };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load video')); };
    video.src = url;
  });
}
