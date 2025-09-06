import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        dermatologist: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

        // New booking/consultation preferences
        consultationType: {
            type: String,
            enum: ["photo_review", "video_call", "follow_up"],
            default: "photo_review",
        },
        preferredDermatologist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        preferredSlot: String,

        // User's concern details
        concern: { type: String, required: true },
        skinType: String,
        symptoms: [String],
        duration: String,
        previousTreatments: String,
        allergies: String,

        // Photos
        photos: [
            {
                url: String,
                description: String,
                uploadedAt: { type: Date, default: Date.now },
            },
        ],

        // Ticket status and workflow
        status: {
            type: String,
            enum: [
                "submitted",
                "assigned",
                "in_review",
                "answered",
                "solved",
                "paid",
                "closed",
            ],
            default: "submitted",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
        },

        // Dermatologist's response
        diagnosis: String,
        recommendations: String,
        recommendedProducts: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                },
                instructions: String,
                priority: {
                    type: String,
                    enum: ["essential", "recommended", "optional"],
                    default: "recommended",
                },
            },
        ],
        followUpRequired: { type: Boolean, default: false },
        followUpDate: Date,

        // Payment and consultation fee
        consultationFee: { type: Number, default: 50 },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "refunded"],
            default: "pending",
        },
        paymentId: String,
        paymentDate: Date,

        // Communication
        messages: [
            {
                sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                message: String,
                timestamp: { type: Date, default: Date.now },
                isSystemMessage: { type: Boolean, default: false },
            },
        ],

        // PDF generation
        consultationPdfUrl: String,
        paymentReceiptUrl: String,

        // Metadata
        answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        answeredAt: Date,
        solvedAt: Date,
        rating: { type: Number, min: 1, max: 5 },
        feedback: String,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for consultation duration
TicketSchema.virtual("consultationDuration").get(function () {
    if (this.answeredAt && this.createdAt) {
        return Math.ceil((this.answeredAt - this.createdAt) / (1000 * 60 * 60)); // hours
    }
    return null;
});

// Virtual payment status helper
TicketSchema.virtual("isPaid").get(function () {
    return this.paymentStatus === "paid";
});

// Index for efficient queries
TicketSchema.index({ user: 1, status: 1 });
TicketSchema.index({ dermatologist: 1, status: 1 });
TicketSchema.index({ createdAt: -1 });
TicketSchema.index({ paymentStatus: 1, status: 1 });

export default mongoose.model("Ticket", TicketSchema);
