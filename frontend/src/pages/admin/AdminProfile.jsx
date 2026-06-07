import { useState, useEffect, useMemo } from 'react';
import { useAdminProfile } from '../../hooks/useAdminProfile';
import toast from 'react-hot-toast';
import { Camera, Pencil } from 'lucide-react';

import { useAuth } from '../../context/useAuth';
import { resolveProfilePictureUrl } from '../../utils/profilePicture';


export default function AdminProfile({ refreshTrigger, triggerRefresh }) {
  const { user, loading, updateProfile, fetchProfile } = useAdminProfile();
  const { refreshUser } = useAuth();


  const [saving, setSaving] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Backend now supports: first_name, last_name, email, username, profile_picture, password fields
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    profile_picture: null,
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [previewUrl, setPreviewUrl] = useState(null);

  const fullName = useMemo(() => {
    const fn = user?.first_name ?? '';
    const ln = user?.last_name ?? '';
    const name = `${fn} ${ln}`.trim();
    return name || user?.username || 'Admin Profile';
  }, [user]);

  const roleLabel = useMemo(() => {
    const position = user?.position || '';
    const role = user?.role || '';
    if (position) return position.toUpperCase();
    if (role) return role;
    return 'ADMIN';
  }, [user]);

  const canEditEverything = useMemo(() => {
    const positionLower = user?.position?.toLowerCase?.() ?? '';
    return positionLower.includes('president');
  }, [user]);

  useEffect(() => {
    // avoid hook lint rule issues with cascading setState by deferring to microtask
    Promise.resolve().then(() => fetchProfile());
  }, [fetchProfile]);


  useEffect(() => {
    if (!user) return;

    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      username: user.username || '',
      profile_picture: null,
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
    setPreviewUrl(null);
    setShowEditProfile(false);
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    setFormData((prev) => ({ ...prev, profile_picture: file }));
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (!user) return;

    try {
      setSaving(true);

      const submitData = new FormData();
      submitData.append('first_name', formData.first_name);
      submitData.append('last_name', formData.last_name);
      submitData.append('email', formData.email);
      submitData.append('username', formData.username);

      // Only include password fields if user is trying to change password
      if (formData.new_password) {
        submitData.append('current_password', formData.current_password);
        submitData.append('new_password', formData.new_password);
        submitData.append('confirm_password', formData.confirm_password);
      }

      if (formData.profile_picture) {
        submitData.append('profile_picture', formData.profile_picture);
      }

      await updateProfile(submitData);
      toast.success('Profile updated successfully!');

      // Update both page-local profile state and AuthContext user state
      // so every component (e.g., AdminSidebar profile circle) reflects the new picture.
      await fetchProfile();
      await refreshUser();
      // Trigger refresh of admin list to update Admin Officer/Accounts Card
      if (triggerRefresh) {
        triggerRefresh();
      }
      setPreviewUrl(null);
      setShowEditProfile(false);

    } catch (error) {
      toast.error('Failed to update profile: ' + (error?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !user) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Facebook-inspired admin profile layout (dynamic backend will be wired next).
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-2xl border-4 border-white bg-white/80 shadow overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile preview" className="h-full w-full object-cover" />
                  ) : user?.profile_picture ? (
                    <img src={resolveProfilePictureUrl(user.profile_picture)} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                      <Camera className="text-slate-400" size={22} />
                    </div>
                  )}
                </div>

                <label
                  className={
                    'absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ' +
                    (canEditEverything ? '' : 'opacity-0 pointer-events-none')
                  }
                  title={canEditEverything ? 'Edit profile picture' : 'Only President can edit all fields'}
                >
                  <span className="inline-flex items-center gap-2">
                    <Pencil size={14} /> Edit
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureChange}
                  />
                </label>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">{fullName}</h2>
                <div className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
                  {roleLabel}
                </div>
                <div className="mt-2 text-sm text-slate-600">Officer/Admin Profile</div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowEditProfile(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary transition"
              >
                <Pencil size={16} /> Edit Profile
              </button>
              <div className="mt-2 text-xs text-slate-500">
                President: full edit • Others: limited fields (backend currently).
              </div>
            </div>
          </div>

          {/* Save bar */}
          {showEditProfile && (
            <form onSubmit={handleSave} className="mt-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">First Name</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Last Name</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Email</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Username</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 mb-3">Change Password (Optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Current Password</label>
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        type="password"
                        name="current_password"
                        value={formData.current_password}
                        onChange={handleInputChange}
                        placeholder="Required to change password"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">New Password</label>
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        type="password"
                        name="new_password"
                        value={formData.new_password}
                        onChange={handleInputChange}
                        placeholder="Min 8 characters"
                        minLength={8}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Confirm New Password</label>
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        type="password"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleInputChange}
                        placeholder="Re-enter new password"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditProfile(false);
                      setPreviewUrl(null);
                      setFormData({
                        first_name: user?.first_name || '',
                        last_name: user?.last_name || '',
                        email: user?.email || '',
                        username: user?.username || '',
                        profile_picture: null,
                        current_password: '',
                        new_password: '',
                        confirm_password: '',
                      });
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 inline-flex items-center gap-2"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                {!canEditEverything ? (
                  <div className="mt-3 text-xs text-slate-500">
                    Note: Only President can edit role and position fields.
                  </div>
                ) : null}
              </div>
            </form>
          )}

          {/* Details */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Email</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{user?.email || '—'}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Username</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">@{user?.username || '—'}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Role</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{user?.role || 'ADMIN'}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Position</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{user?.position || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


