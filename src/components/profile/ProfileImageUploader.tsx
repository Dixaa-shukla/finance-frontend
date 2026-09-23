import { useRef, useState } from 'react';
import { Camera, LoaderCircle } from 'lucide-react';
import { fileService } from '@/api/fileService';
import { extractErrorMessage } from '@/api/axiosClient';
import { Avatar } from '@/components/common/Avatar';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function ProfileImageUploader({ userId, name, imageUrl, onUploaded }: { userId: number; name: string; imageUrl: string | null; onUploaded: () => Promise<void> | void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function selectFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Choose an image file (JPG, PNG, or WebP).'); return; }
    if (file.size > MAX_IMAGE_BYTES) { setError('Choose an image smaller than 5 MB.'); return; }
    setError(null); setUploading(true);
    try { const uploaded = await fileService.uploadProfileImage(userId, file); window.dispatchEvent(new CustomEvent('nova-profile-image-updated', { detail: uploaded.profileImageUrl })); await onUploaded(); }
    catch (err) { setError(extractErrorMessage(err, 'Could not upload your profile photo.')); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ''; }
  }

  return <div className="relative shrink-0"><Avatar name={name} imageUrl={imageUrl} size={64} /><input ref={inputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { void selectFile(event.target.files?.[0]); }} /><button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} aria-label="Upload profile photo" className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand-blue text-white shadow-soft disabled:opacity-60">{uploading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}</button>{error && <p role="alert" className="absolute left-0 top-full mt-2 w-48 rounded-lg bg-red-50 px-2 py-1 text-[10px] text-red-600">{error}</p>}</div>;
}
