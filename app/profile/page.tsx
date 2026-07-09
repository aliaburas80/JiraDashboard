// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { SvgIcon } from '@/components/ui/SvgIcon';
import ProfileTab, { type ProfileFields } from '@/components/settings/ProfileTab';
import StorageTab from '@/components/settings/StorageTab';
import SecurityTab from '@/components/settings/SecurityTab';
import type { AppRole } from '@/lib/roles';

interface Profile extends ProfileFields {
  role: AppRole;
  dataStorageMode: 'cloud' | 'local';
}

const EMPTY_PROFILE: Profile = {
  name: '',
  email: '',
  role: 'user',
  roleLabel: '',
  avatarUrl: '',
  position: '',
  phone: '',
  contactEmail: '',
  address: '',
  certificates: '',
  bio: '',
  dataStorageMode: 'cloud',
  emailVerified: true,
};

// Settings side-menu — each entry only shows for roles listed in `roles`; omitting
// `roles` means visible to everyone. Nothing is currently role-restricted, but the
// gate is built in from the start so a future role-scoped setting doesn't need a rewrite.
interface SettingsTab { id: 'profile' | 'storage' | 'security'; label: string; icon: string; roles?: AppRole[] }
const SETTINGS_TABS: SettingsTab[] = [
  { id: 'profile',  label: 'Profile',  icon: 'person' },
  { id: 'storage',  label: 'Storage',  icon: 'cloud' },
  { id: 'security', label: 'Security', icon: 'lock' },
];
const VALID_SETTINGS_TABS: SettingsTab['id'][] = SETTINGS_TABS.map(t => t.id);

export default function ProfilePage() {
  const router = useRouter();
  // ?tab= deep-link support (mirrors /admin/settings) — lets other surfaces,
  // e.g. UserMenu's "Security" link, open a specific tab directly instead of
  // always landing on Profile and requiring an extra click.
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as SettingsTab['id'] | null;
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingStorageMode, setSavingStorageMode] = useState(false);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<SettingsTab['id']>(
    initialTab && VALID_SETTINGS_TABS.includes(initialTab) ? initialTab : 'profile'
  );

  useEffect(() => {
    fetch('/api/profile').then(r => r.ok ? r.json() : null)
      .then(profileData => {
        if (!profileData?.profile) {
          router.replace('/login');
          return;
        }
        setProfile(profileData.profile);
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function updateField(field: keyof ProfileFields, value: string) {
    setProfile(prev => ({ ...prev, [field]: value }));
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not save profile.');
      setProfile(data.profile);
      showToast('Profile saved.');
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function uploadProfileImage(file: File | null) {
    if (!file) return;
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/profile/image', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not upload profile image.');
      updateField('avatarUrl', data.avatarUrl);
      showToast('Profile image uploaded.');
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to upload profile image.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function updateStorageMode(mode: 'cloud' | 'local') {
    if (mode === profile.dataStorageMode) return;
    setSavingStorageMode(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, dataStorageMode: mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not update storage mode.');
      setProfile(data.profile);
      showToast(`Storage mode switched to "${mode === 'local' ? 'This device only' : 'App storage'}". This only affects new uploads going forward.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update storage mode.');
    } finally {
      setSavingStorageMode(false);
    }
  }

  if (loading) return <AppShell showNav><div className="flex h-64 items-center justify-center text-slate-400">Loading...</div></AppShell>;

  const visibleTabs = SETTINGS_TABS.filter(tab => !tab.roles || tab.roles.includes(profile.role));

  return (
    <AppShell showNav>
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-5xl py-8">
        <div className="mb-6">
          <h1 id="tour-header-profile" className="text-3xl font-black tracking-tight text-slate-950">Settings</h1>
          <p className="mt-2 text-sm text-slate-500">Manage your profile, data storage, and account security.</p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          <nav className="flex shrink-0 gap-2 overflow-x-auto md:w-48 md:flex-col md:overflow-visible" aria-label="Settings">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-left text-sm font-bold transition-colors ${
                  activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <SvgIcon name={tab.icon} size={15} />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="min-w-0 flex-1">
            {activeTab === 'profile' && (
              <ProfileTab
                profile={profile}
                onUpdateField={updateField}
                onSave={saveProfile}
                saving={saving}
                uploadingImage={uploadingImage}
                onUploadImage={uploadProfileImage}
                onLogout={logout}
              />
            )}
            {activeTab === 'storage' && (
              <StorageTab
                dataStorageMode={profile.dataStorageMode}
                savingStorageMode={savingStorageMode}
                onUpdateStorageMode={updateStorageMode}
                onToast={showToast}
              />
            )}
            {activeTab === 'security' && <SecurityTab onToast={showToast} />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
