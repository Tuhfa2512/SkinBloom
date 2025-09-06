import Profile from "../models/Profile.js";

export async function upsertProfile(req, res) {
    console.log("Creating/updating profile for user:", req.user.id);
    console.log("Profile data:", req.body);

    try {
        const {
            skinType,
            age,
            gender,
            allergies,
            concerns,
            skinGoals,
            consultationPhotos,
            dermatologistRecommended,
            notes,
            photo,
            qualification,
        } = req.body;

        // Validate required fields based on user role
        let profileData;

        if (req.user.role === "dermatologist") {
            // For dermatologists: only age, gender, and qualification are required
            if (!age || !gender) {
                return res.status(400).json({
                    error: "Age and gender are required for dermatologist profile",
                });
            }

            // Create simplified dermatologist profile
            profileData = {
                userId: req.user.id,
                skinType: "normal", // Default for dermatologists
                age: parseInt(age),
                gender: gender,
                allergies: [], // Not used for dermatologists
                concerns: [], // Not used for dermatologists
                skinGoals: [], // Not used for dermatologists
                dermatologistRecommended: false,
                notes: notes || "",
                photo: photo || "",
                qualification: qualification || "",
            };
        } else {
            // For regular users: skinType, age, and gender are required
            if (!skinType || !age || !gender) {
                return res.status(400).json({
                    error: "Skin type, age, and gender are required",
                });
            }

            // Create full user profile
            profileData = {
                userId: req.user.id,
                skinType: skinType,
                age: parseInt(age),
                gender: gender,
                allergies: Array.isArray(allergies) ? allergies : [],
                concerns: Array.isArray(concerns) ? concerns : [],
                skinGoals: Array.isArray(skinGoals) ? skinGoals : [],
                dermatologistRecommended: Boolean(dermatologistRecommended),
                notes: notes || "",
                photo: photo || "",
                qualification: qualification || "",
            };
        }

        // Handle consultationPhotos
        if (consultationPhotos && Array.isArray(consultationPhotos)) {
            profileData.consultationPhotos = consultationPhotos.map((photo) => {
                if (typeof photo === "object" && photo !== null) {
                    return {
                        url: String(photo.url || ""),
                        uploadDate: photo.uploadDate
                            ? new Date(photo.uploadDate)
                            : new Date(),
                        concerns: Array.isArray(photo.concerns)
                            ? photo.concerns
                            : [],
                        notes: String(photo.notes || ""),
                    };
                }
                return {
                    url: "",
                    uploadDate: new Date(),
                    concerns: [],
                    notes: "",
                };
            });
        } else {
            profileData.consultationPhotos = [];
        }

        console.log("Final profile data to save:", profileData);

        // Use findOneAndUpdate with upsert
        const savedProfile = await Profile.findOneAndUpdate(
            { userId: req.user.id },
            profileData,
            {
                upsert: true,
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        res.json({
            message: "Profile saved successfully",
            profile: savedProfile,
        });
    } catch (e) {
        console.error("Profile error:", e);
        res.status(500).json({ error: e.message });
    }
}

export async function getMyProfile(req, res) {
    try {
        const profile = await Profile.findOne({ userId: req.user.id }).populate(
            "userId",
            "name email role specialization yearsOfExperience medicalLicense bio consultationFee availability"
        );
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        // Include user dermatologist info if applicable
        const response = { profile };
        if (profile.userId.role === "dermatologist") {
            response.dermatologistInfo = {
                specialization: profile.userId.specialization,
                yearsOfExperience: profile.userId.yearsOfExperience,
                medicalLicense: profile.userId.medicalLicense,
                bio: profile.userId.bio,
                consultationFee: profile.userId.consultationFee,
                availability: profile.userId.availability,
            };
        }

        res.json(response);
    } catch (e) {
        console.error("Get profile error:", e);
        res.status(500).json({ error: e.message });
    }
}
