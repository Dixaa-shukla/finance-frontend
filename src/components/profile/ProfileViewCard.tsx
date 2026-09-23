import {
  Phone,
  Cake,
  VenusAndMars,
  Wallet,
  Coins,
  Target,
  Pencil,
} from 'lucide-react';
import { ProfileImageUploader } from '@/components/profile/ProfileImageUploader';
import { Button } from '@/components/common/Button';
import { ProfileField } from '@/components/profile/ProfileField';
import type { ProfileResponse } from '@/types/profile';

interface ProfileViewCardProps {
  profile: ProfileResponse;
  onEdit: () => void;
  onProfileImageUploaded: () => Promise<void> | void;
}

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatCurrency(amount: number | null, currency: string): string | null {
  if (amount === null || amount === undefined) return null;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('en-IN')}`;
  }
}

export function ProfileViewCard({ profile, onEdit, onProfileImageUploaded }: ProfileViewCardProps) {
  return (
    <div className="glass-card p-6 sm:p-8">
      <div className="flex flex-col items-start justify-between gap-6 border-b border-sky-100 pb-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <ProfileImageUploader userId={profile.userId} name={profile.fullName} imageUrl={profile.profilePictureUrl} onUploaded={onProfileImageUploaded} />
          <div>
            <h2 className="text-lg font-bold text-navy-900">
              {profile.fullName}
            </h2>
            <p className="text-sm text-navy-700/60">
              Preferred currency: {profile.preferredCurrency}
            </p>
          </div>
        </div>
        <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={onEdit}>
          Edit Profile
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
        <ProfileField
          label="Phone Number"
          value={profile.phoneNumber}
          icon={<Phone className="h-4 w-4" />}
        />
        <ProfileField
          label="Date of Birth"
          value={formatDate(profile.dateOfBirth)}
          icon={<Cake className="h-4 w-4" />}
        />
        <ProfileField
          label="Gender"
          value={profile.gender ? GENDER_LABELS[profile.gender] ?? profile.gender : null}
          icon={<VenusAndMars className="h-4 w-4" />}
        />
        <ProfileField
          label="Monthly Salary"
          value={formatCurrency(profile.monthlySalary, profile.preferredCurrency)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <ProfileField
          label="Preferred Currency"
          value={profile.preferredCurrency}
          icon={<Coins className="h-4 w-4" />}
        />
        <ProfileField
          label="Primary Financial Goal"
          value={profile.primaryFinancialGoal}
          icon={<Target className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}
