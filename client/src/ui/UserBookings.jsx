import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../auth";

export default function UserBookings() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("upcoming");
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [mobilePayForm, setMobilePayForm] = useState({ provider: 'bkash', phone: '', transactionId: '' });
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [confirmedBooking, setConfirmedBooking] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [bookingsRes, ticketsRes] = await Promise.all([
                API.get("/bookings/my-bookings"),
                API.get("/tickets/my-tickets"),
            ]);

            const newBookings = bookingsRes.data.bookings || [];
            const newTickets = ticketsRes.data || [];

            // Check for newly confirmed bookings
            const previousBookings = bookings;
            const newlyConfirmed = newBookings.filter((newBooking) => {
                const prevBooking = previousBookings.find(
                    (b) => b._id === newBooking._id
                );
                return (
                    prevBooking &&
                    prevBooking.status !== "confirmed" &&
                    newBooking.status === "confirmed"
                );
            });

            if (newlyConfirmed.length > 0) {
                setConfirmedBooking(newlyConfirmed[0]);
                setShowConfirmationModal(true);
            }

            setBookings(newBookings);
            setTickets(newTickets);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredBookings = () => {
        const now = new Date();
        switch (activeTab) {
            case "upcoming":
                return bookings.filter(
                    (b) =>
                        new Date(b.scheduledDateTime) > now &&
                        ["scheduled", "confirmed"].includes(b.status)
                );
            case "completed":
                return bookings.filter((b) => b.status === "completed");
            case "history":
                return bookings.filter(
                    (b) =>
                        b.status === "completed" &&
                        (b.consultation || b.dermatologistNotes)
                );
            case "cancelled":
                return bookings.filter((b) => b.status === "cancelled");
            default:
                return bookings;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "scheduled":
                return "#f59e0b";
            case "confirmed":
                return "#3b82f6";
            case "in_progress":
                return "#8b5cf6";
            case "completed":
                return "#10b981";
            case "cancelled":
                return "#ef4444";
            default:
                return "#6b7280";
        }
    };

    const getSessionTypeLabel = (type) => {
        switch (type) {
            case "photo_review":
                return "Photo Review";
            case "video_call":
                return "Video Call";
            case "follow_up":
                return "Follow-up";
            default:
                return type;
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!confirm("Are you sure you want to cancel this booking?")) {
            return;
        }

        try {
            await API.patch(`/bookings/${bookingId}/status`, {
                status: "cancelled",
                notes: "Cancelled by patient",
            });

            await loadData();
            alert("Booking cancelled successfully");
        } catch (error) {
            console.error("Error cancelling booking:", error);
            alert("Failed to cancel booking");
        }
    };

    const handlePayment = async (booking) => {
        try {
            const response = await API.post(`/bookings/${booking._id}/payment`);
            window.location.href = response.data.url;
        } catch (error) {
            console.error("Error creating payment:", error);
            alert("Failed to create payment session");
        }
    };

    const handleMobilePaymentSubmit = async (bookingId) => {
        try {
            const { provider, phone, transactionId } = mobilePayForm;
            if (!provider || !phone || !transactionId) {
                alert('Please fill provider, phone and transaction ID');
                return;
            }
            await API.post(`/bookings/${bookingId}/mobile-payment`, {
                provider, phone, transactionId
            });
            alert('Mobile payment submitted. We will verify and confirm shortly.');
            setShowPayment(false);
            setMobilePayForm({ provider: 'bkash', phone: '', transactionId: '' });
        } catch (error) {
            console.error('Mobile payment submit error:', error);
            alert(error.response?.data?.error || 'Failed to submit mobile payment');
        }
    };

    const joinVideoCall = (booking) => {
        if (booking.meetingLink) {
            window.open(booking.meetingLink, "_blank");
        } else {
            alert("Meeting link not available yet");
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
                <p>Loading your bookings...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h1
                    style={{
                        fontSize: "2.5rem",
                        fontWeight: "700",
                        marginBottom: "8px",
                        color: "#1f2937",
                    }}
                >
                    My Consultations
                </h1>
                <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>
                    Manage your dermatologist appointments and consultations
                </p>
            </div>

            {/* Stats Overview */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "20px",
                    marginBottom: "32px",
                }}
            >
                <div
                    style={{
                        background: "white",
                        padding: "24px",
                        borderRadius: "12px",
                        border: "1px solid #f3f4f6",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                        📅
                    </div>
                    <h3
                        style={{
                            color: "#3b82f6",
                            fontSize: "24px",
                            margin: 0,
                        }}
                    >
                        {
                            bookings.filter(
                                (b) =>
                                    new Date(b.scheduledDateTime) >
                                        new Date() &&
                                    ["scheduled", "confirmed"].includes(
                                        b.status
                                    )
                            ).length
                        }
                    </h3>
                    <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>
                        Upcoming
                    </p>
                </div>

                <div
                    style={{
                        background: "white",
                        padding: "24px",
                        borderRadius: "12px",
                        border: "1px solid #f3f4f6",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                        ✅
                    </div>
                    <h3
                        style={{
                            color: "#10b981",
                            fontSize: "24px",
                            margin: 0,
                        }}
                    >
                        {
                            bookings.filter((b) => b.status === "completed")
                                .length
                        }
                    </h3>
                    <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>
                        Completed
                    </p>
                </div>

                <div
                    style={{
                        background: "white",
                        padding: "24px",
                        borderRadius: "12px",
                        border: "1px solid #f3f4f6",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                        🎯
                    </div>
                    <h3
                        style={{
                            color: "#f59e0b",
                            fontSize: "24px",
                            margin: 0,
                        }}
                    >
                        {tickets.length}
                    </h3>
                    <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>
                        Total Tickets
                    </p>
                </div>

                <div
                    style={{
                        background: "white",
                        padding: "24px",
                        borderRadius: "12px",
                        border: "1px solid #f3f4f6",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                        📊
                    </div>
                    <h3
                        style={{
                            color: "#1f2937",
                            fontSize: "24px",
                            margin: 0,
                        }}
                    >
                        {bookings.length}
                    </h3>
                    <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>
                        Total Bookings
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div
                style={{
                    background: "white",
                    padding: "24px",
                    borderRadius: "12px",
                    border: "1px solid #f3f4f6",
                    marginBottom: "32px",
                }}
            >
                <h2
                    style={{
                        fontSize: "1.5rem",
                        fontWeight: "600",
                        marginBottom: "16px",
                        color: "#1f2937",
                    }}
                >
                    Quick Actions
                </h2>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button
                        onClick={() =>
                            (window.location.href = "/consultation-request")
                        }
                        style={{
                            padding: "12px 24px",
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                        }}
                    >
                        Book New Consultation
                    </button>
                    <button
                        onClick={() => (window.location.href = "/tickets")}
                        style={{
                            padding: "12px 24px",
                            background: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                        }}
                    >
                        View My Tickets
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div
                style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "24px",
                    borderBottom: "1px solid #f3f4f6",
                }}
            >
                {[
                    { key: "upcoming", label: "Upcoming" },
                    { key: "completed", label: "Completed" },
                    { key: "history", label: "Consultation History" },
                    { key: "cancelled", label: "Cancelled" },
                    { key: "all", label: "All Bookings" },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: "12px 20px",
                            background:
                                activeTab === tab.key
                                    ? "#3b82f6"
                                    : "transparent",
                            color: activeTab === tab.key ? "white" : "#6b7280",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Bookings List */}
            <div
                style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "24px",
                    border: "1px solid #f3f4f6",
                }}
            >
                <h2
                    style={{
                        fontSize: "1.5rem",
                        fontWeight: "600",
                        marginBottom: "20px",
                        color: "#1f2937",
                    }}
                >
                    {activeTab === "history"
                        ? "Consultation History"
                        : activeTab.charAt(0).toUpperCase() +
                          activeTab.slice(1) +
                          " Consultations"}
                </h2>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                    }}
                >
                    {getFilteredBookings().map((booking) => (
                        <div
                            key={booking._id}
                            style={{
                                border: "1px solid #f3f4f6",
                                borderRadius: "8px",
                                padding: "20px",
                                background: "#fafafa",
                            }}
                        >
                            {/* Booking Header */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "16px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                    }}
                                >
                                    <span
                                        style={{
                                            background: getStatusColor(
                                                booking.status
                                            ),
                                            color: "white",
                                            padding: "4px 12px",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        {booking.status.toUpperCase()}
                                    </span>
                                    <span
                                        style={{
                                            background: "#f0f9ff",
                                            color: "#0369a1",
                                            padding: "4px 12px",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        {getSessionTypeLabel(
                                            booking.sessionType
                                        )}
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontSize: "14px",
                                        color: "#6b7280",
                                    }}
                                >
                                    ${booking.consultationFee}
                                </span>
                            </div>

                            {/* Dermatologist Info */}
                            <div style={{ marginBottom: "16px" }}>
                                <h3
                                    style={{
                                        fontSize: "18px",
                                        fontWeight: "600",
                                        color: "#1f2937",
                                        marginBottom: "4px",
                                    }}
                                >
                                    Dr. {booking.dermatologist?.name}
                                </h3>
                                {booking.dermatologist?.specialization && (
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: "#6b7280",
                                            margin: 0,
                                        }}
                                    >
                                        Specialization:{" "}
                                        {booking.dermatologist.specialization}
                                    </p>
                                )}
                            </div>

                            {/* Booking Details */}
                            <div
                                style={{
                                    background: "#f9fafb",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    marginBottom: "16px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "8px",
                                    }}
                                >
                                    <div>
                                        <strong
                                            style={{
                                                fontSize: "12px",
                                                color: "#6b7280",
                                            }}
                                        >
                                            DATE & TIME
                                        </strong>
                                        <p
                                            style={{
                                                margin: "2px 0 0 0",
                                                fontSize: "14px",
                                            }}
                                        >
                                            {new Date(
                                                booking.scheduledDateTime
                                            ).toLocaleDateString()}{" "}
                                            at{" "}
                                            {new Date(
                                                booking.scheduledDateTime
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <strong
                                            style={{
                                                fontSize: "12px",
                                                color: "#6b7280",
                                            }}
                                        >
                                            PAYMENT STATUS
                                        </strong>
                                        <p
                                            style={{
                                                margin: "2px 0 0 0",
                                                fontSize: "14px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color:
                                                        booking.paymentStatus ===
                                                        "paid"
                                                            ? "#10b981"
                                                            : "#f59e0b",
                                                }}
                                            >
                                                {booking.paymentStatus.toUpperCase()}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Patient Notes */}
                            {booking.patientNotes && (
                                <div style={{ marginBottom: "16px" }}>
                                    <strong
                                        style={{
                                            fontSize: "14px",
                                            color: "#374151",
                                        }}
                                    >
                                        Your Notes:
                                    </strong>
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: "#6b7280",
                                            margin: "4px 0 0 0",
                                            lineHeight: "1.4",
                                        }}
                                    >
                                        {booking.patientNotes}
                                    </p>
                                </div>
                            )}

                            {/* Related Ticket */}
                            {booking.ticket && (
                                <div style={{ marginBottom: "16px" }}>
                                    <strong
                                        style={{
                                            fontSize: "14px",
                                            color: "#374151",
                                        }}
                                    >
                                        Related Concern:
                                    </strong>
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: "#6b7280",
                                            margin: "4px 0 0 0",
                                            lineHeight: "1.4",
                                        }}
                                    >
                                        {booking.ticket.concern?.substring(
                                            0,
                                            100
                                        )}
                                        ...
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                }}
                            >
                                {booking.status === "scheduled" &&
                                    booking.paymentStatus === "pending" && (
                                        <button
                                            onClick={() =>
                                                handlePayment(booking)
                                            }
                                            style={{
                                                background: "#10b981",
                                                color: "white",
                                                border: "none",
                                                padding: "8px 16px",
                                                borderRadius: "6px",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Pay Now (${booking.consultationFee})
                                        </button>
                                    )}

                                {booking.status === "scheduled" && booking.paymentStatus === "pending" && (
                                    <button
                                        onClick={() => {
                                            setSelectedBooking(booking);
                                            setShowPayment(true);
                                        }}
                                        style={{
                                            background: "#0369a1",
                                            color: "white",
                                            border: "none",
                                            padding: "8px 16px",
                                            borderRadius: "6px",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Submit Mobile Payment
                                    </button>
                                )}

                                {booking.status === "in_progress" &&
                                    booking.sessionType === "video_call" && (
                                        <button
                                            onClick={() =>
                                                joinVideoCall(booking)
                                            }
                                            style={{
                                                background: "#8b5cf6",
                                                color: "white",
                                                border: "none",
                                                padding: "8px 16px",
                                                borderRadius: "6px",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Join Video Call
                                        </button>
                                    )}

                                {["scheduled", "confirmed"].includes(
                                    booking.status
                                ) &&
                                    new Date(booking.scheduledDateTime) >
                                        new Date() && (
                                        <button
                                            onClick={() =>
                                                handleCancelBooking(booking._id)
                                            }
                                            style={{
                                                background: "#ef4444",
                                                color: "white",
                                                border: "none",
                                                padding: "8px 16px",
                                                borderRadius: "6px",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Cancel Booking
                                        </button>
                                    )}

                                <button
                                    onClick={() => setSelectedBooking(booking)}
                                    style={{
                                        background: "#6b7280",
                                        color: "white",
                                        border: "none",
                                        padding: "8px 16px",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                    }}
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}

                    {getFilteredBookings().length === 0 && (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "40px",
                                color: "#6b7280",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "48px",
                                    marginBottom: "16px",
                                }}
                            >
                                📅
                            </div>
                            <p>No consultations in this category</p>
                            <button
                                onClick={() =>
                                    (window.location.href =
                                        "/consultation-request")
                                }
                                style={{
                                    marginTop: "16px",
                                    padding: "12px 24px",
                                    background: "#3b82f6",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                }}
                            >
                                Book Your First Consultation
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Consultation Confirmation Modal */}
            {showConfirmationModal && confirmedBooking && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            background: "white",
                            borderRadius: "12px",
                            padding: "24px",
                            maxWidth: "500px",
                            width: "90%",
                            textAlign: "center",
                        }}
                    >
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                            🎉
                        </div>
                        <h2
                            style={{
                                fontSize: "1.5rem",
                                fontWeight: "600",
                                color: "#1f2937",
                                marginBottom: "12px",
                            }}
                        >
                            Consultation Confirmed!
                        </h2>
                        <p style={{ color: "#6b7280", marginBottom: "20px" }}>
                            Your consultation with Dr.{" "}
                            {confirmedBooking.dermatologist?.name} has been
                            confirmed.
                        </p>

                        <div
                            style={{
                                background: "#f0f9ff",
                                padding: "16px",
                                borderRadius: "8px",
                                marginBottom: "20px",
                            }}
                        >
                            <div style={{ fontSize: "14px", color: "#0369a1" }}>
                                <strong>Date:</strong>{" "}
                                {new Date(
                                    confirmedBooking.scheduledDateTime
                                ).toLocaleDateString()}
                            </div>
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: "#0369a1",
                                    marginTop: "4px",
                                }}
                            >
                                <strong>Time:</strong>{" "}
                                {new Date(
                                    confirmedBooking.scheduledDateTime
                                ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </div>
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: "#0369a1",
                                    marginTop: "4px",
                                }}
                            >
                                <strong>Type:</strong>{" "}
                                {getSessionTypeLabel(
                                    confirmedBooking.sessionType
                                )}
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                justifyContent: "center",
                            }}
                        >
                            <button
                                onClick={() => {
                                    setShowConfirmationModal(false);
                                    setConfirmedBooking(null);
                                }}
                                style={{
                                    padding: "12px 24px",
                                    background: "#6b7280",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                }}
                            >
                                Continue
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfirmationModal(false);
                                    setConfirmedBooking(null);
                                    setSelectedBooking(confirmedBooking);
                                }}
                                style={{
                                    padding: "12px 24px",
                                    background: "#3b82f6",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                }}
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Details Modal */}
            {selectedBooking && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            background: "white",
                            borderRadius: "12px",
                            padding: "24px",
                            maxWidth: "600px",
                            width: "90%",
                            maxHeight: "80vh",
                            overflow: "auto",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "20px",
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: "1.5rem",
                                    fontWeight: "600",
                                    color: "#1f2937",
                                    margin: 0,
                                }}
                            >
                                Consultation Details
                            </h2>
                            <button
                                onClick={() => setSelectedBooking(null)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: "20px",
                                    cursor: "pointer",
                                    color: "#6b7280",
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                            <p>
                                <strong>Dermatologist:</strong> Dr.{" "}
                                {selectedBooking.dermatologist?.name}
                            </p>
                            <p>
                                <strong>Session Type:</strong>{" "}
                                {getSessionTypeLabel(
                                    selectedBooking.sessionType
                                )}
                            </p>
                            <p>
                                <strong>Date & Time:</strong>{" "}
                                {new Date(
                                    selectedBooking.scheduledDateTime
                                ).toLocaleString()}
                            </p>
                            <p>
                                <strong>Status:</strong>{" "}
                                {selectedBooking.status}
                            </p>
                            <p>
                                <strong>Payment Status:</strong>{" "}
                                {selectedBooking.paymentStatus}
                            </p>
                            <p>
                                <strong>Fee:</strong> $
                                {selectedBooking.consultationFee}
                            </p>

                            {selectedBooking.patientNotes && (
                                <div style={{ marginTop: "16px" }}>
                                    <strong>Your Notes:</strong>
                                    <p
                                        style={{
                                            background: "#f9fafb",
                                            padding: "12px",
                                            borderRadius: "8px",
                                            margin: "8px 0",
                                        }}
                                    >
                                        {selectedBooking.patientNotes}
                                    </p>
                                </div>
                            )}

                            {selectedBooking.dermatologistNotes && (
                                <div style={{ marginTop: "16px" }}>
                                    <strong>Dermatologist Notes:</strong>
                                    <p
                                        style={{
                                            background: "#f0f9ff",
                                            padding: "12px",
                                            borderRadius: "8px",
                                            margin: "8px 0",
                                        }}
                                    >
                                        {selectedBooking.dermatologistNotes}
                                    </p>
                                </div>
                            )}

                            {/* Consultation Results */}
                            {selectedBooking.consultation && (
                                <div style={{ marginTop: "16px" }}>
                                    <strong>Consultation Results:</strong>
                                    <div
                                        style={{
                                            background: "#f0fdf4",
                                            padding: "12px",
                                            borderRadius: "8px",
                                            margin: "8px 0",
                                            border: "1px solid #bbf7d0",
                                        }}
                                    >
                                        {selectedBooking.consultation
                                            .diagnosis && (
                                            <p style={{ margin: "0 0 8px 0" }}>
                                                <strong>Diagnosis:</strong>{" "}
                                                {
                                                    selectedBooking.consultation
                                                        .diagnosis
                                                }
                                            </p>
                                        )}
                                        {selectedBooking.consultation
                                            .severity && (
                                            <p style={{ margin: "0 0 8px 0" }}>
                                                <strong>Severity:</strong>{" "}
                                                {
                                                    selectedBooking.consultation
                                                        .severity
                                                }
                                            </p>
                                        )}
                                        {selectedBooking.consultation
                                            .recommendations && (
                                            <p style={{ margin: "0 0 8px 0" }}>
                                                <strong>
                                                    Recommendations:
                                                </strong>{" "}
                                                {
                                                    selectedBooking.consultation
                                                        .recommendations
                                                }
                                            </p>
                                        )}
                                        {selectedBooking.consultation
                                            .treatmentPlan &&
                                            selectedBooking.consultation
                                                .treatmentPlan.length > 0 && (
                                                <div
                                                    style={{
                                                        marginTop: "12px",
                                                    }}
                                                >
                                                    <strong>
                                                        Treatment Plan:
                                                    </strong>
                                                    <ul
                                                        style={{
                                                            margin: "8px 0",
                                                            paddingLeft: "20px",
                                                        }}
                                                    >
                                                        {selectedBooking.consultation.treatmentPlan.map(
                                                            (step, index) => (
                                                                <li
                                                                    key={index}
                                                                    style={{
                                                                        marginBottom:
                                                                            "4px",
                                                                    }}
                                                                >
                                                                    <strong>
                                                                        Step{" "}
                                                                        {
                                                                            step.step
                                                                        }
                                                                        :
                                                                    </strong>{" "}
                                                                    {
                                                                        step.instruction
                                                                    }
                                                                    {step.duration && (
                                                                        <span>
                                                                            {" "}
                                                                            (
                                                                            {
                                                                                step.duration
                                                                            }
                                                                            )
                                                                        </span>
                                                                    )}
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            )}

                            {selectedBooking.meetingLink && (
                                <div style={{ marginTop: "16px" }}>
                                    <strong>Meeting Link:</strong>
                                    <p style={{ margin: "8px 0" }}>
                                        <a
                                            href={selectedBooking.meetingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: "#3b82f6",
                                                textDecoration: "underline",
                                            }}
                                        >
                                            Join Video Call
                                        </a>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showPayment && selectedBooking && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '420px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h3 style={{ margin: 0 }}>Submit Mobile Payment</h3>
                            <button onClick={() => setShowPayment(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ display: 'grid', gap: 10 }}>
                            <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                                Provider
                                <select value={mobilePayForm.provider} onChange={e => setMobilePayForm(p => ({ ...p, provider: e.target.value }))} style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                                    <option value="bkash">bKash</option>
                                    <option value="nagad">Nagad</option>
                                    <option value="rocket">Rocket</option>
                                    <option value="upay">Upay</option>
                                    <option value="other">Other</option>
                                </select>
                            </label>
                            <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                                Phone Number
                                <input value={mobilePayForm.phone} onChange={e => setMobilePayForm(p => ({ ...p, phone: e.target.value }))} placeholder="01XXXXXXXXX" style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                            </label>
                            <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                                Transaction ID
                                <input value={mobilePayForm.transactionId} onChange={e => setMobilePayForm(p => ({ ...p, transactionId: e.target.value }))} placeholder="e.g., TX12345" style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                            </label>
                            <button onClick={() => handleMobilePaymentSubmit(selectedBooking._id)} style={{ padding: 12, background: '#0369a1', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600 }}>Submit</button>
                        </div>
                        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 12 }}>
                            After submitting, our team will verify the transaction and mark your booking as paid.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
