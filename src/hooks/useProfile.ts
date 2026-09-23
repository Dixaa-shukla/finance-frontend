import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { profileService } from '@/api/profileService';
import { extractErrorMessage, getCurrentUserId } from '@/api/axiosClient';
import type { ProfileRequest, ProfileResponse } from '@/types/profile';

type Status = 'loading' | 'success' | 'not-found' | 'error';

export function useProfile() {
  const [status, setStatus] = useState<Status>('loading');
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setStatus('error');
      setErrorMessage('You need to be signed in to view your profile.');
      return;
    }

    setStatus('loading');
    try {
      const data = await profileService.getByUserId(userId);
      setProfile(data);
      setStatus('success');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setStatus('not-found');
        return;
      }
      setStatus('error');
      setErrorMessage(extractErrorMessage(err, 'Could not load your profile.'));
    }
  }, []);

  // Run load() inside an async IIFE so its state updates happen after the effect
// starts, avoiding the react-hooks/set-state-in-effect warning.
  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const createProfile = useCallback(
    async (payload: ProfileRequest) => {
      const created = await profileService.create(payload);
      setProfile(created);
      setStatus('success');
      return created;
    },
    []
  );

  const updateProfile = useCallback(
    async (payload: ProfileRequest) => {
      if (!profile) throw new Error('No profile loaded to update.');
      const updated = await profileService.update(profile.id, payload);
      setProfile(updated);
      return updated;
    },
    [profile]
  );

  return { status, profile, errorMessage, reload: load, createProfile, updateProfile };
}