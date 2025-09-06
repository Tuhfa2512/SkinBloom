import React, { useState, useEffect, useRef } from 'react'
import API from '../auth.js'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, isAuthenticated } = useAuth()
  const [form, setForm] = useState({
    skinType: '',
    age: '',
    gender: '',
    allergies: [],
    concerns: [],
    skinGoals: [],
    dermatologistRecommended: false,
    notes: '',
    photo: '',
  consultationPhotos: [],
  qualification: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingConsultationPhoto, setUploadingConsultationPhoto] = useState(false)
  const [msg, setMsg] = useState('')
  const fileInputRef = useRef()
  const consultationFileInputRef = useRef()

  // New states for consultation photo upload
  const [newConsultationPhoto, setNewConsultationPhoto] = useState({
    concerns: [],
    notes: ''
  })

  // New states for adding items
  const [newAllergy, setNewAllergy] = useState('')

  // Options
  const skinTypes = [
    { value: 'oily', label: 'Oily - Shiny, enlarged pores, frequent breakouts' },
    { value: 'dry', label: 'Dry - Tight, flaky, rough texture' },
    { value: 'combination', label: 'Combination - Oily T-zone, dry cheeks' },
    { value: 'sensitive', label: 'Sensitive - Easily irritated, reactive' },
    { value: 'normal', label: 'Normal - Balanced, few imperfections' }
  ]

  const concernOptions = [
    'acne', 'wrinkles', 'dark-spots', 'dryness', 'oiliness', 
    'sensitivity', 'large-pores', 'uneven-tone', 'redness', 'blackheads'
  ]

  const goalOptions = [
    'clear-skin', 'anti-aging', 'hydration', 'brightening', 
    'oil-control', 'sensitive-care'
  ]

  // Load profile on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadProfile()
    }
  }, [isAuthenticated])

  async function loadProfile() {
    try {
      setLoading(true)
      const { data } = await API.get('/profile/me')
      if (data?.profile) {
        const profile = data.profile
        setForm({
          skinType: profile.skinType || '',
          age: profile.age || '',
          gender: profile.gender || '',
          allergies: Array.isArray(profile.allergies) ? profile.allergies : [],
          concerns: Array.isArray(profile.concerns) ? profile.concerns : [],
          skinGoals: Array.isArray(profile.skinGoals) ? profile.skinGoals : [],
          dermatologistRecommended: profile.dermatologistRecommended || false,
          notes: profile.notes || '',
          photo: profile.photo || '',
          consultationPhotos: Array.isArray(profile.consultationPhotos) ? profile.consultationPhotos : [],
          qualification: profile.qualification || ''
        })
      }
    } catch (error) {
      console.log('No existing profile found or error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  function set(k, v) { 
    setForm({...form, [k]: v}) 
  }

  function toggleArrayItem(field, value) {
    const current = form[field] || []
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value]
    set(field, updated)
  }

  // Helper functions
  function addAllergy() {
    if (newAllergy.trim() && !form.allergies.includes(newAllergy.trim())) {
      set('allergies', [...form.allergies, newAllergy.trim()])
      setNewAllergy('')
    }
  }

  function removeAllergy(allergy) {
    set('allergies', form.allergies.filter(item => item !== allergy))
  }

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) {
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMsg('Please select an image file')
      setTimeout(() => setMsg(''), 3000)
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMsg('Image must be smaller than 5MB')
      setTimeout(() => setMsg(''), 3000)
      return
    }

    // Show immediate preview using local file URL
    const localImageUrl = URL.createObjectURL(file)
    set('photo', localImageUrl)
    console.log('Showing preview:', localImageUrl)

    setUploadingPhoto(true)
    
    try {
      const formData = new FormData()
      formData.append('photo', file)
      
      console.log('Uploading file:', file.name, 'Size:', file.size)
      
      const { data } = await API.post('/upload/profile-photo', formData, {
        timeout: 30000 // 30 second timeout for uploads
      })
      
      console.log('Upload response:', data)
      
      // Update the form with the server photo URL
      set('photo', data.photoUrl)
      setMsg('Photo uploaded successfully!')
      setTimeout(() => setMsg(''), 3000)
      
      // Clean up the local object URL
      URL.revokeObjectURL(localImageUrl)
    } catch (error) {
      console.error('Upload error:', error)
      console.error('Error response:', error?.response?.data)
      console.error('Error status:', error?.response?.status)
      
      if (error?.response?.status === 401) {
        setMsg('Please log in to upload photos')
      } else if (error?.response?.data?.message) {
        setMsg(error.response.data.message)
      } else if (error?.message) {
        setMsg(`Upload failed: ${error.message}`)
      } else {
        setMsg('Error uploading photo. Please try again.')
      }
      
      setTimeout(() => setMsg(''), 5000)
      // Revert to previous state on error
      set('photo', '')
      URL.revokeObjectURL(localImageUrl)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleConsultationPhotoUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMsg('Please select an image file')
      setTimeout(() => setMsg(''), 3000)
      return
    }

    // Validate file size (10MB max for consultation photos)
    if (file.size > 10 * 1024 * 1024) {
      setMsg('Image must be smaller than 10MB')
      setTimeout(() => setMsg(''), 3000)
      return
    }

    // Check if concerns are selected
    if (newConsultationPhoto.concerns.length === 0) {
      setMsg('Please select at least one concern for this consultation photo')
      setTimeout(() => setMsg(''), 3000)
      return
    }

    console.log('Starting upload for concerns:', newConsultationPhoto.concerns)
    setUploadingConsultationPhoto(true)
    
    try {
      const formData = new FormData()
      formData.append('photo', file)
      
      console.log('Uploading consultation photo:', file.name)
      console.log('FormData created with photo field')

      // Check if we have a valid token
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found. Please log in again.')
      }
      console.log('Auth token found:', token.substring(0, 20) + '...')
      
      const { data } = await API.post('/upload/skin-photo', formData, {
        timeout: 30000 // 30 second timeout for uploads
      })
      
      console.log('Consultation photo upload response:', data)
      
      // Add to consultation photos array
      const newPhoto = {
        url: data.photoUrl,
        uploadDate: new Date(),
        concerns: [...newConsultationPhoto.concerns],
        notes: newConsultationPhoto.notes
      }
      
      set('consultationPhotos', [...form.consultationPhotos, newPhoto])
      
      // Reset the consultation photo form
      setNewConsultationPhoto({ concerns: [], notes: '' })
      
      setMsg('Consultation photo uploaded successfully!')
      setTimeout(() => setMsg(''), 3000)
      
    } catch (error) {
      console.error('Consultation photo upload error:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      })
      
      if (error?.response?.status === 401) {
        setMsg('Authentication failed. Please log in again.')
      } else if (error?.response?.status === 400) {
        setMsg(error.response.data.message || 'Invalid upload request')
      } else if (error?.response?.data?.message) {
        setMsg(error.response.data.message)
      } else if (error?.message) {
        setMsg(`Upload failed: ${error.message}`)
      } else {
        setMsg('Error uploading consultation photo. Please try again.')
      }
      
      setTimeout(() => setMsg(''), 5000)
    } finally {
      setUploadingConsultationPhoto(false)
      // Reset file input
      if (consultationFileInputRef.current) {
        consultationFileInputRef.current.value = ''
      }
    }
  }

  function removeConsultationPhoto(index) {
    const updated = form.consultationPhotos.filter((_, i) => i !== index)
    set('consultationPhotos', updated)
  }

  function toggleConsultationConcern(concern) {
    const current = newConsultationPhoto.concerns
    const updated = current.includes(concern)
      ? current.filter(c => c !== concern)
      : [...current, concern]
    setNewConsultationPhoto({...newConsultationPhoto, concerns: updated})
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      setSaving(true)
      setMsg('')
      
      let cleanedForm;
      
      if (user?.role === 'dermatologist') {
        // Dermatologist validation
        if (!form.age || !form.gender || !form.qualification) {
          setMsg('Please fill in all required fields (age, gender, qualification)')
          setTimeout(() => setMsg(''), 5000)
          return
        }
        
        if (form.age < 18 || form.age > 100) {
          setMsg('Age must be between 18 and 100')
          setTimeout(() => setMsg(''), 5000)
          return
        }
        
        // Send only dermatologist-relevant data
        cleanedForm = {
          age: parseInt(form.age),
          gender: form.gender,
          qualification: form.qualification || '',
          photo: form.photo || '',
          notes: form.notes || ''
        }
      } else {
        // Regular user validation
        if (!form.skinType || !form.age || !form.gender) {
          setMsg('Please fill in all required fields (skin type, age, gender)')
          setTimeout(() => setMsg(''), 5000)
          return
        }

        if (form.age < 13 || form.age > 100) {
          setMsg('Age must be between 13 and 100')
          setTimeout(() => setMsg(''), 5000)
          return
        }
        
        // Send full user profile data
        cleanedForm = {
          skinType: form.skinType,
          age: parseInt(form.age),
          gender: form.gender,
          allergies: Array.isArray(form.allergies) ? form.allergies.filter(a => typeof a === 'string') : [],
          concerns: Array.isArray(form.concerns) ? form.concerns.filter(c => typeof c === 'string') : [],
          skinGoals: Array.isArray(form.skinGoals) ? form.skinGoals.filter(g => typeof g === 'string') : [],
          consultationPhotos: Array.isArray(form.consultationPhotos) ? form.consultationPhotos.map(p => ({
            url: p?.url || '',
            uploadDate: p?.uploadDate || new Date(),
            concerns: Array.isArray(p?.concerns) ? p.concerns : [],
            notes: p?.notes || ''
          })) : [],
          dermatologistRecommended: Boolean(form.dermatologistRecommended),
          notes: form.notes || '',
          photo: form.photo || '',
          qualification: form.qualification || ''
        }
      }
      
      console.log('Submitting cleaned profile:', cleanedForm)
      
      const { data } = await API.post('/profile/me', cleanedForm)
      
      setMsg('Profile saved successfully! ✅')
      setTimeout(() => setMsg(''), 3000)
      
    } catch (error) {
      console.error('Save error:', error)
      setMsg(error?.response?.data?.error || 'Failed to save profile')
      setTimeout(() => setMsg(''), 5000)
    } finally {
      setSaving(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Please log in to access your profile</h2>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Loading profile...</h2>
      </div>
    )
  }

  // Dermatologist simplified profile view
  if (user?.role === 'dermatologist') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Dermatologist Profile</h1>
        {msg && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: msg.includes('success') || msg.includes('✅') ? '#d1fae5' : '#fee2e2',
            color: msg.includes('success') || msg.includes('✅') ? '#065f46' : '#991b1b'
          }}>{msg}</div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Photo */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '140px', height: '140px', borderRadius: '50%', margin: '0 auto 16px',
              overflow: 'hidden', border: '4px solid #e5e7eb', background: '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {form.photo ? (
                <img src={form.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : <span style={{ fontSize: '48px' }}>👩‍⚕️</span>}
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()} style={{
              background: '#3b82f6', color: 'white', border: 'none', padding: '10px 18px',
              borderRadius: '6px', cursor: 'pointer', fontWeight: 600
            }}>{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
          </div>

          {/* Basic */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Age *</label>
              <input type="number" value={form.age} min={18} max={100} required onChange={e => set('age', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Gender *</label>
              <select value={form.gender} required onChange={e => set('gender', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Qualification *</label>
            <input type="text" value={form.qualification} required maxLength={150} placeholder="e.g. MBBS, MD (Dermatology)" onChange={e => set('qualification', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{form.qualification.length}/150</div>
          </div>

          <button type="submit" disabled={saving} style={{
            background: saving ? '#9ca3af' : '#10b981', color: 'white', padding: '12px 20px',
            border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer'
          }}>{saving ? 'Saving...' : 'Save Profile'}</button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Personal Skin Profile</h1>

      {msg && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: msg.includes('✅') || msg.includes('successfully') ? '#d4edda' : '#f8d7da',
          color: msg.includes('✅') || msg.includes('successfully') ? '#155724' : '#721c24',
          border: `1px solid ${msg.includes('✅') || msg.includes('successfully') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Photo Upload Section */}
        <div style={{
          border: '2px dashed #ddd',
          borderRadius: '12px',
          padding: '30px',
          textAlign: 'center',
          backgroundColor: '#f9f9f9'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            margin: '0 auto 20px',
            background: form.photo ? 'transparent' : '#eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '3px solid #ddd'
          }}>
            {form.photo ? (
              <img 
                src={form.photo} 
                alt="Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
                onLoad={() => console.log('Image loaded successfully:', form.photo)}
                onError={(e) => {
                  console.error('Image failed to load:', form.photo, e);
                  console.error('Image element:', e.target);
                }}
              />
            ) : (
              <span style={{ fontSize: '48px', color: '#999' }}>👤</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: uploadingPhoto ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              margin: '0 auto'
            }}
          >
            <span style={{fontSize: '20px'}}>
              {uploadingPhoto ? '⏳' : '📷'}
            </span>
            {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            style={{display: 'none'}}
          />

          <p style={{ color: '#666', marginTop: '15px', fontSize: '14px' }}>
            Upload a clear photo of your face for better skin analysis<br/>
            Max size: 5MB • Formats: JPG, PNG, WebP
          </p>
        </div>

        {/* Basic Information */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '20px' }}>Basic Information</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Age *
              </label>
              <input
                type="number"
                min="13"
                max="100"
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Gender *
              </label>
              <select
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        {/* Skin Type */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '20px' }}>Skin Type *</h3>
          
          {skinTypes.map(type => (
            <label key={type.value} style={{
              display: 'block',
              padding: '15px',
              border: `2px solid ${form.skinType === type.value ? '#28a745' : '#ddd'}`,
              borderRadius: '8px',
              marginBottom: '10px',
              cursor: 'pointer',
              backgroundColor: form.skinType === type.value ? '#f0fff4' : 'white'
            }}>
              <input
                type="radio"
                name="skinType"
                value={type.value}
                checked={form.skinType === type.value}
                onChange={(e) => set('skinType', e.target.value)}
                style={{ marginRight: '10px' }}
              />
              <strong style={{ textTransform: 'capitalize' }}>{type.value}</strong>
              <div style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                {type.label.split(' - ')[1]}
              </div>
            </label>
          ))}
        </div>

        {/* Skin Concerns */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '20px' }}>Skin Concerns</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            {concernOptions.map(concern => (
              <label key={concern} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px',
                border: `1px solid ${form.concerns.includes(concern) ? '#28a745' : '#ddd'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: form.concerns.includes(concern) ? '#f0fff4' : 'white'
              }}>
                <input
                  type="checkbox"
                  checked={form.concerns.includes(concern)}
                  onChange={() => toggleArrayItem('concerns', concern)}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ textTransform: 'capitalize' }}>
                  {concern.replace('-', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Skin Goals */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '20px' }}>Skin Goals</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            {goalOptions.map(goal => (
              <label key={goal} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px',
                border: `1px solid ${form.skinGoals.includes(goal) ? '#007bff' : '#ddd'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: form.skinGoals.includes(goal) ? '#e7f3ff' : 'white'
              }}>
                <input
                  type="checkbox"
                  checked={form.skinGoals.includes(goal)}
                  onChange={() => toggleArrayItem('skinGoals', goal)}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ textTransform: 'capitalize' }}>
                  {goal.replace('-', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '20px' }}>Known Allergies</h3>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input
              type="text"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              placeholder="Enter allergy (e.g., fragrance, parabens)"
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
            />
            <button
              type="button"
              onClick={addAllergy}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Add
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {form.allergies.map((allergy, index) => (
              <span key={index} style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '5px 10px',
                borderRadius: '15px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                {allergy}
                <button
                  type="button"
                  onClick={() => removeAllergy(allergy)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#721c24',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '20px' }}>Additional Information</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={form.dermatologistRecommended}
                onChange={(e) => set('dermatologistRecommended', e.target.checked)}
              />
              <span>My current routine was recommended by a dermatologist</span>
            </label>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Additional Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any additional information about your skin, lifestyle, or goals..."
              maxLength={500}
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                resize: 'vertical',
                fontSize: '14px'
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#666', marginTop: '5px' }}>
              {form.notes.length}/500 characters
            </div>
          </div>
        </div>

        {/* Consultation Photos for Dermatologist */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '20px', color: '#2d3748' }}>Photos for Dermatologist Consultation</h3>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
            Upload photos of specific skin concerns you'd like a dermatologist to review. These photos will be kept separate from your profile picture.
          </p>

          {/* Upload New Consultation Photo */}
          <div style={{
            border: '2px dashed #e2a365',
            borderRadius: '12px',
            padding: '25px',
            backgroundColor: '#fffbf5',
            marginBottom: '25px'
          }}>
            <h4 style={{ marginBottom: '15px', color: '#d69e2e' }}>Upload New Consultation Photo</h4>
            
            {/* Select Concerns for this photo */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                What concerns does this photo show? *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                {concernOptions.map(concern => (
                  <label key={concern} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    border: `1px solid ${newConsultationPhoto.concerns.includes(concern) ? '#d69e2e' : '#e2e8f0'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: newConsultationPhoto.concerns.includes(concern) ? '#fffbf5' : 'white',
                    fontSize: '14px'
                  }}>
                    <input
                      type="checkbox"
                      checked={newConsultationPhoto.concerns.includes(concern)}
                      onChange={() => toggleConsultationConcern(concern)}
                      style={{ marginRight: '6px' }}
                    />
                    <span style={{ textTransform: 'capitalize' }}>
                      {concern.replace('-', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes for this photo */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Additional notes about this photo (optional)
              </label>
              <textarea
                value={newConsultationPhoto.notes}
                onChange={(e) => setNewConsultationPhoto({...newConsultationPhoto, notes: e.target.value})}
                placeholder="Describe when this photo was taken, symptoms, timeline, etc..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  resize: 'vertical',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => consultationFileInputRef.current?.click()}
              disabled={uploadingConsultationPhoto || newConsultationPhoto.concerns.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: uploadingConsultationPhoto ? '#ccc' : (newConsultationPhoto.concerns.length === 0 ? '#e2e8f0' : '#d69e2e'),
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                cursor: uploadingConsultationPhoto || newConsultationPhoto.concerns.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              <span style={{fontSize: '18px'}}>
                {uploadingConsultationPhoto ? '⏳' : '📸'}
              </span>
              {uploadingConsultationPhoto ? 'Uploading...' : 'Upload Consultation Photo'}
            </button>

            <input
              ref={consultationFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleConsultationPhotoUpload}
              style={{display: 'none'}}
            />

            <p style={{ color: '#d69e2e', marginTop: '10px', fontSize: '12px' }}>
              Max size: 10MB • Formats: JPG, PNG, WebP • Select concerns first
            </p>
          </div>

          {/* Display Uploaded Consultation Photos */}
          {form.consultationPhotos && form.consultationPhotos.length > 0 && (
            <div>
              <h4 style={{ marginBottom: '15px', color: '#2d3748' }}>
                Uploaded Consultation Photos ({form.consultationPhotos.length})
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                {form.consultationPhotos.map((photo, index) => (
                  <div key={index} style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#f9f9f9'
                  }}>
                    {/* Photo */}
                    <div style={{ position: 'relative' }}>
                      <img
                        src={photo.url}
                        alt={`Consultation photo ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeConsultationPhoto(index)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(220, 53, 69, 0.8)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '30px',
                          height: '30px',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        ×
                      </button>
                    </div>

                    {/* Photo Details */}
                    <div style={{ padding: '15px' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <strong style={{ color: '#2d3748', fontSize: '14px' }}>Concerns:</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '5px' }}>
                          {photo.concerns.map((concern, cIndex) => (
                            <span key={cIndex} style={{
                              backgroundColor: '#fed7d7',
                              color: '#c53030',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              textTransform: 'capitalize'
                            }}>
                              {concern.replace('-', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>

                      {photo.notes && (
                        <div style={{ marginBottom: '10px' }}>
                          <strong style={{ color: '#2d3748', fontSize: '14px' }}>Notes:</strong>
                          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>
                            {photo.notes}
                          </p>
                        </div>
                      )}

                      <div style={{ fontSize: '12px', color: '#999' }}>
                        Uploaded: {new Date(photo.uploadDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          style={{
            backgroundColor: saving ? '#ccc' : '#28a745',
            color: 'white',
            padding: '15px 30px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: saving ? 'not-allowed' : 'pointer',
            width: '100%'
          }}
        >
          {saving ? 'Saving Profile...' : 'Save My Profile'}
        </button>
      </form>
    </div>
  )
}
