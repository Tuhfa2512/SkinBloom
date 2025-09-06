import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../auth";

export default function TicketDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(null);

    useEffect(() => {
        let ignore = false;
        const load = async () => {
            setLoading(true);
            try {
                const { data } = await API.get(`/tickets/${id}`);
                if (!ignore) {
                    setTicket(data);
                }
            } catch (e) {
                console.error("Error loading ticket:", e);
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };
        load();
        return () => {
            ignore = true;
        };
    }, [id]);

    const downloadPDF = async (type) => {
        if (!ticket?._id) {
            return;
        }
        setDownloading(type);
        try {
            // Prefer server endpoints first
            const endpoint =
                type === "consultation"
                    ? `/tickets/${ticket._id}/consultation-pdf`
                    : `/tickets/${ticket._id}/payment-receipt-pdf`;

            const response = await API.get(endpoint, { responseType: "blob" });
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${type}-${ticket._id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.warn(
                "Endpoint download failed, trying stored URL if available:",
                err?.message
            );
            // Fallback to stored URLs if present
            try {
                const base = (
                    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
                ).replace("/api", "");
                const directUrl =
                    type === "consultation"
                        ? ticket?.consultationPdfUrl
                        : ticket?.paymentReceiptUrl;
                if (directUrl) {
                    window.open(base + directUrl, "_blank");
                } else {
                    alert("PDF not available yet. Please try again later.");
                }
            } catch (e2) {
                alert("Failed to download PDF.");
            }
        } finally {
            setDownloading(null);
        }
    };

    const formatDate = (d) => {
        try {
            return new Date(d).toLocaleString();
        } catch {
            return "";
        }
    };

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
                <div style={{ color: "#6b7280" }}>Loading...</div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>😕</div>
                <div style={{ color: "#6b7280" }}>Ticket not found.</div>
                <button
                    className="btn"
                    style={{ marginTop: 12 }}
                    onClick={() => navigate("/tickets")}
                >
                    Back to tickets
                </button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 0" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                    paddingRight: "20px",
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        fontSize: "1.8rem",
                        paddingRight: "20px",
                    }}
                >
                    Consultation Details
                </h1>
                <button
                    className="btn ghost"
                    onClick={() => navigate("/tickets")}
                >
                    Back
                </button>
            </div>

            <div
                style={{
                    background: "white",
                    border: "1px solid #f3f4f6",
                    borderRadius: 12,
                    padding: 20,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                    }}
                >
                    <div>
                        <div style={{ fontSize: 13, color: "#6b7280" }}>
                            Ticket
                        </div>
                        <div style={{ fontFamily: "monospace" }}>
                            #{String(ticket._id).slice(-8).toUpperCase()}
                        </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, color: "#6b7280" }}>
                            Created
                        </div>
                        <div>{formatDate(ticket.createdAt)}</div>
                    </div>
                </div>
                <hr
                    style={{
                        border: 0,
                        borderTop: "1px solid #e5e7eb",
                        margin: "12px 0",
                    }}
                />
                <div style={{ marginBottom: 12 }}>
                    <strong>Concern:</strong>
                    <div
                        style={{
                            background: "#f9fafb",
                            border: "1px solid #eef2f7",
                            padding: 12,
                            borderRadius: 8,
                            marginTop: 6,
                        }}
                    >
                        {ticket.concern}
                    </div>
                </div>
                {ticket.diagnosis && (
                    <div style={{ marginBottom: 12 }}>
                        <strong>Diagnosis:</strong>
                        <div style={{ marginTop: 6 }}>{ticket.diagnosis}</div>
                    </div>
                )}
                {ticket.recommendations && (
                    <div style={{ marginBottom: 12 }}>
                        <strong>Recommendations:</strong>
                        <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>
                            {ticket.recommendations}
                        </div>
                    </div>
                )}
                {ticket.recommendedProducts?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                        <strong>Recommended Products:</strong>
                        <ul style={{ marginTop: 6 }}>
                            {ticket.recommendedProducts.map((rp, i) => (
                                <li key={i}>
                                    {rp?.product?.name || "Product"}{" "}
                                    {rp.instructions
                                        ? `- ${rp.instructions}`
                                        : ""}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginTop: 16,
                    }}
                >
                    {(ticket.consultationPdfUrl || ticket.diagnosis) && (
                        <button
                            onClick={() => downloadPDF("consultation")}
                            className="btn"
                            style={{ background: "#059669", color: "white" }}
                            disabled={downloading === "consultation"}
                        >
                            {downloading === "consultation"
                                ? "Preparing…"
                                : "📄 Download Consultation PDF"}
                        </button>
                    )}
                    {ticket.paymentStatus === "paid" && (
                        <button
                            onClick={() => downloadPDF("receipt")}
                            className="btn"
                            style={{ background: "#3b82f6", color: "white" }}
                            disabled={downloading === "receipt"}
                        >
                            {downloading === "receipt"
                                ? "Preparing…"
                                : "🧾 Download Payment Receipt"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
