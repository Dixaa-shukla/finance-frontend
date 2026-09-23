import { axiosClient } from '@/api/axiosClient';
import type {
  ReceiptUploadResponse,
  StoredFileResponse,
} from '@/types/file';

export interface ProfileImageUploadResponse {
  storedFileId: number;
  profileImageUrl: string;
  uploadedAt: string;
}

/**
 * Client for /api/v1/files.
 */
export const fileService = {
  async uploadProfileImage(userId: number, file: File): Promise<ProfileImageUploadResponse> {
    const body = new FormData();
    body.append('file', file);
    const { data } = await axiosClient.post<ProfileImageUploadResponse>(`/files/profile-image/${userId}`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },

  /** Field name must be "file" — the controller reads @RequestParam("file"). */
  async uploadReceipt(userId: number, file: File): Promise<ReceiptUploadResponse> {
    const body = new FormData();
    body.append('file', file);
    const { data } = await axiosClient.post<ReceiptUploadResponse>(
      `/files/receipt/${userId}`,
      body,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  async getByUserId(userId: number): Promise<StoredFileResponse[]> {
    const { data } = await axiosClient.get<StoredFileResponse[]>(
      `/files/user/${userId}`
    );
    return data;
  },

  /**
 * Deletes the file from Cloudinary and the database.
 * It does not delete the expense that was automatically created from the file.
 */
  async remove(id: number): Promise<void> {
    await axiosClient.delete(`/files/${id}`);
  },
};
