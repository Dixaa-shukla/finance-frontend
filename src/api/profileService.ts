import { axiosClient } from '@/api/axiosClient';
import type { ProfileRequest, ProfileResponse } from '@/types/profile';

export const profileService = {
  /** GET /api/v1/profiles/user/{userId} */
  getByUserId: async (userId: number): Promise<ProfileResponse> => {
    const { data } = await axiosClient.get<ProfileResponse>(
      `/profiles/user/${userId}`
    );
    return data;
  },

  /** GET /api/v1/profiles/{id} */
  getById: async (id: number): Promise<ProfileResponse> => {
    const { data } = await axiosClient.get<ProfileResponse>(`/profiles/${id}`);
    return data;
  },

  /** POST /api/v1/profiles */
  create: async (payload: ProfileRequest): Promise<ProfileResponse> => {
    const { data } = await axiosClient.post<ProfileResponse>(
      '/profiles',
      payload
    );
    return data;
  },

  /** PUT /api/v1/profiles/{id} */
  update: async (
    id: number,
    payload: ProfileRequest
  ): Promise<ProfileResponse> => {
    const { data } = await axiosClient.put<ProfileResponse>(
      `/profiles/${id}`,
      payload
    );
    return data;
  },

  /** DELETE /api/v1/profiles/{id} */
  remove: async (id: number): Promise<void> => {
    await axiosClient.delete(`/profiles/${id}`);
  },

};