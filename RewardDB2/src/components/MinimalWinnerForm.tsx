import React, { useEffect, useRef, useState } from 'react'
import { useUserProfile } from '../hooks/useUserProfile'
import { db } from '../firebase'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import axios from 'axios'

const CLOUDINARY_UPLOAD_PRESET = 'rewards_unsigned'
const CLOUDINARY_CLOUD_NAME = 'dyey1kwiz'

async function uploadToCloudinary(file: File) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  const res = await axios.post(url, formData)
  return res.data.secure_url as string
}

interface Props { onClose?: () => void }

const MinimalWinnerForm: React.FC<Props> = ({ onClose }) => {
  const { profile, loading } = useUserProfile()
  
  // Form state - local cache
  const [heading, setHeading] = useState('')
  const [testimonial, setTestimonial] = useState('')
  const [category, setCategory] = useState('Academic')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [fileError, setFileError] = useState('')
  
  const headingInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // Autofocus first input when form opens
    const timer = setTimeout(() => {
      headingInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File too large (max 5MB)')
      return
    }

    setFileError('')
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || submitting) return

    setSubmitting(true)
    try {
      // Upload image if provided
      let imageUrl = ''
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile)
      }

      // Submit to Firebase
      await addDoc(collection(db, 'winnerSubmissions'), {
        uid: profile.uid,
        name: profile.displayName || '',
        house: profile.house || '',
        campus: profile.campus || '',
        category,
        testimonialHeading: heading,
        testimonial,
        imageUrl,
        status: 'pending',
        createdAt: Timestamp.now()
      })

      console.log('[MinimalWinnerForm] Submission successful')
      if (onClose) onClose()
    } catch (err: any) {
      console.error('[MinimalWinnerForm] Submit failed:', err)
      alert(`Submission failed: ${err?.message ?? 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleContainerClick = (e: React.MouseEvent) => {
    // Prevent any container clicks from interfering with form
    e.stopPropagation()
  }

  const handleInputFocus = (e: React.FocusEvent) => {
    // Ensure input stays focused and prevent event bubbling
    e.stopPropagation()
  }

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#9aa6b2' }}>Loading...</div>
  }

  return (
    <div onClick={handleContainerClick} style={{ position: 'relative', zIndex: 10060 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Display user info from Firebase */}
        <label style={{ fontSize: 12, color: '#9aa6b2' }}>Name</label>
        <input value={profile?.displayName || ''} readOnly style={inputStyle} />

        <label style={{ fontSize: 12, color: '#9aa6b2' }}>Campus</label>
        <input value={profile?.campus || ''} readOnly style={inputStyle} />

        {profile?.house && (
          <>
            <label style={{ fontSize: 12, color: '#9aa6b2' }}>House</label>
            <input value={profile.house} readOnly style={inputStyle} />
          </>
        )}

        {/* Category dropdown */}
        <label style={{ fontSize: 12, color: '#9aa6b2' }}>Category</label>
        <select 
          value={category} 
          onChange={e => setCategory(e.target.value)} 
          onFocus={handleInputFocus}
          style={inputStyle}
        >
          <option>Academic</option>
          <option>Culture</option>
          <option>Overall</option>
        </select>

        {/* Input fields for writing */}
        <label style={{ fontSize: 12, color: '#9aa6b2' }}>Achievement Title</label>
        <input 
          ref={headingInputRef} 
          value={heading} 
          onChange={e => setHeading(e.target.value)} 
          onFocus={handleInputFocus}
          placeholder="Share your achievement..." 
          style={focusableInputStyle} 
          required
        />

        <label style={{ fontSize: 12, color: '#9aa6b2' }}>Tell us about it</label>
        <textarea 
          value={testimonial} 
          onChange={e => setTestimonial(e.target.value)} 
          onFocus={handleInputFocus}
          rows={4} 
          placeholder="Describe your achievement and what it means to you..." 
          style={focusableTextareaStyle}
          required
        />

        {/* Photo upload */}
        <label style={{ fontSize: 12, color: '#9aa6b2' }}>Photo (optional)</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={onFile} 
          onFocus={handleInputFocus}
          style={fileInputStyle}
        />
        {fileError && <div style={{ color: '#ff0058', fontSize: 13, marginTop: 4 }}>{fileError}</div>}
        {preview && <img src={preview} alt="preview" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }} />}

        {/* Submit button with loading */}
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button type="submit" disabled={submitting || !heading.trim() || !testimonial.trim()} style={primaryButtonStyle}>
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={loadingSpinnerStyle}></div>
                Submitting...
              </span>
            ) : (
              'Submit'
            )}
          </button>
          <button type="button" onClick={() => onClose && onClose()} style={secondaryButtonStyle}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.06)',
  background: '#07101a',
  color: '#fff'
}

const focusableInputStyle: React.CSSProperties = {
  ...inputStyle,
  position: 'relative',
  zIndex: 10070,
  outline: 'none',
  transition: 'border-color 0.2s ease'
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 100,
  resize: 'vertical'
}

const focusableTextareaStyle: React.CSSProperties = {
  ...textareaStyle,
  position: 'relative',
  zIndex: 10070,
  outline: 'none',
  transition: 'border-color 0.2s ease'
}

const fileInputStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.06)',
  background: '#07101a',
  color: '#fff',
  position: 'relative',
  zIndex: 10070
}

const primaryButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: 8,
  border: 'none',
  background: '#00e6d2',
  color: '#042028',
  fontWeight: 700,
  cursor: 'pointer'
}

const secondaryButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'transparent',
  color: '#9aa6b2',
  cursor: 'pointer'
}

const loadingSpinnerStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  border: '2px solid #042028',
  borderTop: '2px solid transparent',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
}

export default MinimalWinnerForm
