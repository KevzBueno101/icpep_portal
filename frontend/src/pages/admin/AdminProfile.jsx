import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/admin/profile/');
        setProfile(res.data);
      } catch (err) {
        toast.error('Failed to load admin profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-sky-600" />
      </div>
    );
  }

  if (!profile) {
    return <p className="text-center text-slate-600">No profile data.</p>;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-semibold text-slate-900">Admin Profile</h2>
      <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-slate-500">Name</dt>
          <dd className="mt-1 text-sm text-slate-900">{profile.first_name} {profile.last_name}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-500">Email</dt>
          <dd className="mt-1 text-sm text-slate-900">{profile.email}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-500">Role</dt>
          <dd className="mt-1 text-sm text-slate-900">{profile.role}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-500">Position</dt>
          <dd className="mt-1 text-sm text-slate-900">{profile.position}</dd>
        </div>
      </dl>
    </div>
  );
}
