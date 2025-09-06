// import { Router } from 'express';
// import { authRequired } from '../middleware/auth.js';
// import { upsertProfile, getMyProfile } from '../controllers/profile.js';

// const r = Router();

// // Get my profile
// r.get('/', authRequired, getMyProfile);

// // Update or create profile
// r.post('/', authRequired, upsertProfile);

// export default r;

import { Router } from "express";
import { authRequired, dermatologistRequired } from "../middleware/auth.js";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import { upsertProfile, getMyProfile } from "../controllers/profile.js";
import Activity from "../models/Activity.js";

const r = Router();

// user doc (minus password)
r.get("/", authRequired, async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
});

// Note: Do not alias /me to return the user doc here; /me is reserved for full profile details via getMyProfile

// Dermatologist view user profile for consultation
r.get("/user/:userId", dermatologistRequired, async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("Dermatologist profile request for userId:", userId);
        console.log("Requesting user role:", req.user?.role);

        // Get user basic info
        const user = await User.findById(userId).select(
            "name email role createdAt"
        );
        console.log("Found user:", user);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get user's skin profile
        const profile = await Profile.findOne({ userId }).select(
            "photo age gender skinType concerns allergies notes consultationPhotos qualification"
        );
        console.log("Found profile:", profile);

        // Return limited profile info for dermatologist consultation
        const response = {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                memberSince: user.createdAt,
            },
            profile: profile
                ? {
                      photo: profile.photo,
                      age: profile.age,
                      gender: profile.gender,
                      skinType: profile.skinType,
                      concerns: profile.concerns,
                      qualification: profile.qualification,
                      allergies: profile.allergies,
                      notes: profile.notes,
                      consultationPhotos: profile.consultationPhotos,
                  }
                : null,
        };
        console.log("Sending response:", response);
        // Log profile view by dermatologist
        try {
            await Activity.create({
                type: 'profile_view',
                dermatologist: req.user.id,
                user: userId,
            })
        } catch (e) {
            console.warn('Activity log (profile_view) failed:', e.message)
        }
        res.json(response);
    } catch (error) {
        console.error("Error fetching user profile for dermatologist:", error);
        res.status(500).json({ error: error.message });
    }
});

// skin profile
r.get("/me", authRequired, getMyProfile);
r.post("/me", authRequired, upsertProfile);

export default r;
