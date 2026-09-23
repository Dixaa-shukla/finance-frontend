import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ProfileSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ProfileViewCard } from '@/components/profile/ProfileViewCard';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import { Toast, type ToastState } from '@/components/common/Toast';
import { useProfile } from '@/hooks/useProfile';
import { getCurrentUserId, extractErrorMessage } from '@/api/axiosClient';
import type { ProfileRequest } from '@/types/profile';

const BLANK_FORM: Omit<ProfileRequest, 'userId'> = {
  fullName: '',
  phoneNumber: null,
  dateOfBirth: null,
  gender: null,
  monthlySalary: null,
  preferredCurrency: 'INR',
  primaryFinancialGoal: null,
};

export default function ProfilePage() {
  const { status, profile, errorMessage, reload, createProfile, updateProfile } =
    useProfile();
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view');
  const [toast, setToast] = useState<ToastState | null>(null);

  const userId = getCurrentUserId();

  async function handleUpdate(payload: ProfileRequest) {
    try {
      await updateProfile(payload);
      setMode('view');
      setToast({ type: 'success', message: 'Profile updated successfully' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not update your profile.'),
      });
      throw err;
    }
  }

  async function handleCreate(payload: ProfileRequest) {
    try {
      await createProfile(payload);
      setMode('view');
      setToast({ type: 'success', message: 'Profile created successfully' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not create your profile.'),
      });
      throw err;
    }
  }

  return (
    <>
      <div className="space-y-6">
        <Header title="Profile" subtitle="Manage your personal information and profile preferences" />

        {status === 'loading' && <ProfileSkeleton />}

        {status === 'error' && (
          <EmptyState
            variant="error"
            title="Something went wrong"
            description={errorMessage ?? 'Please try again in a moment.'}
            actionLabel="Retry"
            onAction={reload}
          />
        )}

        {status === 'not-found' && mode !== 'create' && (
          <EmptyState
            title="No profile yet"
            description="Set up your finance profile to personalize budgets, goals, and AI insights."
            actionLabel="Create Profile"
            onAction={() => setMode('create')}
          />
        )}

        {status === 'not-found' && mode === 'create' && userId && (
          <ProfileEditForm
            userId={userId}
            initialValues={{ ...BLANK_FORM, userId }}
            submitLabel="Create Profile"
            onCancel={() => setMode('view')}
            onSubmit={handleCreate}
          />
        )}

        {status === 'success' && profile && mode === 'view' && (
          <ProfileViewCard profile={profile} onEdit={() => setMode('edit')} onProfileImageUploaded={reload} />
        )}

        {status === 'success' && profile && mode === 'edit' && (
          <ProfileEditForm
            userId={profile.userId}
            initialValues={{
              userId: profile.userId,
              fullName: profile.fullName,
              phoneNumber: profile.phoneNumber,
              dateOfBirth: profile.dateOfBirth,
              gender: profile.gender,
              monthlySalary: profile.monthlySalary,
              preferredCurrency: profile.preferredCurrency,
              primaryFinancialGoal: profile.primaryFinancialGoal,
            }}
            onCancel={() => setMode('view')}
            onSubmit={handleUpdate}
          />
        )}
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
