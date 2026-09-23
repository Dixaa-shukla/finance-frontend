/**
 * Module 17 — File & Document Management (/api/v1/files).
 */
export type StoredFileType = 'RECEIPT' | 'PROFILE_IMAGE';

export const STORED_FILE_TYPE_LABELS: Record<StoredFileType, string> = {
  RECEIPT: 'Receipt',
  PROFILE_IMAGE: 'Profile Image',
};

/** GET /files/user/{userId} — receipts and profile images, newest first. */
export interface StoredFileResponse {
  id: number;
  fileType: StoredFileType;
  originalFilename: string | null;
  storedUrl: string;
  fileSizeBytes: number | null;
  contentType: string | null;
  /** "EXPENSE" when a receipt auto-created one, otherwise null. */
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  uploadedAt: string;
}

/**
 * POST /files/receipt/{userId}.
 */
export interface ReceiptUploadResponse {
  storedFileId: number;
  receiptUrl: string;
  /** Raw OCR text — returned even when extraction failed, so it can be read. */
  ocrRawText: string | null;
  extractedMerchant: string | null;
  extractedAmount: number | null;
  extractedDate: string | null;
  extractedCategory: string | null;
  /** `private boolean autoSaved` — no `is` prefix, so the wire name matches. */
  autoSaved: boolean;
  /** Set only when autoSaved is true. */
  createdExpenseId: number | null;
}

/** FileStorageServiceImpl rejects anything else before it reaches Cloudinary. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Same two rules as validateImage(), so the user is told before the round trip. */
export function checkUploadFile(file: File): string | null {
  if (file.size === 0) return 'That file is empty.';
  if (file.size > MAX_UPLOAD_BYTES) return 'The file must not exceed 5 MB.';
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type.toLowerCase())) {
    return 'Only JPEG, PNG and WebP images are allowed.';
  }
  return null;
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
