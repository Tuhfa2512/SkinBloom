import Profile from '../models/Profile.js';
import User from '../models/User.js';

// Create or update profile
export const createOrUpdateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            skinType,
            age,
            gender,
            allergies,
            concerns,
            skinGoals,
            currentProducts,
            dermatologistRecommended,
            notes,
            photo
        } = req.body;

        console.log('Creating/updating profile for user:', userId);
        console.log('Profile data:', req.body);

        // Validate required fields
        if (!skinType || !age || !gender) {
            return res.status(400).json({
                message: 'Skin type, age, and gender are required'
            });
        }

        // Check if profile exists
        let profile = await Profile.findOne({ userId });

        if (profile) {
            // Update existing profile
            profile.skinType = skinType;
            profile.age = age;
            profile.gender = gender;
            profile.allergies = allergies || [];
            profile.concerns = concerns || [];
            profile.skinGoals = skinGoals || [];
            profile.currentProducts = currentProducts || [];
            profile.dermatologistRecommended = dermatologistRecommended || false;
            profile.notes = notes || '';
            
            // Only update photo if provided
            if (photo) {
                profile.photo = photo;
            }

            await profile.save();
            console.log('Profile updated successfully');
        } else {
            // Create new profile
            profile = new Profile({
                userId,
                skinType,
                age,
                gender,
                allergies: allergies || [],
                concerns: concerns || [],
                skinGoals: skinGoals || [],
                currentProducts: currentProducts || [],
                dermatologistRecommended: dermatologistRecommended || false,
                notes: notes || '',
                photo: photo || null
            });

            await profile.save();
            console.log('New profile created successfully');
        }

        // Populate user data
        await profile.populate('userId', 'name email');

        res.json({
            message: 'Profile saved successfully',
            profile
        });

    } catch (error) {
        console.error('Profile creation/update error:', error);
        res.status(500).json({
            message: 'Failed to save profile',
            error: error.message
        });
    }
};

// Get user profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const profile = await Profile.findOne({ userId }).populate('userId', 'name email');

        if (!profile) {
            return res.status(404).json({
                message: 'Profile not found'
            });
        }

        res.json({
            profile
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            message: 'Failed to get profile',
            error: error.message
        });
    }
};

// Delete profile
export const deleteProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const profile = await Profile.findOneAndDelete({ userId });

        if (!profile) {
            return res.status(404).json({
                message: 'Profile not found'
            });
        }

        res.json({
            message: 'Profile deleted successfully'
        });

    } catch (error) {
        console.error('Delete profile error:', error);
        res.status(500).json({
            message: 'Failed to delete profile',
            error: error.message
        });
    }
};

// Update profile photo
export const updateProfilePhoto = async (req, res) => {
    try {
        const userId = req.user.id;
        const { photoUrl } = req.body;

        if (!photoUrl) {
            return res.status(400).json({
                message: 'Photo URL is required'
            });
        }

        let profile = await Profile.findOne({ userId });

        if (!profile) {
            return res.status(404).json({
                message: 'Profile not found. Please create a profile first.'
            });
        }

        profile.photo = photoUrl;
        await profile.save();

        res.json({
            message: 'Profile photo updated successfully',
            photoUrl: profile.photo
        });

    } catch (error) {
        console.error('Update photo error:', error);
        res.status(500).json({
            message: 'Failed to update profile photo',
            error: error.message
        });
    }
};
