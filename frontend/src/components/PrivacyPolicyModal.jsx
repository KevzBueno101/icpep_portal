import { X } from 'lucide-react'

export default function PrivacyPolicyModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6" onClick={onClose}>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Privacy Policy</h2>
            <p className="text-sm text-slate-500">How we handle your personal data</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close privacy policy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5 text-sm text-slate-600">
          <p className="text-slate-800 font-semibold">Privacy and Data Use</p>
          <p>
            By creating an account, you agree that ICPEP may collect and process your provided
            personal information for membership registration, identity verification, and program
            administration. This includes your name, email, student number, contact number, uploaded
            school ID, profile picture, and payment proof.
          </p>
          <p>
            We will use your information only for ICPEP membership management, communication, and
            event coordination. Your data will not be shared with third parties except as required by law.
          </p>
          <p>
            We retain your personal data only as long as necessary for membership purposes. After your
            membership expires, your data will be retained for one year and then anonymized or deleted.
          </p>
          <p className="text-slate-800 font-semibold mt-4">Your Rights</p>
          <p>
            You have the right to access, correct, or request deletion of your personal data. You may
            also withdraw your consent at any time by contacting the ICPEP administration or through
            your profile settings.
          </p>
          <p>
            We implement reasonable security measures, including encrypted connections (HTTPS) and
            role-based access controls, to protect your information from unauthorized access.
          </p>
          <p className="text-slate-800 font-semibold mt-4">Third-Party Services</p>
          <p>
            We use Cloudinary for image storage and Render/Vercel for hosting. These services may
            process your data under their own privacy policies and data processing agreements.
          </p>
          <p>
            For questions or concerns about your data, please contact the ICPEP administration at{' '}
            <a href="mailto:info@icpep.se" className="text-sky-600 underline">info@icpep.se</a>.
          </p>
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
