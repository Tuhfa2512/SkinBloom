import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useParams } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";

function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const { id: bookingId } = useParams();
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isBookingPayment, setIsBookingPayment] = useState(false);

    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        if (sessionId) {
            // Check if this is a booking payment by looking at the URL
            const isBooking = window.location.pathname.includes("/bookings/");
            setIsBookingPayment(isBooking);
            verifyPayment(isBooking);
        }
    }, [sessionId]);

    const verifyPayment = async (isBooking) => {
        try {
            setLoading(true);

            let response;
            if (isBooking && bookingId) {
                // Verify booking payment
                response = await axios.post(
                    `http://localhost:5000/api/bookings/${bookingId}/verify-payment`,
                    { sessionId },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                                "token"
                            )}`,
                        },
                    }
                );
            } else {
                // Verify product payment
                response = await axios.get(
                    `http://localhost:5000/api/payment/verify/${sessionId}`
                );
            }

            if (response.data.success) {
                setOrderDetails(response.data);
                // Clear cart after successful payment (only for product purchases)
                if (!isBooking) {
                    clearCart();
                }
            } else {
                setError("Payment verification failed");
            }
        } catch (error) {
            console.error("Payment verification error:", error);
            setError("Failed to verify payment");
        } finally {
            setLoading(false);
        }
    };

    const clearCart = async () => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                await axios.delete("http://localhost:5000/api/cart/clear", {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
        } catch (error) {
            console.error("Error clearing cart:", error);
        }
    };

    const downloadPDFReceipt = () => {
        const doc = new jsPDF();

        // Set up the PDF
        doc.setFontSize(20);
        doc.text("SkinBloom Receipt", 105, 20, { align: "center" });

        doc.setFontSize(12);
        doc.text("Payment Confirmation", 105, 35, { align: "center" });

        let yPosition = 50;

        if (orderDetails?.booking) {
            // Booking receipt
            const booking = orderDetails.booking;

            doc.setFontSize(14);
            doc.text("Consultation Details", 20, yPosition);
            yPosition += 15;

            doc.setFontSize(10);
            doc.text(`Booking ID: ${booking._id}`, 20, yPosition);
            yPosition += 10;

            doc.text(
                `Type: ${booking.sessionType.replace("_", " ").toUpperCase()}`,
                20,
                yPosition
            );
            yPosition += 10;

            doc.text(
                `Dermatologist: Dr. ${booking.dermatologist?.name}`,
                20,
                yPosition
            );
            yPosition += 10;

            doc.text(
                `Date & Time: ${new Date(
                    booking.scheduledDateTime
                ).toLocaleString()}`,
                20,
                yPosition
            );
            yPosition += 10;

            doc.text(`Amount: $${booking.consultationFee}`, 20, yPosition);
            yPosition += 10;

            doc.text(`Payment Status: PAID`, 20, yPosition);
            yPosition += 10;

            doc.text(
                `Payment Date: ${new Date().toLocaleString()}`,
                20,
                yPosition
            );
            yPosition += 20;
        } else if (orderDetails?.order) {
            // Product purchase receipt
            const order = orderDetails.order;

            doc.setFontSize(14);
            doc.text("Order Details", 20, yPosition);
            yPosition += 15;

            doc.setFontSize(10);
            doc.text(`Order ID: ${order.sessionId?.slice(-8)}`, 20, yPosition);
            yPosition += 10;

            doc.text(`Amount: $${order.amount}`, 20, yPosition);
            yPosition += 10;

            doc.text(
                `Payment Type: ${order.paymentType
                    ?.replace("_", " ")
                    .toUpperCase()}`,
                20,
                yPosition
            );
            yPosition += 10;

            if (order.customerEmail) {
                doc.text(`Email: ${order.customerEmail}`, 20, yPosition);
                yPosition += 10;
            }

            doc.text(
                `Payment Date: ${new Date().toLocaleString()}`,
                20,
                yPosition
            );
            yPosition += 20;
        }

        // Footer
        doc.setFontSize(8);
        doc.text("Thank you for choosing SkinBloom!", 105, yPosition, {
            align: "center",
        });
        yPosition += 5;
        doc.text(
            "For any questions, please contact our support team.",
            105,
            yPosition,
            { align: "center" }
        );

        // Save the PDF
        const fileName = isBookingPayment
            ? `SkinBloom_Consultation_Receipt_${Date.now()}.pdf`
            : `SkinBloom_Order_Receipt_${Date.now()}.pdf`;

        doc.save(fileName);
    };

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "400px",
                    flexDirection: "column",
                    gap: "20px",
                }}
            >
                <div
                    style={{
                        width: "50px",
                        height: "50px",
                        border: "3px solid #e2e8f0",
                        borderTop: "3px solid #3182ce",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                    }}
                />
                <p style={{ fontSize: "16px", color: "#4a5568" }}>
                    Verifying your payment...
                </p>
                <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    maxWidth: "600px",
                    margin: "0 auto",
                    padding: "40px 20px",
                    textAlign: "center",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                }}
            >
                <div
                    style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "40px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
                        border: "1px solid #fed7d7",
                    }}
                >
                    <div style={{ fontSize: "60px", marginBottom: "20px" }}>
                        ❌
                    </div>
                    <h1
                        style={{
                            fontSize: "24px",
                            marginBottom: "12px",
                            color: "#e53e3e",
                        }}
                    >
                        Payment Verification Failed
                    </h1>
                    <p
                        style={{
                            fontSize: "16px",
                            color: "#718096",
                            marginBottom: "30px",
                        }}
                    >
                        {error}
                    </p>
                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            justifyContent: "center",
                        }}
                    >
                        <Link
                            to="/cart"
                            style={{
                                padding: "12px 24px",
                                background: "#3182ce",
                                color: "white",
                                textDecoration: "none",
                                borderRadius: "8px",
                                fontWeight: "600",
                            }}
                        >
                            Back to Cart
                        </Link>
                        <Link
                            to="/products"
                            style={{
                                padding: "12px 24px",
                                background: "transparent",
                                color: "#3182ce",
                                textDecoration: "none",
                                borderRadius: "8px",
                                fontWeight: "600",
                                border: "1px solid #3182ce",
                            }}
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                maxWidth: "800px",
                margin: "0 auto",
                padding: "40px 20px",
                fontFamily: "system-ui, -apple-system, sans-serif",
            }}
        >
            <div
                style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "40px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
                    border: "1px solid #c6f6d5",
                    textAlign: "center",
                    marginBottom: "30px",
                }}
            >
                <div style={{ fontSize: "80px", marginBottom: "20px" }}>✅</div>
                <h1
                    style={{
                        fontSize: "28px",
                        marginBottom: "12px",
                        color: "#2d3748",
                    }}
                >
                    {isBookingPayment
                        ? "Consultation Booked!"
                        : "Payment Successful!"}
                </h1>
                <p
                    style={{
                        fontSize: "16px",
                        color: "#718096",
                        marginBottom: "20px",
                    }}
                >
                    {isBookingPayment
                        ? "Thank you for booking your dermatology consultation. Your appointment has been confirmed."
                        : "Thank you for your purchase. Your order has been confirmed."}
                </p>

                {orderDetails?.order && (
                    <div
                        style={{
                            background: "#f7fafc",
                            padding: "20px",
                            borderRadius: "8px",
                            marginBottom: "20px",
                            textAlign: "left",
                        }}
                    >
                        <h3
                            style={{
                                fontSize: "18px",
                                marginBottom: "12px",
                                color: "#2d3748",
                            }}
                        >
                            Order Details
                        </h3>
                        <div
                            style={{
                                display: "grid",
                                gap: "8px",
                                fontSize: "14px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>Order ID:</span>
                                <span style={{ fontWeight: "600" }}>
                                    {orderDetails.order.sessionId?.slice(-8)}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>Amount:</span>
                                <span style={{ fontWeight: "600" }}>
                                    ${orderDetails.order.amount}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>Payment Type:</span>
                                <span
                                    style={{
                                        fontWeight: "600",
                                        textTransform: "capitalize",
                                    }}
                                >
                                    {orderDetails.order.paymentType?.replace(
                                        "_",
                                        " "
                                    )}
                                </span>
                            </div>
                            {orderDetails.order.customerEmail && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <span>Email:</span>
                                    <span style={{ fontWeight: "600" }}>
                                        {orderDetails.order.customerEmail}
                                    </span>
                                </div>
                            )}
                            {orderDetails.order.shippingAddress && (
                                <div
                                    style={{
                                        marginTop: "12px",
                                        paddingTop: "12px",
                                        borderTop: "1px solid #e2e8f0",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: "600",
                                            marginBottom: "4px",
                                        }}
                                    >
                                        Shipping Address:
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#4a5568",
                                        }}
                                    >
                                        {
                                            orderDetails.order.shippingAddress
                                                .line1
                                        }
                                        <br />
                                        {orderDetails.order.shippingAddress
                                            .line2 && (
                                            <>
                                                {
                                                    orderDetails.order
                                                        .shippingAddress.line2
                                                }
                                                <br />
                                            </>
                                        )}
                                        {
                                            orderDetails.order.shippingAddress
                                                .city
                                        }
                                        ,{" "}
                                        {
                                            orderDetails.order.shippingAddress
                                                .state
                                        }{" "}
                                        {
                                            orderDetails.order.shippingAddress
                                                .postal_code
                                        }
                                        <br />
                                        {
                                            orderDetails.order.shippingAddress
                                                .country
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {orderDetails?.booking && (
                    <div
                        style={{
                            background: "#f7fafc",
                            padding: "20px",
                            borderRadius: "8px",
                            marginBottom: "20px",
                            textAlign: "left",
                        }}
                    >
                        <h3
                            style={{
                                fontSize: "18px",
                                marginBottom: "12px",
                                color: "#2d3748",
                            }}
                        >
                            Consultation Details
                        </h3>
                        <div
                            style={{
                                display: "grid",
                                gap: "8px",
                                fontSize: "14px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>Booking ID:</span>
                                <span style={{ fontWeight: "600" }}>
                                    {orderDetails.booking._id}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>Consultation Type:</span>
                                <span style={{ fontWeight: "600" }}>
                                    {orderDetails.booking.sessionType
                                        .replace("_", " ")
                                        .toUpperCase()}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>Dermatologist:</span>
                                <span style={{ fontWeight: "600" }}>
                                    Dr.{" "}
                                    {orderDetails.booking.dermatologist?.name}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>Scheduled Date & Time:</span>
                                <span style={{ fontWeight: "600" }}>
                                    {new Date(
                                        orderDetails.booking.scheduledDateTime
                                    ).toLocaleString()}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>Amount Paid:</span>
                                <span style={{ fontWeight: "600" }}>
                                    ${orderDetails.booking.consultationFee}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>Payment Status:</span>
                                <span
                                    style={{
                                        fontWeight: "600",
                                        color: "#10b981",
                                    }}
                                >
                                    PAID
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* What's Next Section */}
            <div
                style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "30px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
                    marginBottom: "30px",
                }}
            >
                <h2
                    style={{
                        fontSize: "20px",
                        marginBottom: "20px",
                        color: "#2d3748",
                    }}
                >
                    What's Next?
                </h2>
                <div style={{ display: "grid", gap: "16px" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <div style={{ fontSize: "24px" }}>📧</div>
                        <div>
                            <div
                                style={{ fontWeight: "600", fontSize: "14px" }}
                            >
                                Confirmation Email
                            </div>
                            <div style={{ fontSize: "13px", color: "#718096" }}>
                                {isBookingPayment
                                    ? "You'll receive a consultation confirmation email shortly"
                                    : "You'll receive an order confirmation email shortly"}
                            </div>
                        </div>
                    </div>

                    {orderDetails?.order?.type === "product_purchase" && (
                        <>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                }}
                            >
                                <div style={{ fontSize: "24px" }}>📦</div>
                                <div>
                                    <div
                                        style={{
                                            fontWeight: "600",
                                            fontSize: "14px",
                                        }}
                                    >
                                        Processing
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#718096",
                                        }}
                                    >
                                        Your order will be processed within 1-2
                                        business days
                                    </div>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                }}
                            >
                                <div style={{ fontSize: "24px" }}>🚚</div>
                                <div>
                                    <div
                                        style={{
                                            fontWeight: "600",
                                            fontSize: "14px",
                                        }}
                                    >
                                        Shipping
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#718096",
                                        }}
                                    >
                                        Estimated delivery: 3-7 business days
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {(orderDetails?.order?.type === "consultation" ||
                        isBookingPayment) && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                            }}
                        >
                            <div style={{ fontSize: "24px" }}>👨‍⚕️</div>
                            <div>
                                <div
                                    style={{
                                        fontWeight: "600",
                                        fontSize: "14px",
                                    }}
                                >
                                    {isBookingPayment
                                        ? "Consultation Confirmed"
                                        : "Consultation Scheduling"}
                                </div>
                                <div
                                    style={{
                                        fontSize: "13px",
                                        color: "#718096",
                                    }}
                                >
                                    {isBookingPayment
                                        ? "Your consultation has been confirmed. Check your email for details."
                                        : "Our team will contact you within 24 hours to schedule your consultation"}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div
                style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                }}
            >
                <Link
                    to={
                        isBookingPayment ? "/consultation-request" : "/products"
                    }
                    style={{
                        padding: "12px 24px",
                        background: "#3182ce",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "8px",
                        fontWeight: "600",
                        transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                        (e.target.style.background = "#2c5aa0")
                    }
                    onMouseLeave={(e) =>
                        (e.target.style.background = "#3182ce")
                    }
                >
                    {isBookingPayment
                        ? "Book Another Consultation"
                        : "Continue Shopping"}
                </Link>

                <Link
                    to={isBookingPayment ? "/my-bookings" : "/profile"}
                    style={{
                        padding: "12px 24px",
                        background: "transparent",
                        color: "#3182ce",
                        textDecoration: "none",
                        borderRadius: "8px",
                        fontWeight: "600",
                        border: "1px solid #3182ce",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = "#3182ce";
                        e.target.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = "transparent";
                        e.target.style.color = "#3182ce";
                    }}
                >
                    {isBookingPayment ? "View My Bookings" : "View Profile"}
                </Link>

                <button
                    onClick={downloadPDFReceipt}
                    style={{
                        padding: "12px 24px",
                        background: "transparent",
                        color: "#10b981",
                        border: "1px solid #10b981",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = "#10b981";
                        e.target.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = "transparent";
                        e.target.style.color = "#10b981";
                    }}
                >
                    Download PDF Receipt
                </button>
            </div>
        </div>
    );
}

export default PaymentSuccess;
