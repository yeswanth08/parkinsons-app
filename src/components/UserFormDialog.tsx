import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setUserData } from '../store/slices/userSlice'
import { X } from 'lucide-react'

interface UserFormDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserFormDialog({ isOpen, onClose }: UserFormDialogProps) {
  const dispatch = useDispatch()
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!age || !gender) {
      setError('Please fill in all fields')
      return
    }

    const ageNum = parseInt(age)
    if (ageNum < 18 || ageNum > 120) {
      setError('Please enter a valid age between 18 and 120')
      return
    }

    dispatch(setUserData({
      age: ageNum,
      gender: gender as 'male' | 'female' | 'other'
    }))

    setAge('')
    setGender('')
    onClose()
  }

  const handleCloseButton = () => {
    return
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg border border-[#1F2937]/40 bg-gradient-to-br from-[#111827] to-[#0B1220] p-6 shadow-2xl shadow-[#22D3EE]/10 animate-fade-in-up">
        {/* Close button - disabled to prevent accidental dismissal */}
        <button
          onClick={handleCloseButton}
          disabled={true}
          className="absolute right-4 top-4 rounded-lg p-1 text-[#6B7280] cursor-not-allowed transition-colors opacity-50"
          aria-label="Close button disabled - please complete the form"
          title="Complete the form to continue"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-2 text-2xl font-bold text-[#E5E7EB]" style={{ fontFamily: 'var(--font-heading)' }}>
          Voice Test Information
        </h2>
        <p className="mb-6 text-sm text-[#9CA3AF]">
          Please provide your age and gender for accurate analysis
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Age Input */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-[#E5E7EB] mb-2">
              Age
            </label>
            <input
              type="number"
              id="age"
              value={age}
              onChange={(e) => {
                setAge(e.target.value)
                setError('')
              }}
              placeholder="Enter your age"
              min="18"
              max="120"
              className="w-full rounded-lg border border-[#1F2937] bg-[#0B1220] px-4 py-2 text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#22D3EE] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/20 transition-colors"
            />
          </div>

          {/* Gender Select */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-[#E5E7EB] mb-2">
              Gender
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => {
                setGender(e.target.value as 'male' | 'female' | 'other' | '')
                setError('')
              }}
              className="w-full rounded-lg border border-[#1F2937] bg-[#0B1220] px-4 py-2 text-[#E5E7EB] focus:border-[#22D3EE] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/20 transition-colors"
            >
              <option value="">Select your gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#06B6D4] px-4 py-2 text-base font-semibold text-[#0B1220] hover:from-[#06B6D4] hover:to-[#0891B2] transition-all transform hover:scale-105 shadow-lg shadow-[#22D3EE]/20 mt-6"
          >
            Continue to Test
          </button>
        </form>
      </div>
    </div>
  )
}
