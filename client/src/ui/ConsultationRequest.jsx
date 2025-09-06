import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../auth";

export default function ConsultationRequest() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        concern: "",
        skinType: "",
        symptoms: [],
        duration: "",
        previousTreatments: "",
        allergies: "",
        urgency: "medium",
    });
    const [photos, setPhotos] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedDermatologist, setSelectedDermatologist] = useState("");
    const [dermatologists, setDermatologists] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [consultationType, setConsultationType] = useState("photo_review");
    const [payLoading, setPayLoading] = useState(false);

    const skinTypeOptions = [
        { value: "oily", label: "Oily" },
        { value: "dry", label: "Dry" },
        { value: "combination", label: "Combination" },
        { value: "sensitive", label: "Sensitive" },
        { value: "normal", label: "Normal" },
    ];

    const symptomOptions = [
        "Acne breakouts",
        "Redness",
        "Itching",
        "Dryness",
        "Dark spots",
        "Wrinkles",
        "Enlarged pores",
        "Blackheads",
        "Whiteheads",
        "Irritation",
        "Scars",
        "Uneven skin tone",
    ];

    const consultationTypes = [
        {
            value: "photo_review",
            label: "Photo Review ($50)",
            description: "Upload photos for dermatologist review",
        },
        {
            value: "video_call",
            label: "Video Consultation ($100)",
            description: "Live video call with dermatologist",
        },
        {
            value: "follow_up",
            label: "Follow-up ($30)",
            description: "Follow-up consultation",
        },
    ];

    useEffect(() => {
        loadDermatologists();
    }, []);

    useEffect(() => {
        if (selectedDermatologist) {
            loadAvailableSlots();
        }
    }, [selectedDermatologist, consultationType]);

    const loadDermatologists = async () => {
        try {
            const response = await API.get("/auth/dermatologists");
            setDermatologists(response.data.dermatologists || []);
        } catch (error) {
            console.error("Error loading dermatologists:", error);
        }
    };

    const loadAvailableSlots = async () => {
        try {
            const today = new Date().toISOString().split("T")[0];
            const response = await API.get(
                `/bookings/dermatologist/${selectedDermatologist}/slots?date=${today}&sessionType=${consultationType}`
            );
            setAvailableSlots(response.data.slots || []);
        } catch (error) {
            console.error("Error loading slots:", error);
            // Generate some mock slots for now
            const mockSlots = generateMockSlots();
            setAvailableSlots(mockSlots);
        }
    };

    const generateMockSlots = () => {
        const slots = [];
        const today = new Date();

        for (let i = 1; i <= 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            // Skip weekends for this example
            if (date.getDay() !== 0 && date.getDay() !== 6) {
                const timeSlots = ["09:00", "10:30", "14:00", "15:30"];
                timeSlots.forEach((time) => {
                    slots.push({
                        id: `${date.toISOString().split("T")[0]}-${time}`,
                        date: date.toISOString().split("T")[0],
                        time: time,
                        available: Math.random() > 0.3, // 70% chance of being available
                    });
                });
            }
        }

        return slots.filter((slot) => slot.available);
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSymptomToggle = (symptom) => {
        setFormData((prev) => ({
            ...prev,
            symptoms: prev.symptoms.includes(symptom)
                ? prev.symptoms.filter((s) => s !== symptom)
                : [...prev.symptoms, symptom],
        }));
    };

    const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) {
            return;
        }

        setUploading(true);
        try {
            const uploadPromises = files.map(async (file) => {
                const formData = new FormData();
                formData.append("photo", file);
                formData.append("type", "consultation");

                const response = await API.post(
                    "/upload/consultation",
                    formData,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                    }
                );

                // Create preview URL
                const previewUrl = URL.createObjectURL(file);

                return {
                    url: response.data.url,
                    preview: previewUrl,
                    description: "",
                };
            });

            const uploadedPhotos = await Promise.all(uploadPromises);
            setPhotos((prev) => [...prev, ...uploadedPhotos]);
            setPhotoPreviews((prev) => [
                ...prev,
                ...uploadedPhotos.map((p) => p.preview),
            ]);
        } catch (error) {
            console.error("Error uploading photos:", error);
            alert("Failed to upload photos. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const removePhoto = (index) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
        setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const updatePhotoDescription = (index, description) => {
        setPhotos((prev) =>
            prev.map((photo, i) =>
                i === index ? { ...photo, description } : photo
            )
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.concern.trim()) {
            alert("Please describe your skin concern");
            return;
        }

        if (photos.length === 0 && consultationType === "photo_review") {
            alert(
                "Please upload at least one photo for photo review consultation"
            );
            return;
        }

        if (consultationType === "video_call" && !selectedSlot) {
            alert("Please select a time slot for video consultation");
            return;
        }

        if (consultationType === "video_call" && !selectedDermatologist) {
            alert("Please select a dermatologist for video consultation");
            return;
        }

        setSubmitting(true);
        try {
            // For video calls, create a booking directly
            if (
                consultationType === "video_call" &&
                selectedDermatologist &&
                selectedSlot
            ) {
                const slot = availableSlots.find((s) => s.id === selectedSlot);
                const scheduledDateTime = new Date(
                    `${slot.date}T${slot.time}:00`
                );

                const bookingData = {
                    dermatologistId: selectedDermatologist,
                    sessionType: consultationType,
                    scheduledDateTime: scheduledDateTime.toISOString(),
                    patientNotes: formData.concern,
                    consultationDetails: {
                        skinType: formData.skinType,
                        symptoms: formData.symptoms,
                        duration: formData.duration,
                        previousTreatments: formData.previousTreatments,
                        allergies: formData.allergies,
                        urgency: formData.urgency,
                    },
                };

                const response = await API.post("/bookings", bookingData);

                alert(
                    "Video consultation booked successfully! You will receive confirmation from the dermatologist."
                );

                // Redirect to bookings page
                window.location.href = "/my-bookings";
                return;
            }

            // For photo reviews and other types, create a ticket with booking intent
            const submissionData = {
                ...formData,
                photos: photos.map((p) => ({
                    url: p.url,
                    description: p.description,
                })),
                consultationType,
                preferredDermatologist: selectedDermatologist || null,
                preferredSlot: selectedSlot || null,
                createBooking: true, // Flag to indicate we want a booking created too
            };

            const response = await API.post("/tickets", submissionData);

            alert(
                "Consultation request submitted successfully! You will be notified when a dermatologist reviews your case."
            );

            // Reset form
            setFormData({
                concern: "",
                skinType: "",
                symptoms: [],
                duration: "",
                previousTreatments: "",
                allergies: "",
                urgency: "medium",
            });
            setPhotos([]);
            setPhotoPreviews([]);
            setSelectedDermatologist("");
            setSelectedSlot("");
        } catch (error) {
            console.error("Error submitting consultation:", error);
            alert("Failed to submit consultation request. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const getConsultationFee = () => {
        switch (consultationType) {
            case "video_call":
                return 100;
            case "follow_up":
                return 30;
            default:
                return 50;
        }
    };

    const payWithCard = async () => {
        try {
            setPayLoading(true);
            const { data } = await API.post('/payment/consultation');
            if (data?.url) {
                window.location.href = data.url;
            } else {
                alert('Failed to start card payment.');
            }
        } catch (e) {
            console.error('Stripe pay error', e);
            alert(e.response?.data?.error || 'Failed to start card payment');
        } finally {
            setPayLoading(false);
        }
    };

    const payWithBkash = async () => {
        try {
            setPayLoading(true);
            const amount = getConsultationFee();
            const { data } = await API.post('/payment/bkash/create', { amount, intent: 'sale', callbackPath: '/payment/success' });
            if (data?.url) {
                window.location.href = data.url;
            } else {
                alert('Failed to start bKash payment');
            }
        } catch (e) {
            console.error('bKash pay error', e);
            alert(e.response?.data?.error || 'Failed to start bKash');
        } finally {
            setPayLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "32px", textAlign: "center" }}>
                <h1
                    style={{
                        fontSize: "2.5rem",
                        fontWeight: "700",
                        marginBottom: "8px",
                        color: "#1f2937",
                    }}
                >
                    Book Dermatologist Consultation
                </h1>
                <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>
                    Get expert skin advice from qualified dermatologists
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                style={{
                    background: "white",
                    padding: "32px",
                    borderRadius: "12px",
                    border: "1px solid #f3f4f6",
                }}
            >
                {/* Consultation Type */}
                <div style={{ marginBottom: "24px" }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "12px",
                        }}
                    >
                        Consultation Type *
                    </label>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                        }}
                    >
                        {consultationTypes.map((type) => (
                            <label
                                key={type.value}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "16px",
                                    border: "2px solid",
                                    borderColor:
                                        consultationType === type.value
                                            ? "#3b82f6"
                                            : "#e5e7eb",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    background:
                                        consultationType === type.value
                                            ? "#f0f9ff"
                                            : "white",
                                }}
                            >
                                <input
                                    type="radio"
                                    name="consultationType"
                                    value={type.value}
                                    checked={consultationType === type.value}
                                    onChange={(e) =>
                                        setConsultationType(e.target.value)
                                    }
                                    style={{ marginRight: "12px" }}
                                />
                                <div>
                                    <div
                                        style={{
                                            fontWeight: "600",
                                            color: "#1f2937",
                                        }}
                                    >
                                        {type.label}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#6b7280",
                                        }}
                                    >
                                        {type.description}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Dermatologist Selection */}
                <div style={{ marginBottom: "24px" }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "8px",
                        }}
                    >
                        Preferred Dermatologist (Optional)
                    </label>
                    <select
                        value={selectedDermatologist}
                        onChange={(e) =>
                            setSelectedDermatologist(e.target.value)
                        }
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "14px",
                        }}
                    >
                        <option value="">Any available dermatologist</option>
                        {dermatologists.map((derm) => (
                            <option key={derm._id} value={derm._id}>
                                Dr. {derm.name}{" "}
                                {derm.profile?.qualification &&
                                    `- ${derm.profile.qualification}`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Time Slot Selection for Video Calls */}
                {consultationType === "video_call" && (
                    <div style={{ marginBottom: "24px" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#374151",
                                marginBottom: "8px",
                            }}
                        >
                            Available Time Slots *
                        </label>
                        {availableSlots.length > 0 ? (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fit, minmax(200px, 1fr))",
                                    gap: "8px",
                                }}
                            >
                                {availableSlots.map((slot) => (
                                    <label
                                        key={slot.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            padding: "12px",
                                            border: "2px solid",
                                            borderColor:
                                                selectedSlot === slot.id
                                                    ? "#3b82f6"
                                                    : "#e5e7eb",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            background:
                                                selectedSlot === slot.id
                                                    ? "#f0f9ff"
                                                    : "white",
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="timeSlot"
                                            value={slot.id}
                                            checked={selectedSlot === slot.id}
                                            onChange={(e) =>
                                                setSelectedSlot(e.target.value)
                                            }
                                            style={{ marginRight: "8px" }}
                                        />
                                        <div style={{ fontSize: "14px" }}>
                                            {new Date(
                                                slot.date
                                            ).toLocaleDateString()}{" "}
                                            at {slot.time}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p
                                style={{
                                    color: "#6b7280",
                                    fontStyle: "italic",
                                }}
                            >
                                {selectedDermatologist
                                    ? "No available slots for selected dermatologist"
                                    : "Please select a dermatologist to view available slots"}
                            </p>
                        )}
                    </div>
                )}

                {/* Skin Concern */}
                <div style={{ marginBottom: "24px" }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "8px",
                        }}
                    >
                        Describe Your Skin Concern *
                    </label>
                    <textarea
                        value={formData.concern}
                        onChange={(e) =>
                            handleInputChange("concern", e.target.value)
                        }
                        placeholder="Please describe your skin concern in detail..."
                        rows="4"
                        required
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "14px",
                            resize: "vertical",
                        }}
                    />
                </div>

                {/* Skin Type */}
                <div style={{ marginBottom: "24px" }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "8px",
                        }}
                    >
                        Skin Type
                    </label>
                    <select
                        value={formData.skinType}
                        onChange={(e) =>
                            handleInputChange("skinType", e.target.value)
                        }
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "14px",
                        }}
                    >
                        <option value="">Select your skin type</option>
                        {skinTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Symptoms */}
                <div style={{ marginBottom: "24px" }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "8px",
                        }}
                    >
                        Current Symptoms
                    </label>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "8px",
                        }}
                    >
                        {symptomOptions.map((symptom) => (
                            <label
                                key={symptom}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "8px",
                                    background: formData.symptoms.includes(
                                        symptom
                                    )
                                        ? "#f0f9ff"
                                        : "#f9fafb",
                                    border: "1px solid",
                                    borderColor: formData.symptoms.includes(
                                        symptom
                                    )
                                        ? "#3b82f6"
                                        : "#e5e7eb",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.symptoms.includes(
                                        symptom
                                    )}
                                    onChange={() =>
                                        handleSymptomToggle(symptom)
                                    }
                                    style={{ marginRight: "8px" }}
                                />
                                {symptom}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Duration */}
                <div style={{ marginBottom: "24px" }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "8px",
                        }}
                    >
                        How long have you had this concern?
                    </label>
                    <select
                        value={formData.duration}
                        onChange={(e) =>
                            handleInputChange("duration", e.target.value)
                        }
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "14px",
                        }}
                    >
                        <option value="">Select duration</option>
                        <option value="less-than-week">Less than a week</option>
                        <option value="1-2-weeks">1-2 weeks</option>
                        <option value="1-month">About a month</option>
                        <option value="2-3-months">2-3 months</option>
                        <option value="6-months">About 6 months</option>
                        <option value="over-year">Over a year</option>
                    </select>
                </div>

                {/* Previous Treatments */}
                <div style={{ marginBottom: "24px" }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "8px",
                        }}
                    >
                        Previous Treatments Tried
                    </label>
                    <textarea
                        value={formData.previousTreatments}
                        onChange={(e) =>
                            handleInputChange(
                                "previousTreatments",
                                e.target.value
                            )
                        }
                        placeholder="List any treatments, medications, or products you've tried..."
                        rows="3"
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "14px",
                            resize: "vertical",
                        }}
                    />
                </div>

                {/* Allergies */}
                <div style={{ marginBottom: "24px" }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "8px",
                        }}
                    >
                        Known Allergies
                    </label>
                    <textarea
                        value={formData.allergies}
                        onChange={(e) =>
                            handleInputChange("allergies", e.target.value)
                        }
                        placeholder="List any known allergies to skincare ingredients or medications..."
                        rows="2"
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "14px",
                            resize: "vertical",
                        }}
                    />
                </div>

                {/* Urgency */}
                <div style={{ marginBottom: "24px" }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "8px",
                        }}
                    >
                        Urgency Level
                    </label>
                    <select
                        value={formData.urgency}
                        onChange={(e) =>
                            handleInputChange("urgency", e.target.value)
                        }
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "14px",
                        }}
                    >
                        <option value="low">Low - Can wait a few days</option>
                        <option value="medium">
                            Medium - Would like response within 24 hours
                        </option>
                        <option value="high">
                            High - Need response as soon as possible
                        </option>
                    </select>
                </div>

                {/* Photo Upload for Photo Reviews */}
                {consultationType === "photo_review" && (
                    <div style={{ marginBottom: "24px" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#374151",
                                marginBottom: "8px",
                            }}
                        >
                            Upload Photos * (Max 5 photos)
                        </label>
                        <div
                            style={{
                                border: "2px dashed #e5e7eb",
                                borderRadius: "8px",
                                padding: "24px",
                                textAlign: "center",
                                background: "#fafafa",
                            }}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoUpload}
                                disabled={uploading || photos.length >= 5}
                                style={{ display: "none" }}
                                id="photo-upload"
                            />
                            <label
                                htmlFor="photo-upload"
                                style={{
                                    display: "inline-block",
                                    padding: "12px 24px",
                                    background:
                                        uploading || photos.length >= 5
                                            ? "#d1d5db"
                                            : "#3b82f6",
                                    color: "white",
                                    borderRadius: "8px",
                                    cursor:
                                        uploading || photos.length >= 5
                                            ? "not-allowed"
                                            : "pointer",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                }}
                            >
                                {uploading ? "Uploading..." : "Choose Photos"}
                            </label>
                            <p
                                style={{
                                    marginTop: "8px",
                                    fontSize: "12px",
                                    color: "#6b7280",
                                }}
                            >
                                Upload clear photos of the affected area.{" "}
                                {photos.length}/5 photos uploaded.
                            </p>
                        </div>

                        {/* Photo Previews */}
                        {photos.length > 0 && (
                            <div
                                style={{
                                    marginTop: "16px",
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fit, minmax(150px, 1fr))",
                                    gap: "12px",
                                }}
                            >
                                {photos.map((photo, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "8px",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <img
                                            src={photo.preview}
                                            alt={`Upload ${index + 1}`}
                                            style={{
                                                width: "100%",
                                                height: "120px",
                                                objectFit: "cover",
                                            }}
                                        />
                                        <div style={{ padding: "8px" }}>
                                            <input
                                                type="text"
                                                placeholder="Description (optional)"
                                                value={photo.description}
                                                onChange={(e) =>
                                                    updatePhotoDescription(
                                                        index,
                                                        e.target.value
                                                    )
                                                }
                                                style={{
                                                    width: "100%",
                                                    padding: "4px",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "4px",
                                                    fontSize: "12px",
                                                    marginBottom: "4px",
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removePhoto(index)
                                                }
                                                style={{
                                                    width: "100%",
                                                    padding: "4px",
                                                    background: "#ef4444",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    fontSize: "12px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Consultation Fee and Payment Options */}
                {consultationType && (
                    <div
                        style={{
                            background: "#f0f9ff",
                            border: "1px solid #dbeafe",
                            borderRadius: "8px",
                            padding: "16px",
                            marginBottom: "24px",
                        }}
                    >
                        <h3
                            style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#1e40af",
                                marginBottom: "8px",
                            }}
                        >
                            Consultation Fee: ${getConsultationFee()}
                        </h3>
                        <p
                            style={{
                                fontSize: "14px",
                                color: "#1e40af",
                                marginBottom: "12px",
                            }}
                        >
                            {consultationType === "video_call" &&
                                "Video consultations include a live 30-minute session. "}
                            Payment is required to confirm your booking.
                        </p>

                        {/* Payment Options */}
                        <div style={{ marginTop: "12px" }}>
                            <h4
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#1e40af",
                                    marginBottom: "8px",
                                }}
                            >
                                Available Payment Options:
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <button type="button" onClick={payWithCard} disabled={payLoading}
                                    style={{ padding: '8px 12px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, cursor: payLoading ? 'not-allowed' : 'pointer' }}>
                                    💳 Pay with Card (Stripe)
                                </button>
                                <button type="button" onClick={payWithBkash} disabled={payLoading}
                                    style={{ padding: '8px 12px', background: '#c026d3', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, cursor: payLoading ? 'not-allowed' : 'pointer' }}>
                                    📱 Pay with bKash (Sandbox)
                                </button>
                            </div>
                            <p
                                style={{
                                    fontSize: "12px",
                                    color: "#6b7280",
                                    marginTop: "8px",
                                }}
                            >Secure card payments via Stripe, and mobile via bKash sandbox.</p>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={
                        submitting ||
                        uploading ||
                        (consultationType === "photo_review" &&
                            photos.length === 0)
                    }
                    style={{
                        width: "100%",
                        padding: "16px",
                        background:
                            submitting ||
                            uploading ||
                            (consultationType === "photo_review" &&
                                photos.length === 0)
                                ? "#d1d5db"
                                : "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "16px",
                        fontWeight: "600",
                        cursor:
                            submitting ||
                            uploading ||
                            (consultationType === "photo_review" &&
                                photos.length === 0)
                                ? "not-allowed"
                                : "pointer",
                    }}
                >
                    {submitting
                        ? "Submitting Request..."
                        : `Book ${
                              consultationType === "video_call" ? "Video " : ""
                          }Consultation`}
                </button>
            </form>
        </div>
    );
}
