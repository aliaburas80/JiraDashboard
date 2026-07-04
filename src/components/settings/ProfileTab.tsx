// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

export interface ProfileFields {
  name: string;
  email: string;
  roleLabel: string;
  avatarUrl: string;
  position: string;
  phone: string;
  contactEmail: string;
  address: string;
  certificates: string;
  bio: string;
}

interface ProfileTabProps {
  profile: ProfileFields;
  onUpdateField: (field: keyof ProfileFields, value: string) => void;
  onSave: () => void;
  saving: boolean;
  uploadingImage: boolean;
  onUploadImage: (file: File | null) => void;
  onLogout: () => void;
}

export default function ProfileTab({
  profile, onUpdateField, onSave, saving, uploadingImage, onUploadImage, onLogout,
}: ProfileTabProps) {
  const initials = profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-5 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt={profile.name} className="h-20 w-20 rounded-full object-cover ring-4 ring-blue-50" />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-full bg-blue-600 text-2xl font-black text-white ring-4 ring-blue-50">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xl font-black text-slate-950">{profile.name || 'Your name'}</p>
          <p className="text-sm text-slate-500">{profile.position || profile.roleLabel}</p>
          <p className="text-xs text-slate-400">{profile.email}</p>
        </div>
        <button type="button" onClick={onLogout} className="btn-outline-danger">
          Sign out
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-xs font-extrabold text-slate-700">
          Full name
          <input value={profile.name} onChange={e => onUpdateField('name', e.target.value)}
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
        <label className="grid gap-2 text-xs font-extrabold text-slate-700">
          Position
          <input value={profile.position} onChange={e => onUpdateField('position', e.target.value)} placeholder="Scrum Master, Product Lead..."
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
        <label className="grid gap-2 text-xs font-extrabold text-slate-700">
          Profile picture
          <span className="flex h-11 min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={e => onUploadImage(e.target.files?.[0] ?? null)}
              disabled={uploadingImage}
              className="min-w-0 flex-1 text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-blue-700 disabled:opacity-50"
            />
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            {uploadingImage ? 'Uploading to S3...' : 'Stored in S3 under images/profile/.'}
          </span>
        </label>
        <label className="grid gap-2 text-xs font-extrabold text-slate-700">
          Contact email
          <input value={profile.contactEmail} onChange={e => onUpdateField('contactEmail', e.target.value)} placeholder={profile.email}
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
        <label className="grid gap-2 text-xs font-extrabold text-slate-700">
          Telephone
          <input value={profile.phone} onChange={e => onUpdateField('phone', e.target.value)} placeholder="+962..."
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
        <label className="grid gap-2 text-xs font-extrabold text-slate-700">
          Address
          <input value={profile.address} onChange={e => onUpdateField('address', e.target.value)}
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
        <label className="grid gap-2 text-xs font-extrabold text-slate-700 md:col-span-2">
          Certificates
          <textarea value={profile.certificates} onChange={e => onUpdateField('certificates', e.target.value)} rows={3} placeholder="CSM, PMP, SAFe..."
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
        <label className="grid gap-2 text-xs font-extrabold text-slate-700 md:col-span-2">
          Shared team info
          <textarea value={profile.bio} onChange={e => onUpdateField('bio', e.target.value)} rows={4} placeholder="What should teammates know when working with you?"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
      </div>

      <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
        <button type="button" onClick={onSave} disabled={saving} className="btn-primary px-5 py-2.5 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </div>
    </section>
  );
}
