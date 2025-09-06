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
    currentProducts: [],
    dermatologistRecommended: false,
    notes: '',
    photo: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [msg, setMsg] = useState('')
  const fileInputRef = useRef()

  // New states for adding items
  const [newAllergy, setNewAllergy] = useState('')
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    type: '',
    frequency: ''
  })

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

  const productTypes = [
    'cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 
    'exfoliant', 'mask', 'spot-treatment', 'oil', 'mist'
  ]

  // Load profile on mount
  useEffect(() => {
    loadProfile()
  }, [])

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
          allergies: profile.allergies || [],
          concerns: profile.concerns || [],
          skinGoals: profile.skinGoals || [],
          currentProducts: profile.currentProducts || [],
          dermatologistRecommended: profile.dermatologistRecommended || false,
          notes: profile.notes || '',
          photo: profile.photo || ''
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

  async function handleSubmit(e) {
    e.preventDefault()
    
    // Validate required fields
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

    try {
      setSaving(true)
      setMsg('')
      
      console.log('Submitting profile:', form)
      
      const { data } = await API.post('/profile/me', form)
      
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

  function addProduct() {
    if (newProduct.name.trim() && newProduct.type) {
      set('currentProducts', [...form.currentProducts, { ...newProduct }])
      setNewProduct({ name: '', brand: '', type: '', frequency: '' })
    }
  }

  function removeProduct(index) {
    set('currentProducts', form.currentProducts.filter((_, i) => i !== index))
  }

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

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
        headers: {
          'Content-Type': 'multipart/form-data'
        }
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
        }
      })
      
      console.log('Upload response:', data)
      
      // Update the form with the server photo URL
      setForm({...form, photoUrl: data.photoUrl})
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
      setForm({...form, photoUrl: ''})
      URL.revokeObjectURL(localImageUrl)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      padding: '40px 20px'
    }}>
      <div className="card" style={{padding: 40}}>
        <div style={{textAlign: 'center', marginBottom: 40}}>
          <h2 style={{
            fontSize: '32px',
            marginBottom: '8px',
            color: 'var(--text-color)'
          }}>
            Personal Skin Profile
          </h2>
          <p style={{color: 'var(--text-light)', fontSize: '16px'}}>
            Help us understand your skin better for personalized recommendations
          </p>
        </div>

        {/* Photo Upload Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 40,
          padding: 30,
          background: 'var(--surface)',
          borderRadius: '12px',
          border: '2px dashed var(--border-color)'
        }}>
          <div style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            overflow: 'hidden',
            marginBottom: 20,
            background: form.photoUrl ? 'transparent' : 'var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px solid var(--border-color)'
          }}>
                        {form.photoUrl ? (
              <img 
                src={form.photoUrl} 
                alt="Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
                onLoad={() => console.log('Image loaded successfully:', form.photoUrl)}
                onError={(e) => {
                  console.error('Image failed to load:', form.photoUrl, e);
                  console.error('Image element:', e.target);
                  // You can optionally clear the photoUrl here if the image fails to load
                  // setForm({...form, photoUrl: ''})
                }}
              />
            ) : (
              <div style={{
                fontSize: '48px',
                color: 'var(--text-muted)'
              }}>
                👤
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={triggerFileInput}
            disabled={uploadingPhoto}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: uploadingPhoto ? 'var(--border-color)' : 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
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

          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            marginTop: '12px',
            textAlign: 'center'
          }}>
            Upload a clear photo of your face for better skin analysis<br/>
            <span style={{fontSize: '12px'}}>Max size: 5MB • Formats: JPG, PNG, WebP</span>
          </p>
        </div>

        <form onSubmit={save} style={{display: 'grid', gap: 24}}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 20
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: 'var(--text-color)'
              }}>
                Skin Type *
              </label>
              <select 
                className="input" 
                value={form.skinType||''} 
                onChange={e=>set('skinType',e.target.value)}
                required
                style={{
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 12px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '16px',
                  paddingRight: '40px'
                }}
              >
                <option value=''>Select your skin type</option>
                <option value='oily'>Oily</option>
                <option value='dry'>Dry</option>
                <option value='combination'>Combination</option>
                <option value='sensitive'>Sensitive</option>
                <option value='normal'>Normal</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: 'var(--text-color)'
              }}>
                Age
              </label>
              <input 
                className="input" 
                type='number' 
                placeholder='Enter your age' 
                value={form.age||''} 
                onChange={e=>set('age',Number(e.target.value))}
                min="13"
                max="100"
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: 'var(--text-color)'
              }}>
                Gender
              </label>
              <select 
                className="input" 
                value={form.gender||''} 
                onChange={e=>set('gender',e.target.value)}
                style={{
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 12px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '16px',
                  paddingRight: '40px'
                }}
              >
                <option value=''>Select gender</option>
                <option value='female'>Female</option>
                <option value='male'>Male</option>
                <option value='non-binary'>Non-binary</option>
                <option value='prefer-not-to-say'>Prefer not to say</option>
              </select>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: 'var(--text-color)'
              }}>
                Allergies & Sensitivities
              </label>
              <input 
                className="input" 
                placeholder='e.g., fragrance, sulfates, nuts (separate with commas)' 
                value={(form.allergies||[]).join(', ')} 
                onChange={e=>set('allergies',e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}
              />
              <p style={{fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px'}}>
                List any ingredients or products you're allergic to
              </p>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: 'var(--text-color)'
              }}>
                Skin Concerns
              </label>
              <input 
                className="input" 
                placeholder='e.g., acne, aging, dark spots (separate with commas)' 
                value={(form.concerns||[]).join(', ')} 
                onChange={e=>set('concerns',e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}
              />
              <p style={{fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px'}}>
                What skin issues would you like to address?
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 20,
            paddingTop: 20,
            borderTop: '1px solid var(--border-color)'
          }}>
            <button 
              className="btn" 
              type="submit"
              style={{
                padding: '14px 32px',
                fontSize: '16px'
              }}
            >
              💾 Save Profile
            </button>
            
            {msg && (
              <div style={{ 
                color: msg.includes('Error') ? '#dc2626' : '#059669',
                background: msg.includes('Error') ? '#fef2f2' : '#f0fdf4',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                border: `1px solid ${msg.includes('Error') ? '#fecaca' : '#bbf7d0'}`
              }}>
                {msg}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
