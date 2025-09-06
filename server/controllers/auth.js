import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Profile from "../models/Profile.js";

export async function register(req, res) {
    try {
        const { name, email, password, role } = req.body;
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ error: "Email in use" });
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashed,
            role: role || "user",
        });
        const token = jwt.sign(
            { id: user._id, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ error: "Invalid credentials" });
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(400).json({ error: "Invalid credentials" });

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

export async function getMe(req, res) {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

export async function updateUserRole(req, res) {
    try {
        const { userId, newRole } = req.body;

        if (!["user", "dermatologist", "admin"].includes(newRole)) {
            return res.status(400).json({ error: "Invalid role" });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role: newRole },
            { new: true }
        ).select("-password");

        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ message: "User role updated successfully", user });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

// Get all active dermatologists
export async function getDermatologists(req, res) {
    try {
        const dermatologists = await User.find({
            role: "dermatologist",
            isActive: true,
        }).select("-password");

        // Get profiles for dermatologists
        const dermatologistIds = dermatologists.map((d) => d._id);
        const profiles = await Profile.find({
            userId: { $in: dermatologistIds },
        });
        const profileMap = new Map(
            profiles.map((p) => [p.userId.toString(), p])
        );

        const enrichedDermatologists = dermatologists.map((derm) => ({
            _id: derm._id,
            name: derm.name,
            email: derm.email,
            role: derm.role,
            specialization: derm.specialization,
            yearsOfExperience: derm.yearsOfExperience,
            consultationFee: derm.consultationFee,
            rating: derm.rating,
            bio: derm.bio,
            availability: derm.availability,
            profile: profileMap.get(derm._id.toString()) || null,
        }));

        res.json({ dermatologists: enrichedDermatologists });
    } catch (error) {
        console.error("Error getting dermatologists:", error);
        res.status(500).json({ error: error.message });
    }
}
