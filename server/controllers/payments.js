// controllers/payments.js
import dotenv from "dotenv";
import Stripe from "stripe";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

dotenv.config(); // Load .env variables

let stripe = null;
if (
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_SECRET_KEY !== "sk_test_dummy_key_for_development"
) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2022-11-15",
    });
} else {
    console.log("Stripe not configured - payments will be disabled");
}

// bKash configuration (Sandbox)
const BKASH_BASE = (process.env.BKASH_SANDBOX === undefined || process.env.BKASH_SANDBOX === "true")
    ? "https://checkout.sandbox.bka.sh/v1.2.0-beta"
    : "https://checkout.pay.bka.sh/v1.2.0-beta";

const isBkashConfigured = () => {
    return Boolean(
        process.env.BKASH_APP_KEY &&
        process.env.BKASH_APP_SECRET &&
        process.env.BKASH_USERNAME &&
        process.env.BKASH_PASSWORD
    );
};

const getBkashToken = async () => {
    const appKey = process.env.BKASH_APP_KEY;
    const appSecret = process.env.BKASH_APP_SECRET;
    const username = process.env.BKASH_USERNAME;
    const password = process.env.BKASH_PASSWORD;
    if (!appKey || !appSecret || !username || !password) {
        throw new Error("bKash credentials are not configured");
    }
    const res = await fetch(`${BKASH_BASE}/checkout/token/grant`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            username,
            password,
        },
        body: JSON.stringify({ app_key: appKey, app_secret: appSecret }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`bKash token error: ${res.status} ${text}`);
    }
    const data = await res.json();
    return { id_token: data.id_token, appKey };
};

export const createBkashPayment = async (req, res) => {
    try {
        if (!isBkashConfigured()) {
            return res.status(400).json({ error: "bKash is not configured on server" });
        }
        const { amount, intent = "sale", invoice, callbackPath = "/payment/success" } = req.body || {};
        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }
        const { id_token, appKey } = await getBkashToken();
        const callbackURL = `${process.env.FRONTEND_URL || "http://localhost:5173"}${callbackPath}`;

        const payload = {
            amount: String(amount),
            currency: "BDT",
            intent,
            merchantInvoiceNumber: invoice || `SB-${Date.now()}`,
            payerReference: req.user?.id || "guest",
            callbackURL,
        };

        const r = await fetch(`${BKASH_BASE}/checkout/payment/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                authorization: id_token,
                "x-app-key": appKey,
            },
            body: JSON.stringify(payload),
        });
        const data = await r.json();
        if (!r.ok || !data.bkashURL) {
            return res.status(400).json({ error: data?.message || "Failed to create bKash payment", data });
        }
        // Return redirect URL and paymentID to client
        return res.json({ url: data.bkashURL, paymentID: data.paymentID });
    } catch (err) {
        console.error("bKash create error:", err);
        res.status(500).json({ error: err.message });
    }
};

export const executeBkashPayment = async (req, res) => {
    try {
        const { paymentID } = req.params;
        const { id_token, appKey } = await getBkashToken();
        const r = await fetch(`${BKASH_BASE}/checkout/payment/execute/${paymentID}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                authorization: id_token,
                "x-app-key": appKey,
            },
        });
        const data = await r.json();
        if (!r.ok) {
            return res.status(400).json({ error: data?.message || "Failed to execute bKash payment", data });
        }
        return res.json({ success: true, data });
    } catch (err) {
        console.error("bKash execute error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Create consultation checkout session
export const createConsultationCheckout = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({ error: "Payments not configured" });
        }
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "Dermatologist Consultation",
                            description:
                                "Professional skin consultation with certified dermatologist",
                            images: [
                                "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&h=500&fit=crop",
                            ],
                        },
                        unit_amount: 5000, // $50 in cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${
                process.env.FRONTEND_URL || "http://localhost:5173"
            }/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${
                process.env.FRONTEND_URL || "http://localhost:5173"
            }/payment/cancel`,
            metadata: {
                type: "consultation",
                userId: req.user?.id || "guest",
            },
        });

        res.status(200).json({ id: session.id, url: session.url });
    } catch (error) {
        console.error("Stripe consultation error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// Create product checkout session (for cart items)
export const createProductCheckout = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({ error: "Payments not configured" });
        }
        const { cartItems, paymentType = "full", customerInfo } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        // Fetch product details and validate stock
        const line_items = [];
        let totalAmount = 0;

        for (const item of cartItems) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res
                    .status(404)
                    .json({ error: `Product ${item.productId} not found` });
            }

            if (!product.inStock) {
                return res
                    .status(400)
                    .json({ error: `Product ${product.name} is out of stock` });
            }

            const itemAmount = product.price * item.quantity;
            totalAmount += itemAmount;

            line_items.push({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                        description: `${product.brand} - ${product.category}`,
                        images: product.image ? [product.image] : [],
                        metadata: {
                            productId: product._id.toString(),
                            brand: product.brand,
                            category: product.category,
                        },
                    },
                    unit_amount: Math.round(product.price * 100), // Convert to cents
                },
                quantity: item.quantity,
            });
        }

        // Calculate EMI amount if applicable
        let sessionAmount = totalAmount;
        let mode = "payment";

        if (paymentType === "emi" && totalAmount >= 100) {
            // For EMI, create subscription mode (simplified example)
            mode = "payment"; // Keep as payment for simplicity
            // In real implementation, you'd create subscription for EMI
        }

        // Create Stripe session
        const sessionConfig = {
            payment_method_types: ["card"],
            line_items,
            mode,
            success_url: `${
                process.env.FRONTEND_URL || "http://localhost:5173"
            }/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${
                process.env.FRONTEND_URL || "http://localhost:5173"
            }/cart`,
            metadata: {
                type: "product_purchase",
                userId: req.user?.id || "guest",
                paymentType,
                totalAmount: totalAmount.toString(),
                itemCount: cartItems.length.toString(),
            },
            shipping_address_collection: {
                allowed_countries: ["US", "CA", "GB", "AU", "BD", "IN"],
            },
            phone_number_collection: {
                enabled: true,
            },
        };

        // Add customer email if provided
        if (customerInfo?.email) {
            sessionConfig.customer_email = customerInfo.email;
        }

        // Add discount for cash payment
        if (paymentType === "cash_discount") {
            const discountAmount = Math.round(totalAmount * 0.05 * 100); // 5% discount
            sessionConfig.discounts = [
                {
                    coupon: await createDiscountCoupon(discountAmount),
                },
            ];
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        res.status(200).json({
            id: session.id,
            url: session.url,
            totalAmount,
            paymentType,
        });
    } catch (error) {
        console.error("Stripe product checkout error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// Create discount coupon for cash payments
const createDiscountCoupon = async (discountAmount) => {
    try {
        if (!stripe) {
            throw new Error("Payments not configured");
        }
        const coupon = await stripe.coupons.create({
            amount_off: discountAmount,
            currency: "usd",
            duration: "once",
            name: "Cash Payment Discount (5%)",
        });
        return coupon.id;
    } catch (error) {
        console.error("Error creating coupon:", error);
        return null;
    }
};

// Verify payment and create order
export const verifyPayment = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({ error: "Payments not configured" });
        }
        const { sessionId } = req.params;

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
            // Payment successful - create order record
            const orderData = {
                sessionId,
                userId:
                    session.metadata.userId !== "guest"
                        ? session.metadata.userId
                        : null,
                type: session.metadata.type,
                amount: session.amount_total / 100, // Convert from cents
                paymentType: session.metadata.paymentType || "full",
                status: "paid",
                customerEmail: session.customer_details?.email,
                customerPhone: session.customer_details?.phone,
                shippingAddress: session.shipping_details?.address,
                createdAt: new Date(),
            };

            // Optional: build a server-side receipt for product purchases
            let receiptUrl = null;
            try {
                if (orderData.type === "product_purchase") {
                    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
                    const rel = await generateOrderReceiptPDF(orderData, lineItems?.data || [], session);
                    receiptUrl = rel; // e.g., /uploads/receipts/receipt-<sessionId>.pdf
                }
            } catch (e) {
                console.warn("Non-blocking: failed to generate product receipt:", e?.message || e);
            }

            // Fire-and-forget notification to user (if we know them)
            try {
                if (orderData.userId) {
                    const title = "Payment Successful";
                    const message = orderData.type === "consultation"
                        ? "Your consultation payment was received. We'll be in touch to confirm scheduling."
                        : "Your order payment has been received. You can download the receipt.";
                    const actionUrl = orderData.type === "consultation"
                        ? "/consultation-request"
                        : (receiptUrl || "/products");
                    const actionText = orderData.type === "consultation" ? "View" : (receiptUrl ? "Download Receipt" : "View");
                    await Notification.create({
                        recipient: orderData.userId,
                        type: "payment_confirmed",
                        title,
                        message,
                        payment: session.payment_intent,
                        actionRequired: false,
                        actionUrl,
                        actionText
                    });
                }
            } catch (e) {
                console.warn("Non-blocking: failed to create payment notification:", e?.message || e);
            }

            res.status(200).json({
                success: true,
                order: orderData,
                session: {
                    id: session.id,
                    payment_status: session.payment_status,
                    amount_total: session.amount_total,
                    customer_details: session.customer_details,
                },
            });
        } else {
            res.status(400).json({
                success: false,
                error: "Payment not completed",
                status: session.payment_status,
            });
        }
    } catch (error) {
        console.error("Payment verification error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// Generate order receipt PDF for product purchases
const generateOrderReceiptPDF = async (order, lineItems, session) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const filename = `order-receipt-${order.sessionId}.pdf`;
            const filepath = path.join(process.cwd(), "uploads", "receipts", filename);

            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Header
            doc.fontSize(20).font("Helvetica-Bold");
            doc.text("SkinBloom Order Receipt", { align: "center" });
            doc.moveDown(2);

            // Order info
            doc.fontSize(16).font("Helvetica-Bold");
            doc.text("Order Details", { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(12).font("Helvetica");
            doc.text(`Receipt Number: ${session.payment_intent}`);
            doc.text(`Order Date: ${new Date().toLocaleDateString()}`);
            doc.text(`Customer Email: ${order.customerEmail || "-"}`);
            doc.moveDown();

            // Items table
            doc.fontSize(16).font("Helvetica-Bold");
            doc.text("Items", { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12).font("Helvetica");
            let itemIndex = 1;
            lineItems.forEach((item) => {
                const name = item.description || item.price?.product || "Item";
                const qty = item.quantity || 1;
                const amount = (item.amount_total || 0) / 100;
                doc.text(`${itemIndex}. ${name}`);
                doc.text(`   Qty: ${qty}   Line Total: $${amount.toFixed(2)}`);
                doc.moveDown(0.25);
                itemIndex += 1;
            });
            doc.moveDown(0.5);

            // Totals
            const total = order.amount || (session.amount_total || 0) / 100;
            doc.fontSize(14).font("Helvetica-Bold");
            doc.text(`Total Paid: $${total.toFixed(2)}`);
            doc.moveDown(1);

            // Footer
            doc.fontSize(10).font("Helvetica");
            doc.text("Thank you for shopping with SkinBloom.", {
                align: "center",
                y: doc.page.height - 100,
            });

            doc.end();
            stream.on("finish", () => resolve(`/uploads/receipts/${filename}`));
            stream.on("error", (err) => reject(err));
        } catch (err) {
            reject(err);
        }
    });
};

// Get payment methods and options
export const getPaymentOptions = async (req, res) => {
    try {
        const { amount } = req.query;
        const numAmount = parseFloat(amount) || 0;

        const options = {
            providers: {
                stripeAvailable: Boolean(stripe),
                bkashAvailable: isBkashConfigured(),
            },
            full_payment: {
                available: true,
                amount: numAmount,
                description: "Pay full amount now",
            },
            cash_discount: {
                available: numAmount >= 50,
                amount: numAmount * 0.95, // 5% discount
                savings: numAmount * 0.05,
                description: "5% discount for immediate payment",
            },
            emi_options: {
                available: numAmount >= 100,
                plans:
                    numAmount >= 100
                        ? [
                              {
                                  months: 3,
                                  monthly_amount: (numAmount / 3).toFixed(2),
                                  total_amount: numAmount,
                                  interest_rate: "0%",
                              },
                              {
                                  months: 6,
                                  monthly_amount: (numAmount / 6).toFixed(2),
                                  total_amount: numAmount,
                                  interest_rate: "0%",
                              },
                              {
                                  months: 12,
                                  monthly_amount: (
                                      (numAmount * 1.05) /
                                      12
                                  ).toFixed(2),
                                  total_amount: (numAmount * 1.05).toFixed(2),
                                  interest_rate: "5%",
                              },
                          ]
                        : [],
            },
        };

        res.status(200).json(options);
    } catch (error) {
        console.error("Error getting payment options:", error.message);
        res.status(500).json({ error: error.message });
    }
};
