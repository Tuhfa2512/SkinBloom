import Ticket from "../models/Ticket.js";
import Consultation from "../models/Consultation.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Profile from "../models/Profile.js";
import Booking from "../models/Booking.js";
import Stripe from "stripe";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import Activity from "../models/Activity.js";

// Lazy load Stripe client
let stripeClient;
function getStripeClient() {
    if (!stripeClient) {
        stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripeClient;
}

// Notification helper function
async function createNotification(
    recipient,
    type,
    title,
    message,
    additionalData = {}
) {
    try {
        await Notification.create({
            recipient,
            type,
            title,
            message,
            ...additionalData,
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}

// Submit a new consultation request
export async function createTicket(req, res) {
    try {
        const {
            concern,
            skinType,
            symptoms,
            duration,
            previousTreatments,
            allergies,
            photos,
            consultationType,
            preferredDermatologist,
            preferredSlot,
            createBooking,
        } = req.body;

        // Validate required fields
        if (!concern || !photos || photos.length === 0) {
            return res.status(400).json({
                error: "Concern description and at least one photo are required",
            });
        }

        // Create the ticket
        const ticket = await Ticket.create({
            user: req.user.id,
            concern,
            skinType,
            symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
            duration,
            previousTreatments,
            allergies,
            photos: photos.map((photo) => ({
                url: photo.url,
                description: photo.description || "",
            })),
            status: "submitted",
            consultationType: consultationType || "photo_review",
            preferredDermatologist: preferredDermatologist || null,
        });

        // Populate user info
        await ticket.populate("user", "name email");

        // Optional: create a booking directly if requested and dermatologist + slot info present
        let booking = null;
        if (createBooking && preferredDermatologist) {
            try {
                // If slot info is provided (for follow_up maybe) parse it
                let scheduledDateTime = new Date();
                if (preferredSlot) {
                    // expected format date- time separated by '-' or stored id pattern
                    if (
                        typeof preferredSlot === "string" &&
                        preferredSlot.includes("-")
                    ) {
                        const parts = preferredSlot.split("-");
                        const datePart = parts[0];
                        const timePart = parts[1] || "09:00";
                        scheduledDateTime = new Date(
                            `${datePart}T${timePart}:00`
                        );
                    }
                } else {
                    // default: schedule 24h later
                    scheduledDateTime.setDate(scheduledDateTime.getDate() + 1);
                    scheduledDateTime.setHours(10, 0, 0, 0);
                }

                // Fetch dermatologist for fee logic
                const derm = await User.findById(preferredDermatologist);
                if (derm && derm.role === "dermatologist") {
                    const sessionType = consultationType || "photo_review";
                    const consultationFee =
                        derm.consultationFee?.[sessionType] ||
                        (sessionType === "video_call"
                            ? 100
                            : sessionType === "follow_up"
                            ? 30
                            : 50);

                    booking = await Booking.create({
                        patient: req.user.id,
                        dermatologist: preferredDermatologist,
                        sessionType,
                        scheduledDateTime,
                        consultationFee,
                        patientNotes: concern,
                        ticket: ticket._id,
                    });
                    await booking.populate("patient", "name email");
                    await booking.populate(
                        "dermatologist",
                        "name specialization"
                    );

                    // Notify dermatologist about linked booking
                    await createNotification(
                        preferredDermatologist,
                        "booking_created",
                        "New Booking (From Ticket)",
                        `${
                            booking.patient.name
                        } submitted a consultation request and a booking was created for ${scheduledDateTime.toLocaleString()}`,
                        {
                            booking: booking._id,
                            ticket: ticket._id,
                            sender: req.user.id,
                            actionRequired: false,
                            actionUrl: `/dermatologist/bookings/${booking._id}`,
                            actionText: "View Booking",
                        }
                    );
                }
            } catch (err) {
                console.error("Error auto-creating booking from ticket:", err);
            }
        }

        // Create notification for user
        await createNotification(
            req.user.id,
            "ticket_submitted",
            "Consultation Request Submitted",
            `Your skin concern consultation has been submitted successfully. Ticket ID: ${ticket._id}`,
            {
                ticket: ticket._id,
                booking: booking?._id || null,
                actionRequired: true,
                actionUrl: `/tickets/${ticket._id}`,
                actionText: "View Ticket",
            }
        );

        // Notify available dermatologists only if no specific preferredDermatologist (to reduce noise)
        if (!preferredDermatologist) {
            const dermatologists = await User.find({
                role: "dermatologist",
                isActive: true,
            });
            for (const derm of dermatologists) {
                await createNotification(
                    derm._id,
                    "ticket_submitted",
                    "New Consultation Request",
                    `A new skin concern consultation has been submitted by ${ticket.user.name}`,
                    {
                        ticket: ticket._id,
                        sender: req.user.id,
                        actionRequired: true,
                        actionUrl: `/dermatologist/tickets/${ticket._id}`,
                        actionText: "Review Consultation",
                    }
                );
            }
        } else if (!booking) {
            // If preferred dermatologist but no booking auto-created, still notify them
            await createNotification(
                preferredDermatologist,
                "ticket_submitted",
                "New Consultation Request",
                `${ticket.user.name} submitted a consultation request for you`,
                {
                    ticket: ticket._id,
                    sender: req.user.id,
                    actionRequired: true,
                    actionUrl: `/dermatologist/tickets/${ticket._id}`,
                    actionText: "Review Consultation",
                }
            );
        }

        res.status(201).json({
            success: true,
            ticket,
            booking,
            message: booking
                ? "Consultation request and booking created"
                : "Consultation request submitted successfully",
        });
    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).json({ error: error.message });
    }
}

// List tickets based on user role
export async function listTickets(req, res) {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        let query = {};

        // Build query based on user role
        if (req.user.role === "dermatologist") {
            query = {
                $or: [{ dermatologist: req.user.id }, { status: "submitted" }],
            };
        } else {
            query = { user: req.user.id };
        }

        // Add status filter if provided
        if (status && status !== "all") {
            query.status = status;
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: [
                { path: "user", select: "name email profilePicture" },
                { path: "dermatologist", select: "name email profilePicture" },
                {
                    path: "recommendedProducts.product",
                    select: "name brand price image",
                },
            ],
        };

        const tickets = await Ticket.find(query)
            .populate(options.populate)
            .sort(options.sort)
            .limit(options.limit * options.page)
            .skip((options.page - 1) * options.limit);

        const total = await Ticket.countDocuments(query);

        res.json({
            tickets,
            pagination: {
                page: options.page,
                limit: options.limit,
                total,
                pages: Math.ceil(total / options.limit),
            },
        });
    } catch (error) {
        console.error("Error listing tickets:", error);
        res.status(500).json({ error: error.message });
    }
}

// Get single ticket details
export async function getTicket(req, res) {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate("user", "name email profilePicture")
            .populate(
                "dermatologist",
                "name email profilePicture qualifications"
            )
            .populate(
                "recommendedProducts.product",
                "name brand price image description"
            )
            .populate("messages.sender", "name role");

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        // Check access permissions
        const hasAccess =
            ticket.user._id.toString() === req.user.id ||
            (ticket.dermatologist &&
                ticket.dermatologist._id.toString() === req.user.id) ||
            req.user.role === "dermatologist" ||
            req.user.role === "admin";

        if (!hasAccess) {
            return res.status(403).json({ error: "Access denied" });
        }

        res.json(ticket);
    } catch (error) {
        console.error("Error getting ticket:", error);
        res.status(500).json({ error: error.message });
    }
}

// Assign ticket to dermatologist
export async function assignTicket(req, res) {
    try {
        if (req.user.role !== "dermatologist") {
            return res
                .status(403)
                .json({ error: "Only dermatologists can assign tickets" });
        }

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        if (ticket.dermatologist) {
            return res.status(400).json({ error: "Ticket already assigned" });
        }

        // Assign ticket
        ticket.dermatologist = req.user.id;
        ticket.status = "assigned";
        await ticket.save();

        await ticket.populate("user", "name email");
        await ticket.populate("dermatologist", "name qualifications");

        // Notify user
        await createNotification(
            ticket.user._id,
            "ticket_assigned",
            "Consultation Assigned",
            `Your consultation has been assigned to Dr. ${ticket.dermatologist.name}`,
            {
                ticket: ticket._id,
                sender: req.user.id,
                actionUrl: `/tickets/${ticket._id}`,
                actionText: "View Progress",
            }
        );

        res.json({
            success: true,
            ticket,
            message: "Ticket assigned successfully",
        });
    } catch (error) {
        console.error("Error assigning ticket:", error);
        res.status(500).json({ error: error.message });
    }
}

// Provide consultation and recommendations
export async function provideConsultation(req, res) {
    try {
        if (req.user.role !== "dermatologist") {
            return res.status(403).json({
                error: "Only dermatologists can provide consultations",
            });
        }

        const {
            diagnosis,
            recommendations,
            recommendedProducts,
            followUpRequired,
            followUpDate,
            consultationFee,
        } = req.body;

        // Backward/compat: some clients send 'treatmentPlan' instead of 'recommendations'
        const treatmentPlanText = req.body.treatmentPlan;
        const normalizedRecommendations = recommendations || treatmentPlanText;

        // Normalize recommended products: accept either array of Product objects/ids
        // or array of { product, instructions, priority }
        const normalizedRecommendedProducts = Array.isArray(recommendedProducts)
            ? recommendedProducts.map((item) => {
                  // If already in expected shape
                  if (item && (item.product || item.product === null)) {
                      return {
                          product:
                              item.product?._id || item.product || undefined,
                          instructions: item.instructions || "",
                          priority: item.priority || "recommended",
                      };
                  }
                  // If a raw product object or id is passed
                  return {
                      product: item?._id || item?.id || item,
                      instructions: item?.instructions || "",
                      priority: item?.priority || "recommended",
                  };
              })
            : [];

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        // Check if dermatologist is assigned to this ticket
        if (
            ticket.dermatologist &&
            ticket.dermatologist.toString() !== req.user.id
        ) {
            return res
                .status(403)
                .json({ error: "You are not assigned to this ticket" });
        }

        // Update ticket with consultation
        ticket.diagnosis = diagnosis;
        ticket.recommendations = normalizedRecommendations || "";
        ticket.recommendedProducts = normalizedRecommendedProducts;
        ticket.followUpRequired = followUpRequired || false;
        ticket.followUpDate = followUpDate;
        ticket.consultationFee = consultationFee || 50;
        ticket.status = "answered";
        ticket.answeredBy = req.user.id;
        ticket.answeredAt = new Date();

        if (!ticket.dermatologist) {
            ticket.dermatologist = req.user.id;
        }

        await ticket.save();

        // Create consultation record
        const consultation = await Consultation.create({
            ticket: ticket._id,
            user: ticket.user,
            dermatologist: req.user.id,
            diagnosis,
            recommendations: normalizedRecommendations || "See treatment plan",
            treatmentPlan:
                normalizedRecommendedProducts?.map((item, index) => ({
                    step: index + 1,
                    instruction: item.instructions || "",
                    products: item.product ? [item.product] : [],
                })) || [],
            followUpRequired,
            followUpDate,
            consultationNotes: `Diagnosis: ${diagnosis}\n\nRecommendations: ${
                normalizedRecommendations || ""
            }\n\nTreatment Plan: ${treatmentPlanText || ""}`,
            status: "completed",
            completedAt: new Date(),
        });

        await ticket.populate("user", "name email");
        await ticket.populate("dermatologist", "name qualifications");

        // Ensure recommended product details are available for PDF
        try {
            await ticket.populate(
                "recommendedProducts.product",
                "name brand price"
            );
        } catch (e) {
            console.warn(
                "Populate recommended products failed (non-blocking):",
                e.message
            );
        }

        // Generate consultation PDF (includes product names when populated)
        const pdfUrl = await generateConsultationPDF(ticket);
        consultation.pdfUrl = pdfUrl;
        ticket.consultationPdfUrl = pdfUrl;
        await consultation.save();
        await ticket.save();

        // Log activity for consultation provided
        try {
            await Activity.create({
                type: "consultation_provided",
                dermatologist: req.user.id,
                user: ticket.user,
                ticket: ticket._id,
            });
        } catch (e) {
            console.warn(
                "Activity log (consultation_provided) failed:",
                e.message
            );
        }

        // Notify user
        await createNotification(
            ticket.user._id,
            "consultation_ready",
            "Consultation Ready",
            `Your consultation is complete! Dr. ${ticket.dermatologist.name} has provided diagnosis and recommendations.`,
            {
                ticket: ticket._id,
                consultation: consultation._id,
                sender: req.user.id,
                actionRequired: true,
                actionUrl: `/tickets/${ticket._id}`,
                actionText: "View Consultation",
            }
        );

        res.json({
            success: true,
            ticket,
            consultation,
            message: "Consultation provided successfully",
        });
    } catch (error) {
        console.error("Error providing consultation:", error);
        res.status(500).json({ error: error.message });
    }
}

// Mark consultation as solved
export async function markAsSolved(req, res) {
    try {
        if (req.user.role !== "dermatologist") {
            return res.status(403).json({
                error: "Only dermatologists can mark consultations as solved",
            });
        }

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        if (ticket.dermatologist.toString() !== req.user.id) {
            return res
                .status(403)
                .json({ error: "You are not assigned to this ticket" });
        }

        ticket.status = "solved";
        ticket.solvedAt = new Date();
        await ticket.save();

        await ticket.populate("user", "name email");

        // Notify user about payment requirement
        await createNotification(
            ticket.user._id,
            "payment_required",
            "Payment Required",
            `Your consultation is complete. Please proceed with payment of $${ticket.consultationFee} to download your consultation report.`,
            {
                ticket: ticket._id,
                sender: req.user.id,
                actionRequired: true,
                actionUrl: `/tickets/${ticket._id}/payment`,
                actionText: "Make Payment",
            }
        );

        res.json({
            success: true,
            ticket,
            message:
                "Consultation marked as solved. User notified for payment.",
        });
    } catch (error) {
        console.error("Error marking consultation as solved:", error);
        res.status(500).json({ error: error.message });
    }
}

// Create payment session for consultation
export async function createPaymentSession(req, res) {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate("user", "name email")
            .populate("dermatologist", "name");

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        // Check if user owns this ticket
        if (ticket.user._id.toString() !== req.user.id) {
            return res.status(403).json({ error: "Access denied" });
        }

        if (ticket.status !== "solved") {
            return res
                .status(400)
                .json({ error: "Consultation not yet completed" });
        }

        if (ticket.paymentStatus === "paid") {
            return res.status(400).json({ error: "Payment already completed" });
        }

        // Create Stripe checkout session
        const session = await getStripeClient().checkout.sessions.create({
            payment_method_types: ["card"],
            customer_email: ticket.user.email,
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `Dermatology Consultation - Dr. ${ticket.dermatologist.name}`,
                            description: `Consultation for: ${ticket.concern.substring(
                                0,
                                100
                            )}...`,
                            images:
                                ticket.photos?.length > 0
                                    ? [ticket.photos[0].url]
                                    : [],
                        },
                        unit_amount: Math.round(ticket.consultationFee * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}/tickets/${ticket._id}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/tickets/${ticket._id}/payment/cancel`,
            metadata: {
                ticketId: ticket._id.toString(),
                userId: ticket.user._id.toString(),
                dermatologistId: ticket.dermatologist._id.toString(),
                type: "consultation_payment",
            },
        });

        res.json({
            success: true,
            sessionId: session.id,
            url: session.url,
        });
    } catch (error) {
        console.error("Error creating payment session:", error);
        res.status(500).json({ error: error.message });
    }
}

// Verify consultation payment
export async function verifyPayment(req, res) {
    try {
        const { sessionId } = req.params;
        const session = await getStripeClient().checkout.sessions.retrieve(
            sessionId
        );

        if (!session || session.payment_status !== "paid") {
            return res.status(400).json({ error: "Payment not completed" });
        }

        const ticketId = session.metadata.ticketId;
        const ticket = await Ticket.findById(ticketId)
            .populate("user", "name email")
            .populate("dermatologist", "name email");

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        // Update payment status
        ticket.paymentStatus = "paid";
        ticket.paymentId = session.payment_intent;
        ticket.paymentDate = new Date();
        ticket.status = "paid";
        await ticket.save();

        // Generate payment receipt PDF
        const receiptUrl = await generatePaymentReceiptPDF(ticket, session);
        ticket.paymentReceiptUrl = receiptUrl;
        await ticket.save();

        // Also generate a dermatologist payslip for this ticket payment
        let dermPayslipUrl = null;
        try {
            dermPayslipUrl = await generateDermatologistPayslipPDFFromTicket(
                ticket,
                session
            );
        } catch (e) {
            console.warn(
                "Non-blocking: failed to generate dermatologist payslip for ticket:",
                e?.message || e
            );
        }

        // Notify both user and dermatologist
        await createNotification(
            ticket.user._id,
            "payment_confirmed",
            "Payment Confirmed",
            `Payment of $${ticket.consultationFee} has been confirmed. You can now download your consultation report and payment receipt.`,
            {
                ticket: ticket._id,
                payment: session.payment_intent,
                actionRequired: true,
                actionUrl: `/tickets/${ticket._id}`,
                actionText: "Download Reports",
            }
        );

        await createNotification(
            ticket.dermatologist._id,
            "payment_received",
            "Payment Received",
            `Payment of $${ticket.consultationFee} has been received for consultation with ${ticket.user.name}.`,
            {
                ticket: ticket._id,
                sender: ticket.user._id,
                payment: session.payment_intent,
                actionUrl:
                    dermPayslipUrl || `/dermatologist/tickets/${ticket._id}`,
                actionText: dermPayslipUrl
                    ? "Download Payslip"
                    : "View Consultation",
            }
        );

        res.json({
            success: true,
            ticket,
            paymentDetails: {
                amount: session.amount_total / 100,
                currency: session.currency,
                paymentIntent: session.payment_intent,
            },
            message: "Payment verified successfully",
        });
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ error: error.message });
    }
}

// Generate consultation PDF
async function generateConsultationPDF(ticket) {
    try {
        const doc = new PDFDocument({ margin: 50 });
        const filename = `consultation-${ticket._id}-${Date.now()}.pdf`;
        const filepath = path.join(
            process.cwd(),
            "uploads",
            "consultations",
            filename
        );

        // Ensure directory exists
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Create a promise to wait for PDF generation to complete
        return new Promise((resolve, reject) => {
            // Pipe the PDF to a file
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Handle stream events
            stream.on("error", (error) => {
                console.error("Error writing PDF file:", error);
                reject(error);
            });

            stream.on("finish", () => {
                resolve(`/uploads/consultations/${filename}`);
            });

            // Generate PDF content
            // Header
            doc.fontSize(20).font("Helvetica-Bold");
            doc.text("SkinBloom Dermatology Consultation Report", {
                align: "center",
            });
            doc.moveDown(2);

            // Patient Information
            doc.fontSize(16).font("Helvetica-Bold");
            doc.text("Patient Information", { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(12).font("Helvetica");
            doc.text(`Name: ${ticket.user.name}`);
            doc.text(
                `Consultation Date: ${ticket.answeredAt.toLocaleDateString()}`
            );
            doc.text(`Ticket ID: ${ticket._id}`);
            doc.moveDown();

            // Dermatologist Information
            doc.fontSize(16).font("Helvetica-Bold");
            doc.text("Dermatologist Information", { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(12).font("Helvetica");
            doc.text(`Dr. ${ticket.dermatologist.name}`);
            doc.moveDown();

            // Concern
            doc.fontSize(16).font("Helvetica-Bold");
            doc.text("Chief Concern", { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(12).font("Helvetica");
            doc.text(ticket.concern, { align: "justify" });
            doc.moveDown();

            // Patient Details
            if (ticket.skinType || ticket.symptoms?.length || ticket.duration) {
                doc.fontSize(16).font("Helvetica-Bold");
                doc.text("Patient Details", { underline: true });
                doc.moveDown(0.5);

                doc.fontSize(12).font("Helvetica");
                if (ticket.skinType) {
                    doc.text(`Skin Type: ${ticket.skinType}`);
                }
                if (ticket.symptoms?.length) {
                    doc.text(`Symptoms: ${ticket.symptoms.join(", ")}`);
                }
                if (ticket.duration) {
                    doc.text(`Duration: ${ticket.duration}`);
                }
                if (ticket.previousTreatments) {
                    doc.text(
                        `Previous Treatments: ${ticket.previousTreatments}`
                    );
                }
                if (ticket.allergies) {
                    doc.text(`Known Allergies: ${ticket.allergies}`);
                }
                doc.moveDown();
            }

            // Diagnosis
            doc.fontSize(16).font("Helvetica-Bold");
            doc.text("Diagnosis", { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(12).font("Helvetica");
            doc.text(ticket.diagnosis, { align: "justify" });
            doc.moveDown();

            // Recommendations
            doc.fontSize(16).font("Helvetica-Bold");
            doc.text("Treatment Recommendations", { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(12).font("Helvetica");
            doc.text(ticket.recommendations, { align: "justify" });
            doc.moveDown();

            // Recommended Products
            if (ticket.recommendedProducts?.length) {
                doc.fontSize(16).font("Helvetica-Bold");
                doc.text("Recommended Products", { underline: true });
                doc.moveDown(0.5);

                ticket.recommendedProducts.forEach((item, index) => {
                    doc.fontSize(12).font("Helvetica-Bold");
                    doc.text(
                        `${index + 1}. ${item.product?.name || "Product"}`
                    );
                    doc.fontSize(11).font("Helvetica");
                    if (item.instructions) {
                        doc.text(`   Instructions: ${item.instructions}`);
                    }
                    if (item.priority) {
                        doc.text(`   Priority: ${item.priority}`);
                    }
                    doc.moveDown(0.3);
                });
                doc.moveDown();
            }

            // Follow-up
            if (ticket.followUpRequired) {
                doc.fontSize(16).font("Helvetica-Bold");
                doc.text("Follow-up Instructions", { underline: true });
                doc.moveDown(0.5);

                doc.fontSize(12).font("Helvetica");
                doc.text(`Follow-up required: Yes`);
                if (ticket.followUpDate) {
                    doc.text(
                        `Recommended follow-up date: ${ticket.followUpDate.toLocaleDateString()}`
                    );
                }
                doc.moveDown();
            }

            // Footer
            doc.fontSize(10).font("Helvetica");
            doc.text(
                "This consultation report is confidential and intended solely for the patient named above.",
                {
                    align: "center",
                    y: doc.page.height - 100,
                }
            );

            // Finalize the PDF
            doc.end();
        });
    } catch (error) {
        console.error("Error generating consultation PDF:", error);
        throw error;
    }
}

// Generate payment receipt PDF
async function generatePaymentReceiptPDF(ticket, paymentSession) {
    try {
        const doc = new PDFDocument({ margin: 50 });
        const filename = `payment-receipt-${ticket._id}-${Date.now()}.pdf`;
        const filepath = path.join(
            process.cwd(),
            "uploads",
            "receipts",
            filename
        );

        // Ensure directory exists
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Create a promise to wait for PDF generation to complete
        return new Promise((resolve, reject) => {
            // Pipe the PDF to a file
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Handle stream events
            stream.on("error", (error) => {
                console.error("Error writing payment receipt PDF file:", error);
                reject(error);
            });

            stream.on("finish", () => {
                resolve(`/uploads/receipts/${filename}`);
            });

            // Generate PDF content
            // Header
            doc.fontSize(20).font("Helvetica-Bold");
            doc.text("SkinBloom Payment Receipt", { align: "center" });
            doc.moveDown(2);

            // Receipt Information
            doc.fontSize(16).font("Helvetica-Bold");
            doc.text("Payment Details", { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(12).font("Helvetica");
            doc.text(`Receipt Number: ${paymentSession.payment_intent}`);
            doc.text(
                `Payment Date: ${new Date(
                    paymentSession.created * 1000
                ).toLocaleDateString()}`
            );
            doc.text(
                `Amount Paid: $${(paymentSession.amount_total / 100).toFixed(
                    2
                )} ${paymentSession.currency.toUpperCase()}`
            );
            doc.text(
                `Payment Method: ${paymentSession.payment_method_types[0].toUpperCase()}`
            );
            doc.moveDown();

            // Service Information
            doc.fontSize(16).font("Helvetica-Bold");
            doc.text("Service Information", { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(12).font("Helvetica");
            doc.text(`Service: Dermatology Consultation`);
            doc.text(`Consultation ID: ${ticket._id}`);
            doc.text(`Patient: ${ticket.user.name}`);
            doc.text(`Dermatologist: Dr. ${ticket.dermatologist.name}`);
            doc.moveDown();

            // Footer
            doc.fontSize(10).font("Helvetica");
            doc.text(
                "Thank you for choosing SkinBloom for your skincare consultation needs.",
                {
                    align: "center",
                    y: doc.page.height - 100,
                }
            );

            // Finalize the PDF
            doc.end();
        });
    } catch (error) {
        console.error("Error generating payment receipt PDF:", error);
        throw error;
    }
}

// Add message to ticket
export async function addMessage(req, res) {
    try {
        const { message } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        // Check access permissions
        const hasAccess =
            ticket.user.toString() === req.user.id ||
            (ticket.dermatologist &&
                ticket.dermatologist.toString() === req.user.id) ||
            req.user.role === "admin";

        if (!hasAccess) {
            return res.status(403).json({ error: "Access denied" });
        }

        ticket.messages.push({
            sender: req.user.id,
            message,
            timestamp: new Date(),
        });

        await ticket.save();
        await ticket.populate("messages.sender", "name role");

        // Log reply activity for dermatologists
        try {
            if (req.user.role === "dermatologist") {
                await Activity.create({
                    type: "reply",
                    dermatologist: req.user.id,
                    user: ticket.user,
                    ticket: ticket._id,
                    meta: { length: message?.length || 0 },
                });
            }
        } catch (e) {
            console.warn("Activity log (reply) failed:", e.message);
        }

        res.json({
            success: true,
            message: ticket.messages[ticket.messages.length - 1],
        });
    } catch (error) {
        console.error("Error adding message:", error);
        res.status(500).json({ error: error.message });
    }
}

// Legacy function for backward compatibility
export async function answerTicket(req, res) {
    // Redirect to the new provideConsultation function
    return provideConsultation(req, res);
}

// Get user's tickets specifically
export async function getUserTickets(req, res) {
    try {
        const tickets = await Ticket.find({ user: req.user.id })
            .populate("user", "name email")
            .populate("dermatologist", "name")
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        console.error("Error getting user tickets:", error);
        res.status(500).json({ error: error.message });
    }
}

// Get single ticket by ID
export async function getTicketById(req, res) {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate("user", "name email")
            .populate("dermatologist", "name")
            .populate("recommendedProducts.product", "name brand price image");

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        // Check if user owns this ticket or is a dermatologist
        if (
            ticket.user._id.toString() !== req.user.id &&
            req.user.role !== "dermatologist"
        ) {
            return res.status(403).json({ error: "Access denied" });
        }

        res.json(ticket);
    } catch (error) {
        console.error("Error getting ticket:", error);
        res.status(500).json({ error: error.message });
    }
}

// Get dermatologist tickets
export async function getDermatologistTickets(req, res) {
    try {
        // Build query: Dermatologist sees tickets assigned to them OR unassigned newly submitted ones
        // Admin sees everything.
        const baseQuery = {};
        if (req.user.role !== "admin") {
            baseQuery.$or = [
                { dermatologist: req.user.id },
                { dermatologist: { $exists: false } },
                { dermatologist: null },
            ];
        }

        // Fetch tickets with minimal user info first
        const tickets = await Ticket.find(baseQuery)
            .populate("user", "name role")
            .populate("dermatologist", "name role")
            .sort({ priority: -1, createdAt: -1 });

        // Collect userIds for profile enrichment
        const userIds = tickets.map((t) => t.user?._id).filter(Boolean);
        const profiles = await Profile.find({
            userId: { $in: userIds },
        }).select("userId age gender photo");
        const profileMap = new Map(
            profiles.map((p) => [p.userId.toString(), p])
        );

        // Map backend statuses to simplified front-end statuses the dashboard expects
        const statusMap = {
            submitted: "pending",
            assigned: "assigned",
            in_review: "in-consultation",
            answered: "consultation-provided",
            solved: "resolved",
            paid: "paid",
            closed: "closed",
        };

        const sanitized = tickets.map((t) => {
            const profile = t.user
                ? profileMap.get(t.user._id.toString())
                : null;
            return {
                _id: t._id,
                concern: t.concern,
                symptoms: t.symptoms || [],
                status: statusMap[t.status] || t.status,
                rawStatus: t.status,
                priority: t.priority,
                paymentStatus: t.paymentStatus, // pending | paid | refunded
                isPaid: t.paymentStatus === "paid",
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
                user: t.user
                    ? {
                          _id: t.user._id,
                          name: t.user.name,
                          role: t.user.role,
                          profile: profile
                              ? {
                                    age: profile.age,
                                    gender: profile.gender,
                                    photo: profile.photo,
                                    concerns: profile.concerns,
                                    qualification: profile.qualification,
                                }
                              : null,
                      }
                    : null,
                dermatologist: t.dermatologist
                    ? {
                          _id: t.dermatologist._id,
                          name: t.dermatologist.name,
                          role: t.dermatologist.role,
                      }
                    : null,
                photos: (t.photos || []).map((p) => p.url),
                diagnosis: t.diagnosis,
                recommendations: t.recommendations,
                recommendedProducts: (t.recommendedProducts || []).map(
                    (rp) => ({
                        product: rp.product,
                        instructions: rp.instructions,
                        priority: rp.priority,
                    })
                ),
            };
        });

        res.json({
            tickets: sanitized,
            meta: {
                counts: {
                    pending: sanitized.filter((t) => t.status === "pending")
                        .length,
                    assigned: sanitized.filter((t) => t.status === "assigned")
                        .length,
                    inConsultation: sanitized.filter(
                        (t) => t.status === "in-consultation"
                    ).length,
                    provided: sanitized.filter(
                        (t) => t.status === "consultation-provided"
                    ).length,
                    resolved: sanitized.filter((t) => t.status === "resolved")
                        .length,
                    paid: sanitized.filter((t) => t.status === "paid").length,
                },
                total: sanitized.length,
            },
        });
    } catch (error) {
        console.error("Error getting dermatologist tickets:", error);
        res.status(500).json({ error: error.message });
    }
}

// Process payment alias
export async function processPayment(req, res) {
    return createPaymentSession(req, res);
}

// Mark as resolved alias
export async function markAsResolved(req, res) {
    return markAsSolved(req, res);
}

// PDF Generation endpoint functions
export async function downloadConsultationPDF(req, res) {
    try {
        let ticket = await Ticket.findById(req.params.id)
            .populate("user", "name email")
            .populate("dermatologist", "name")
            .populate("recommendedProducts.product", "name brand price");

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }
        if (!ticket.diagnosis || !ticket.recommendations) {
            return res.status(404).json({
                error: "No consultation found - ticket not yet answered by dermatologist",
            });
        }

        // Check access
        const isOwner = ticket.user._id.toString() === req.user.id;
        const isDerm = req.user.role === "dermatologist";
        if (!isOwner && !isDerm) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Always (re)generate the PDF to ensure latest names/details are included
        let relPath;
        try {
            relPath = await generateConsultationPDF(ticket);
            ticket.consultationPdfUrl = relPath;
            await ticket.save();
        } catch (e) {
            console.error("Error generating consultation PDF on download:", e);
            return res.status(500).json({ error: "Failed to generate PDF" });
        }

        const absolutePath = path.join(
            process.cwd(),
            relPath.replace(/^\//, "")
        );

        // Check if file exists
        if (!fs.existsSync(absolutePath)) {
            console.error("PDF file not found:", absolutePath);
            return res.status(404).json({ error: "PDF file not found" });
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=consultation-${ticket._id}.pdf`
        );

        // Create read stream and handle errors properly
        const stream = fs.createReadStream(absolutePath);

        stream.on("error", (e) => {
            console.error("Error streaming consultation PDF:", e);
            if (!res.headersSent) {
                return res.status(500).json({ error: "Failed to stream PDF" });
            }
        });

        stream.pipe(res);
    } catch (error) {
        console.error("Error generating consultation PDF:", error);
        res.status(500).json({ error: error.message });
    }
}

export async function downloadPaymentReceiptPDF(req, res) {
    try {
        const ticket = await Ticket.findById(req.params.id).populate(
            "user",
            "name email"
        );

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }
        if (ticket.paymentStatus !== "paid") {
            return res.status(404).json({ error: "Payment not completed" });
        }

        // Check access
        if (ticket.user._id.toString() !== req.user.id) {
            return res.status(403).json({ error: "Access denied" });
        }

        const doc = new PDFDocument();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=receipt-${ticket._id}.pdf`
        );

        doc.pipe(res);

        // PDF Header
        doc.fontSize(20).text("Payment Receipt", { align: "center" });
        doc.moveDown();

        // Payment Information
        doc.fontSize(14).text("Payment Details:", { underline: true });
        doc.fontSize(12);
        doc.text(`Receipt ID: ${ticket._id}`);
        doc.text(`Patient: ${ticket.user.name}`);
        doc.text(`Email: ${ticket.user.email}`);
        doc.text(`Service: Dermatology Consultation`);
        doc.text(`Amount: $50.00`);
        doc.text(
            `Payment Date: ${new Date(ticket.paymentDate).toLocaleDateString()}`
        );
        doc.text(`Payment Status: Completed`);
        doc.moveDown();

        // Service Details
        doc.fontSize(14).text("Service Details:", { underline: true });
        doc.fontSize(12);
        doc.text(
            `Consultation Date: ${new Date(
                ticket.createdAt
            ).toLocaleDateString()}`
        );
        doc.text(`Consultation Type: ${ticket.urgency} Priority`);
        doc.text(`Skin Type Assessment: ${ticket.skinType || "Not specified"}`);

        doc.end();
    } catch (error) {
        console.error("Error generating payment receipt PDF:", error);
        res.status(500).json({ error: error.message });
    }
}

// Generate dermatologist payslip PDF for a ticket payment
async function generateDermatologistPayslipPDFFromTicket(ticket, session) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const filename = `payslip-ticket-${ticket._id}-${Date.now()}.pdf`;
            const filepath = path.join(
                process.cwd(),
                "uploads",
                "payslips",
                filename
            );

            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Header
            doc.fontSize(20).font("Helvetica-Bold");
            doc.text("SkinBloom Dermatologist Payslip", { align: "center" });
            doc.moveDown(2);

            // Details
            doc.fontSize(16).font("Helvetica-Bold");
            doc.text("Payment Details", { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12).font("Helvetica");
            doc.text(`Payslip ID: ${session.payment_intent}`);
            if (session.created) {
                doc.text(
                    `Payment Date: ${new Date(
                        session.created * 1000
                    ).toLocaleString()}`
                );
            }
            doc.text(
                `Amount Received: $${(
                    (session.amount_total || 0) / 100
                ).toFixed(2)} ${String(
                    session.currency || "usd"
                ).toUpperCase()}`
            );
            if (
                Array.isArray(session.payment_method_types) &&
                session.payment_method_types[0]
            ) {
                doc.text(
                    `Payment Method: ${session.payment_method_types[0].toUpperCase()}`
                );
            }
            doc.moveDown();

            // Ticket/Consultation info
            doc.fontSize(16).font("Helvetica-Bold");
            doc.text("Consultation Details", { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12).font("Helvetica");
            doc.text(`Ticket ID: ${ticket._id}`);
            doc.text(`Dermatologist: Dr. ${ticket.dermatologist?.name || ""}`);
            doc.text(`Patient: ${ticket.user?.name || ""}`);
            doc.text(
                `Consultation Fee: $${Number(
                    ticket.consultationFee || 0
                ).toFixed(2)}`
            );
            if (ticket.answeredAt) {
                doc.text(
                    `Consultation Provided: ${new Date(
                        ticket.answeredAt
                    ).toLocaleString()}`
                );
            }
            doc.moveDown();

            // Footer
            doc.fontSize(10).font("Helvetica");
            doc.text("This payslip is generated for dermatologist records.", {
                align: "center",
                y: doc.page.height - 100,
            });

            doc.end();
            stream.on("finish", () => resolve(`/uploads/payslips/${filename}`));
            stream.on("error", (err) => reject(err));
        } catch (err) {
            reject(err);
        }
    });
}
