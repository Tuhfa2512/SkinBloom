import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ["user", "admin", "dermatologist"],
            default: "user",
            required: true,
        },
        profileCompleted: { type: Boolean, default: false },
        lastLogin: { type: Date },
        isActive: { type: Boolean, default: true },

        // Dermatologist-specific fields
        specialization: { type: String }, // e.g., "Acne Treatment", "Anti-aging", "Skin Cancer"
        yearsOfExperience: { type: Number },
        medicalLicense: { type: String },
        availability: {
            monday: [{ start: String, end: String }],
            tuesday: [{ start: String, end: String }],
            wednesday: [{ start: String, end: String }],
            thursday: [{ start: String, end: String }],
            friday: [{ start: String, end: String }],
            saturday: [{ start: String, end: String }],
            sunday: [{ start: String, end: String }],
        },
        consultationFee: {
            photoReview: { type: Number, default: 50 },
            videoCall: { type: Number, default: 100 },
            followUp: { type: Number, default: 30 },
        },
        rating: {
            average: { type: Number, default: 0 },
            count: { type: Number, default: 0 },
        },
        bio: { type: String, maxlength: 500 },
    },
    { timestamps: true }
);

// Index for efficient role-based queries
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1, role: 1 });

export default mongoose.model("User", UserSchema);
