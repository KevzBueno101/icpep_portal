import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { publicApi } from '../../api/axios'
import toast from 'react-hot-toast'
import { Info } from 'lucide-react'

const YEAR_LEVELS = [
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
]

const FIELD_LABELS = {
  email: 'Email',
  username: 'Username',
  password: 'Password',
  confirm_password: 'Confirm password',
  first_name: 'First name',
  middle_name: 'Middle name',
  last_name: 'Last name',
  student_number: 'Student number',
  year_level: 'Year level',
  section: 'Section / block',
  contact_number: 'Contact number',
  profile_picture: 'Profile picture',
  payment_proof_image: 'Proof of payment',
  coe_id_image: 'COE / School ID',
}

const FILE_FIELDS = ['profile_picture', 'payment_proof_image', 'coe_id_image']

const SECTION_SUGGESTIONS = ['A', 'B', 'C', 'D']
const MAX_RETRIES = 2
const RETRY_DELAY = 5000

const Field = ({ label, name, type = 'text', placeholder, value, onChange, required = true, error, info, ...inputProps }) => (
  <div>
    <label className="block text-sm text-slate-600 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className={`w-full bg-slate-100 text-slate-900 rounded-lg px-4 py-3 text-sm outline-none ring-1 focus:ring-2 focus:ring-sky-500 ${
        error ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-200'
      }`}
      {...inputProps}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    {!error && info && <p className="text-xs text-slate-500 mt-1">{info}</p>}
  </div>
)

const PasswordField = ({ label, name, value, onChange, show, onToggle, error }) => (
  <div>
    <label className="block text-sm text-slate-600 mb-1">{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        required
        minLength={8}
        className={`w-full bg-slate-100 text-slate-900 rounded-lg px-4 py-3 pr-14 text-sm outline-none ring-1 focus:ring-2 focus:ring-sky-500 ${
          error ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-200'
        }`}
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-slate-500 hover:text-slate-900"
      >
        {show ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19.5c-5.52 0-10-4.48-10-10 0-1.44.32-2.8.88-4.02" />
            <path d="M1 1l22 22" />
            <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
            <path d="M14.12 14.12C13.4 14.84 12.29 15.25 11 15.25c-2.21 0-4-1.79-4-4 0-1.29.41-2.4 1.13-3.12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
)

const CopyableInput = ({ value, label }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm text-slate-600">{label}</label>}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 bg-slate-100 rounded-lg px-3 py-2 ring-1 ring-slate-200">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <input
            type="text"
            value={value}
            readOnly
            className="flex-1 bg-transparent text-sm text-slate-900 outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-sky-500 text-white hover:bg-sky-600'
          }`}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

const Register = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [previewUrl, setPreviewUrl] = useState('')
  const [form, setForm] = useState({
    email: '', username: '', password: '', confirm_password: '',
    first_name: '', middle_name: '', last_name: '',
    student_number: '', course: 'BSCpE', year_level: '', section: '', contact_number: '',
    profile_picture: null,
    payment_method: 'ON_HAND',
    membership_fee: 'SEMESTER',
    payment_proof_image: null,
    coe_id_image: null,
  })
  const [paymentProofPreviewUrl, setPaymentProofPreviewUrl] = useState('')
  const [coeIdPreviewUrl, setCoeIdPreviewUrl] = useState('')
  const [gcashNumber, setGcashNumber] = useState('')
  const [gcashName, setGcashName] = useState('')
  const [gcashCopied, setGcashCopied] = useState(false)
  const [errors, setErrors] = useState({
    email: '',
    username: '',
    student_number: '',
    contact_number: '',
  })
  const [checkingAvailability, setCheckingAvailability] = useState({
    email: false,
    username: false,
  })


  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
  const [showSectionSuggestions, setShowSectionSuggestions] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const sectionFieldRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sectionFieldRef.current && !sectionFieldRef.current.contains(e.target)) {
        setShowSectionSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })

    if (name === 'email' || name === 'username') {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }
  const hasValue = (value) => String(value ?? '').trim().length > 0
  const isFile = (value) => value instanceof File
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  const isValidStudentNumber = (value) => (String(value ?? '').replace(/\D/g, '')).length >= 5

  const formatRegistrationErrors = (data) => {
    if (!data) {
      return ['Registration failed. Please check your details and try again.']
    }

    if (typeof data === 'string') {
      return [data]
    }

    if (Array.isArray(data)) {
      return data.flatMap(formatRegistrationErrors)
    }

    if (typeof data !== 'object') {
      return [String(data)]
    }

    return Object.entries(data).flatMap(([field, value]) => {
      const label = FIELD_LABELS[field] || field.replaceAll('_', ' ')
      const messages = formatRegistrationErrors(value)

      return messages.map((message) => {
        if (field === 'password' && message.includes('at least 8 characters')) {
          return 'Password must be at least 8 characters.'
        }

        if (field === 'email' && message.includes('already exists')) {
          return 'Email already exists.'
        }

        if (field === 'username' && message.includes('already exists')) {
          return 'Username already exists.'
        }

        if (FILE_FIELDS.includes(field) && message.includes('submitted data was not a file')) {
          return `${label}: please choose the file again before submitting.`
        }

        return `${label}: ${message}`
      })
    })
  }

  const isStepComplete = (stepNumber) => {
    if (stepNumber === 1) {
      return (
        hasValue(form.email) &&
        isValidEmail(form.email) &&
        hasValue(form.username) &&
        !errors.email &&
        !errors.username &&
        !checkingAvailability.email &&
        !checkingAvailability.username &&
        form.password.length >= 8 &&
        hasValue(form.confirm_password) &&
        form.password === form.confirm_password &&
        agreedToPrivacy
      )
    }

    if (stepNumber === 2) {
      return hasValue(form.first_name) && hasValue(form.last_name)
    }

    if (stepNumber === 3) {
      return (
        isValidStudentNumber(form.student_number) &&
        /^09\d{9}$/.test(form.contact_number) &&
        hasValue(form.year_level) &&
        hasValue(form.section)
      )
    }

    if (stepNumber === 4) {
      return isFile(form.profile_picture) && isFile(form.coe_id_image)
    }

    if (stepNumber === 5) {
      return hasValue(form.payment_method) && isFile(form.payment_proof_image)
    }

    return true
  }

  const validateStep = (stepNumber) => {
    if (isStepComplete(stepNumber)) {
      return true
    }

    if (stepNumber === 1) {
      if (!hasValue(form.email) || !hasValue(form.username) || !hasValue(form.password) || !hasValue(form.confirm_password)) {
        toast.error('Please complete all account info fields.')
      } else if (!isValidEmail(form.email)) {
        toast.error('Please enter a valid email address.')
      } else if (errors.email || errors.username) {
        toast.error(errors.email || errors.username)
      } else if (checkingAvailability.email || checkingAvailability.username) {
        toast.error('Please wait while we check email and username availability.')
      } else if (form.password.length < 8) {
        toast.error('Password must be at least 8 characters.')
      } else if (!agreedToPrivacy) {
        toast.error('Please agree to the Privacy Policy before continuing.')
      } else {
        toast.error('Passwords do not match.')
      }
    } else if (stepNumber === 2) {
      toast.error('Please complete your first name and last name.')
    } else if (stepNumber === 3) {
      if (!isValidStudentNumber(form.student_number)) {
        toast.error('Student number must have at least 5 digits.')
      } else if (!/^09\d{9}$/.test(form.contact_number)) {
        toast.error('Contact number must be 11 digits starting with 09')
      } else {
        toast.error('Please complete all student info fields.')
      }
    } else if (stepNumber === 4) {
      toast.error('Please upload your profile picture and COE / School ID.')
    } else if (stepNumber === 5) {
      toast.error('Please upload your proof of payment.')
    }

    return false
  }

  const handleStudentNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '') // Keep only the student number digits
    // Auto-format: XXXX-XXXXX... (any length after the dash)
    if (value.length > 4) {
      value = value.slice(0, 4) + '-' + value.slice(4)
    }
    setForm({ ...form, student_number: value })
    
    // Validate in real-time
    const isValid = (value.replace(/\D/g, '')).length >= 5
    setErrors({
      ...errors,
      student_number: isValid ? '' : 'Student number must have at least 5 digits'
    })
  }

  const handleStudentNumberKeyDown = (e) => {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Enter',
      'Escape',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ]

    if (
      allowedKeys.includes(e.key) ||
      ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) ||
      /^\d$/.test(e.key)
    ) {
      return
    }

    e.preventDefault()
  }

  const handleContactNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '') // Remove non-digits
    setForm({ ...form, contact_number: value })
    
    // Validate in real-time
    const isValid = /^09\d{9}$/.test(value)
    setErrors({
      ...errors,
      contact_number: isValid ? '' : 'Must be 11 digits starting with 09'
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null
    setForm({ ...form, profile_picture: file })
    setPreviewUrl(file ? URL.createObjectURL(file) : '')
  }

  const handleProofChange = (e) => {
    const file = e.target.files?.[0] ?? null
    setForm({ ...form, payment_proof_image: file })
    setPaymentProofPreviewUrl(file ? URL.createObjectURL(file) : '')
  }

  const handleCoeIdChange = (e) => {
    const file = e.target.files?.[0] ?? null
    
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must not exceed 10MB')
        return
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed')
        return
      }
    }
    
    setForm({ ...form, coe_id_image: file })
    setCoeIdPreviewUrl(file ? URL.createObjectURL(file) : '')
  }

  useEffect(() => {
    const loadPaymentSettings = async () => {
      try {
        const res = await publicApi.get('/members/payment-settings/')
        setGcashNumber(res.data.gcash_number || '')
        setGcashName(res.data.gcash_name || '')

      } catch {
        setGcashNumber('')
        setGcashName('')
      }
    }

    loadPaymentSettings()
  }, [])

  useEffect(() => {
    const email = form.email.trim()

    if (!email || !isValidEmail(email)) {
      setCheckingAvailability((prev) => ({ ...prev, email: false }))
      return
    }

    setCheckingAvailability((prev) => ({ ...prev, email: true }))
    let isCurrentCheck = true

    const timeoutId = setTimeout(async () => {
      try {
        const res = await publicApi.get('/auth/availability/', { params: { email } })
        if (!isCurrentCheck) return
        setErrors((prev) => ({
          ...prev,
          email: res.data.email_exists ? 'Email already exists.' : '',
        }))
      } catch {
        if (!isCurrentCheck) return
        setErrors((prev) => ({ ...prev, email: '' }))
      } finally {
        if (!isCurrentCheck) return
        setCheckingAvailability((prev) => ({ ...prev, email: false }))
      }
    }, 500)

    return () => {
      isCurrentCheck = false
      clearTimeout(timeoutId)
    }
  }, [form.email])

  useEffect(() => {
    const username = form.username.trim()

    if (!username) {
      setCheckingAvailability((prev) => ({ ...prev, username: false }))
      return
    }

    setCheckingAvailability((prev) => ({ ...prev, username: true }))
    let isCurrentCheck = true

    const timeoutId = setTimeout(async () => {
      try {
        const res = await publicApi.get('/auth/availability/', { params: { username } })
        if (!isCurrentCheck) return
        setErrors((prev) => ({
          ...prev,
          username: res.data.username_exists ? 'Username already exists.' : '',
        }))
      } catch {
        if (!isCurrentCheck) return
        setErrors((prev) => ({ ...prev, username: '' }))
      } finally {
        if (!isCurrentCheck) return
        setCheckingAvailability((prev) => ({ ...prev, username: false }))
      }
    }, 500)

    return () => {
      isCurrentCheck = false
      clearTimeout(timeoutId)
    }
  }, [form.username])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (paymentProofPreviewUrl) {
        URL.revokeObjectURL(paymentProofPreviewUrl)
      }
    }
  }, [paymentProofPreviewUrl])

  useEffect(() => {
    return () => {
      if (coeIdPreviewUrl) {
        URL.revokeObjectURL(coeIdPreviewUrl)
      }
    }
  }, [coeIdPreviewUrl])

  const handleNext = () => {
    if (!validateStep(step)) {
      return
    }
    
    setStep((prev) => Math.min(prev + 1, 5))
  }
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1))

  const handleCopyGcashNumber = async () => {
    if (!gcashNumber) return

    try {
      await navigator.clipboard.writeText(gcashNumber)
      setGcashCopied(true)
      setTimeout(() => setGcashCopied(false), 2000)
    } catch {
      toast.error('Failed to copy the GCash number.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!agreedToPrivacy) {
      toast.error('Please agree to the Privacy Policy before registering.')
      return
    }

    if (![1, 2, 3, 4, 5].every(validateStep)) {
      return
    }

    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (FILE_FIELDS.includes(key)) {
        if (isFile(value)) {
          payload.append(key, value)
        }
        return
      }

      if (value !== null && value !== undefined) {
        payload.append(key, value)
      }
    })

    setLoading(true)
    try {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          await register(payload)
          toast.success('Registered successfully!')
          navigate('/membership-pending', { replace: true })
          return
        } catch (err) {
          const isNetwork = !err.response
          const isServerError = err.response?.status >= 500
          if ((isNetwork || isServerError) && attempt < MAX_RETRIES) {
            setRetrying(true)
            await new Promise((r) => setTimeout(r, RETRY_DELAY))
            continue
          }
          formatRegistrationErrors(err.response?.data).forEach((message) => toast.error(message))
          return
        }
      }
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }

  const passwordError = form.password && form.password.length < 8
    ? 'Password must be at least 8 characters.'
    : ''
  const confirmPasswordError = form.confirm_password && form.password !== form.confirm_password
    ? 'Passwords do not match.'
    : ''
  const emailError = form.email && !isValidEmail(form.email)
    ? 'Please enter a valid email address.'
    : errors.email
  const usernameError = errors.username

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white rounded-2xl p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/icpep_logo.png" alt="ICPEP.SE Logo" className="h-16 w-auto" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Create an Account</h1>
            <p className="text-slate-500 mt-1 text-sm">ICPEP.SE Membership Registration</p>
          </div>
        </div>

        <div className="mb-6 space-y-2">
          <p className="text-sm text-slate-500">Step {step} of 5</p>
          <div className="h-2 rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-sky-600 transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Account Info</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={handleChange}
                  error={emailError}
                  info={checkingAvailability.email ? 'Checking email availability...' : ''}
                />
                <Field
                  label="Username"
                  name="username"
                  placeholder="username"
                  value={form.username}
                  onChange={handleChange}
                  error={usernameError}
                  info={checkingAvailability.username ? 'Checking username availability...' : ''}
                />
                <PasswordField
                  label="Password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  show={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                  error={passwordError}
                />
                <PasswordField
                  label="Confirm Password"
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  show={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((prev) => !prev)}
                  error={confirmPasswordError}
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreedToPrivacy}
                    onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <div className="text-sm text-slate-700">
                    <span>I agree to the </span>
                    <button
                      type="button"
                      onClick={() => setShowPrivacyPolicy(true)}
                      className="font-semibold text-sky-600 hover:underline"
                    >
                      Privacy Policy
                    </button>
                    <span> and terms.</span>
                  </div>
                </label>
                {!agreedToPrivacy && (
                  <p className="mt-2 text-xs text-red-500">You must agree before continuing.</p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Personal Info</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="First Name" name="first_name" placeholder="Juan" value={form.first_name} onChange={handleChange} />
                <Field label="Middle Name" name="middle_name" placeholder="(optional)" value={form.middle_name} onChange={handleChange} required={false} />
                <Field label="Last Name" name="last_name" placeholder="Dela Cruz" value={form.last_name} onChange={handleChange} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Student Info</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Student Number"
                  name="student_number"
                  placeholder="2024-73359"
                  value={form.student_number}
                  onChange={handleStudentNumberChange}
                  onKeyDown={handleStudentNumberKeyDown}
                  inputMode="numeric"
                  error={errors.student_number}
                />
                <Field label="Contact Number" name="contact_number" placeholder="09123456789" value={form.contact_number} onChange={handleContactNumberChange} error={errors.contact_number} />
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Course</label>
                  <input
                    name="course"
                    type="text"
                    value="BSCpE"
                    disabled
                    className="w-full bg-slate-100 text-slate-500 rounded-lg px-4 py-3 text-sm cursor-not-allowed ring-1 ring-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Year Level</label>
                  <select
                    name="year_level"
                    value={form.year_level}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-100 text-slate-900 rounded-lg px-4 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Select year</option>
                    {YEAR_LEVELS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
                  </select>
                </div>
                <div className="relative" ref={sectionFieldRef}>
                  <label className="flex items-center gap-1 text-sm text-slate-600 mb-1">
                    Section/Block
                    <button
                      type="button"
                      onClick={() => setShowSectionSuggestions((prev) => !prev)}
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-100 text-sky-600 hover:bg-sky-200"
                      aria-label="Section suggestions"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </label>
                  <input
                    name="section"
                    placeholder="A"
                    value={form.section}
                    onChange={handleChange}
                    onFocus={() => setShowSectionSuggestions(true)}
                    className="w-full bg-slate-100 text-slate-900 rounded-lg px-4 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-sky-500"
                  />
                  {showSectionSuggestions && (
                    <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                      <p className="mb-2 text-xs font-medium text-slate-500">Suggested sections</p>
                      <div className="grid grid-cols-4 gap-2">
                        {SECTION_SUGGESTIONS.map((section) => (
                          <button
                            key={section}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, section })
                              setShowSectionSuggestions(false)
                            }}
                            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                              form.section === section
                                ? 'border-sky-500 bg-sky-50 text-sky-700'
                                : 'border-slate-200 text-slate-700 hover:border-sky-400 hover:bg-sky-50'
                            }`}
                          >
                            {section}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Document Uploads</p>
              
              <div className="space-y-3">
                <label className="block text-sm text-slate-600 mb-1">Profile Picture</label>
                <label className={`group block cursor-pointer rounded-3xl border-2 border-dashed transition overflow-hidden relative ${
                  previewUrl
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-slate-300 bg-slate-50 hover:border-sky-400 hover:bg-slate-100'
                }`}>
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Profile picture preview" className="h-52 w-full object-contain bg-white" />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 group-hover:bg-slate-900/40 group-hover:opacity-100 transition">
                        <span className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-800 shadow">Change photo</span>
                      </div>
                    </>
                  ) : (
                    <div className="px-6 py-10 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <path d="M12 15V3" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">Drag & drop or choose file to upload</p>
                        <p className="text-sm text-slate-500">Supported formats: JPG, PNG, JPEG</p>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    name="profile_picture"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-3">
                <label className="block text-sm text-slate-600 mb-1">Certificate of Enrollment / School ID</label>
                <label className={`group block cursor-pointer rounded-3xl border-2 border-dashed transition overflow-hidden relative ${
                  coeIdPreviewUrl
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-slate-300 bg-slate-50 hover:border-sky-400 hover:bg-slate-100'
                }`}>
                  {coeIdPreviewUrl ? (
                    <>
                      {form.coe_id_image?.type === 'application/pdf' ? (
                        <div className="px-6 py-10 text-center">
                          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-slate-900 break-all">{form.coe_id_image.name}</p>
                          <p className="text-xs text-slate-500 mt-1">PDF attached — click to change</p>
                        </div>
                      ) : (
                        <>
                          <img src={coeIdPreviewUrl} alt="COE/ID preview" className="h-52 w-full object-contain bg-white" />
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 group-hover:bg-slate-900/40 group-hover:opacity-100 transition">
                            <span className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-800 shadow">Change file</span>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="px-6 py-10 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <path d="M12 15V3" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">Drag & drop or choose file to upload</p>
                        <p className="text-sm text-slate-500">Supported formats: JPG, PNG, JPEG, PDF (Max 10MB)</p>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    name="coe_id_image"
                    accept="image/*,.pdf"
                    onChange={handleCoeIdChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-xs text-slate-500 uppercase tracking-widest">Payment Details</p>
                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-2">Payment Method</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <label
                        className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-3.5 cursor-pointer transition flex-1 ${
                          form.payment_method === 'GCASH'
                            ? 'border-sky-500 bg-sky-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          value="GCASH"
                          checked={form.payment_method === 'GCASH'}
                          onChange={handleChange}
                          className="h-4 w-4 text-sky-600 accent-sky-600"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">GCash</p>
                          <p className="text-xs text-slate-500">Pay via GCash mobile wallet</p>
                        </div>
                      </label>
                      <label
                        className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-3.5 cursor-pointer transition flex-1 ${
                          form.payment_method === 'ON_HAND'
                            ? 'border-sky-500 bg-sky-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          value="ON_HAND"
                          checked={form.payment_method === 'ON_HAND'}
                          onChange={handleChange}
                          className="h-4 w-4 text-sky-600 accent-sky-600"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">On-hand / Personal</p>
                          <p className="text-xs text-slate-500">Pay in person to an officer</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-600 mb-2">Membership Fee</label>
                    <select
                      name="membership_fee"
                      value={form.membership_fee}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
                    >
                      <option value="SEMESTER">₱25 — 1 Semester</option>
                      <option value="ANNUAL">₱50 — 1 Academic Year</option>
                    </select>
                    <p className="mt-1.5 text-xs text-slate-500">
                      Choose your coverage: ₱25 for one semester or ₱50 for the full academic year.
                    </p>
                  </div>

                  {form.payment_method === 'GCASH' ? (
                    <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">GCash payment details</p>
                      {gcashNumber || gcashName ? (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <span className="text-slate-600">Name</span>
                            <span className="font-semibold text-slate-900 text-right">{gcashName || 'GCash account'}</span>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <span className="text-slate-600">GCash #</span>
                            <span className="flex items-center gap-2 font-semibold text-slate-900 text-right">
                              {gcashNumber || '—'}
                              {gcashNumber && (
                                <button
                                  type="button"
                                  onClick={handleCopyGcashNumber}
                                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                                    gcashCopied
                                      ? 'border-green-300 bg-green-100 text-green-700'
                                      : 'border-sky-300 bg-white text-sky-700 hover:bg-sky-50'
                                  }`}
                                  aria-label="Copy GCash number"
                                >
                                  {gcashCopied ? (
                                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  ) : (
                                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                  )}
                                  {gcashCopied ? 'Copied' : 'Copy'}
                                </button>
                              )}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-slate-600">The GCash details have not been set yet. Ask the admin for the current payment account before uploading proof.</p>
                      )}
                      <p className="mt-3 text-slate-600">Upload the screenshot of payment proof after sending.</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                      <Info className="h-5 w-5 shrink-0 mt-0.5" />
                      <p>Please take a picture with the designated officer as proof of on-hand payment.</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Proof of Payment</label>
                    <label className={`group block cursor-pointer rounded-3xl border-2 border-dashed transition overflow-hidden relative ${
                      paymentProofPreviewUrl
                        ? 'border-sky-300 bg-sky-50'
                        : 'border-slate-300 bg-slate-50 hover:border-sky-400 hover:bg-slate-100'
                    }`}>
                      {paymentProofPreviewUrl ? (
                        <>
                          <img src={paymentProofPreviewUrl} alt="Payment proof preview" className="h-52 w-full object-contain bg-white" />
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 group-hover:bg-slate-900/40 group-hover:opacity-100 transition">
                            <span className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-800 shadow">Change photo</span>
                          </div>
                        </>
                      ) : (
                        <div className="px-6 py-10 text-center">
                          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <path d="M12 15V3" />
                            </svg>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-900">Drag & drop or choose file to upload</p>
                            <p className="text-sm text-slate-500">Supported formats: JPG, PNG, JPEG</p>
                          </div>
                        </div>
                      )}
                      <input
                        type="file"
                        name="payment_proof_image"
                        accept="image/*"
                        onChange={handleProofChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800 mb-2">Instructions</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Piliin ang payment method: On-hand / Personal o GCash.</li>
                    <li>I-upload ang screenshot ng payment receipt o transaction reference.</li>
                    <li>If On-hand payment, please take a picture together with the officer in-charge then upload it here.</li>
                    <li>Siguraduhing malinaw ang halagang binayaran at reference code.</li>
                    <li>Wait for the approval.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepComplete(step)}
                className="w-full sm:w-auto rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !isStepComplete(step)}
                className="w-full sm:w-auto rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (retrying ? 'Waking up server...' : 'Registering...') : 'Create Account'}
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-sky-600 hover:underline">Sign in</Link>
        </p>

        {showPrivacyPolicy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Privacy Policy</h2>
                  <p className="text-sm text-slate-500">Please read and agree before continuing.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrivacyPolicy(false)}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close privacy policy"
                >
                  ✕
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
                  You may request access to your data or ask for corrections by contacting the ICPEP admin.
                  We follow reasonable security measures to protect your information.
                </p>
                <p>
                  By clicking &ldquo;I agree&rdquo;, you confirm that you have read and understood this Privacy
                  Policy and consent to the collection and use of your data as described.
                </p>
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowPrivacyPolicy(false)}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAgreedToPrivacy(true)
                    setShowPrivacyPolicy(false)
                  }}
                  className="rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  I agree
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Register
