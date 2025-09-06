import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../auth";
import { useAuth } from "../context/AuthContext";

// Lightweight star rating input used in the inline feedback form
function StarInput({ value = 0, onChange = () => {} }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        lineHeight: 1,
                        fontSize: 20,
                        color: star <= Math.floor(value) ? "#f59e0b" : "#e5e7eb",
                    }}
                >
                    ⭐
                </button>
            ))}
        </div>
    );
}

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const [buyingNow, setBuyingNow] = useState(false);
    const [addingToWishlist, setAddingToWishlist] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [imageError, setImageError] = useState(false);

    // Feedback state (inline review form)
    const [fbLoading, setFbLoading] = useState(false);
    const [fbSubmitting, setFbSubmitting] = useState(false);
    const [myFeedback, setMyFeedback] = useState({ rating: 5, reaction: "neutral", note: "" });
    const [hasExistingFeedback, setHasExistingFeedback] = useState(false);

    useEffect(() => {
        if (id) {
            fetchProduct();
            checkWishlistStatus();
        }
    }, [id]);

    useEffect(() => {
        // Load existing feedback for this product (current user)
        if (!id || !user) {
            return;
        }
        (async () => {
            try {
                setFbLoading(true);
                const { data } = await API.get("/feedback");
                const mine = (data || []).find((f) => (f.product?._id || f.product) === id);
                if (mine) {
                    setMyFeedback({ rating: mine.rating || 5, reaction: mine.reaction || "neutral", note: mine.note || "" });
                    setHasExistingFeedback(true);
                } else {
                    setMyFeedback({ rating: 5, reaction: "neutral", note: "" });
                    setHasExistingFeedback(false);
                }
            } catch (e) {
                // Non-blocking
            } finally {
                setFbLoading(false);
            }
        })();
    }, [id, user]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const { data } = await API.get(`/products/${id}`);
            setProduct(data);
        } catch (err) {
            setError("Product not found");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const checkWishlistStatus = async () => {
        try {
            const { data } = await API.get("/wishlist");
            setIsInWishlist(
                data.products?.some((item) => item.productId._id === id) ||
                    false
            );
        } catch (err) {
            // Ignore errors (user might not be logged in)
        }
    };

    const addToCart = async () => {
        try {
            setAddingToCart(true);
            await API.post("/cart/add", { productId: id, quantity });
            alert("Product added to cart!");
        } catch (err) {
            alert(err.response?.data?.error || "Failed to add to cart");
        } finally {
            setAddingToCart(false);
        }
    };

    const buyNow = async () => {
        try {
            setBuyingNow(true);
            console.log("Buy Now clicked - starting process...");

            // Check authentication first
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Please log in to continue");
                navigate("/login");
                return;
            }

            // First add to cart
            console.log("Adding to cart:", { productId: id, quantity });
            await API.post("/cart/add", { productId: id, quantity });
            console.log("Added to cart successfully");

            // Small delay to ensure cart is updated
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Then redirect to checkout
            console.log("Navigating to checkout...");
            navigate("/checkout");
            console.log("Navigation called");
        } catch (err) {
            console.error("Buy Now error:", err);
            if (err.response?.status === 401) {
                alert("Please log in to continue");
                navigate("/login");
            } else {
                alert(
                    err.response?.data?.error || "Failed to proceed to checkout"
                );
            }
        } finally {
            setBuyingNow(false);
        }
    };

    const toggleWishlist = async () => {
        try {
            setAddingToWishlist(true);
            if (isInWishlist) {
                await API.delete(`/wishlist/remove/${id}`);
                setIsInWishlist(false);
            } else {
                await API.post("/wishlist/add", { productId: id });
                setIsInWishlist(true);
            }
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update wishlist");
        } finally {
            setAddingToWishlist(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: "18px", color: "var(--muted)" }}>
                    Loading product...
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <h2>Product not found</h2>
                <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
                    The product you're looking for doesn't exist or has been
                    removed.
                </p>
                <button className="btn" onClick={() => navigate("/products")}>
                    Browse Products
                </button>
            </div>
        );
    }

    const discountedPrice =
        product.discount > 0
            ? product.price * (1 - product.discount / 100)
            : product.price;

    return (
        <div style={{ minHeight: "100vh", background: "#fafafa" }}>
            <div
                className="container"
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "40px 20px",
                }}
            >
                {/* Breadcrumb */}
                <div
                    style={{
                        marginBottom: "30px",
                        fontSize: "14px",
                        color: "var(--muted)",
                    }}
                >
                    <Link
                        to="/products"
                        style={{
                            color: "var(--primary-color)",
                            textDecoration: "none",
                        }}
                    >
                        Products
                    </Link>
                    <span style={{ margin: "0 8px" }}>•</span>
                    <span>{product.category}</span>
                    <span style={{ margin: "0 8px" }}>•</span>
                    <span>{product.name}</span>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "60px",
                        "@media (max-width: 768px)": {
                            gridTemplateColumns: "1fr",
                            gap: "30px",
                        },
                    }}
                >
                    {/* Product Images */}
                    <div>
                        <div
                            style={{
                                width: "100%",
                                height: "500px",
                                background: imageError
                                    ? "#f5f5f5"
                                    : `url(${product.image}) center/cover`,
                                backgroundColor: "#f5f5f5",
                                borderRadius: "12px",
                                marginBottom: "20px",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {imageError && (
                                <div
                                    style={{
                                        fontSize: "64px",
                                        color: "#cbd5e0",
                                        textAlign: "center",
                                    }}
                                >
                                    📦
                                </div>
                            )}
                            <img
                                src={product.image}
                                alt={product.name}
                                style={{ display: "none" }}
                                onError={() => setImageError(true)}
                                onLoad={() => setImageError(false)}
                            />
                            {product.featured && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "20px",
                                        left: "20px",
                                        background: "var(--primary-color)",
                                        color: "white",
                                        padding: "8px 16px",
                                        borderRadius: "20px",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                    }}
                                >
                                    Featured
                                </div>
                            )}
                            {product.discount > 0 && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "20px",
                                        right: "20px",
                                        background: "#dc2626",
                                        color: "white",
                                        padding: "8px 16px",
                                        borderRadius: "20px",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                    }}
                                >
                                    -{product.discount}%
                                </div>
                            )}
                        </div>

                        {/* Additional product images placeholder */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 1fr)",
                                gap: "12px",
                            }}
                        >
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    style={{
                                        height: "80px",
                                        background: imageError
                                            ? "#f5f5f5"
                                            : `url(${product.image}) center/cover`,
                                        backgroundColor: "#f5f5f5",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        border:
                                            selectedImage === i
                                                ? "2px solid var(--primary-color)"
                                                : "2px solid transparent",
                                        position: "relative",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                    onClick={() => setSelectedImage(i)}
                                >
                                    {imageError && (
                                        <div
                                            style={{
                                                fontSize: "24px",
                                                color: "#cbd5e0",
                                                textAlign: "center",
                                            }}
                                        >
                                            📦
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div>
                        <div style={{ marginBottom: "12px" }}>
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: "var(--muted)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    marginBottom: "8px",
                                }}
                            >
                                {product.brand}
                            </div>
                            <h1
                                style={{
                                    fontSize: "32px",
                                    fontWeight: "700",
                                    lineHeight: "1.2",
                                    marginBottom: "16px",
                                    color: "var(--text-color)",
                                }}
                            >
                                {product.name}
                            </h1>
                        </div>

                        {/* Rating */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                marginBottom: "20px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        style={{
                                            color:
                                                star <=
                                                Math.floor(product.rating)
                                                    ? "#ffc107"
                                                    : "#e0e0e0",
                                            fontSize: "18px",
                                        }}
                                    >
                                        ⭐
                                    </span>
                                ))}
                                <span
                                    style={{
                                        marginLeft: "8px",
                                        fontWeight: "600",
                                    }}
                                >
                                    {product.rating}
                                </span>
                            </div>
                            <span style={{ color: "var(--muted)" }}>
                                ({product.reviewCount} reviews)
                            </span>
                        </div>

                        {/* Price */}
                        <div style={{ marginBottom: "24px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    marginBottom: "8px",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "28px",
                                        fontWeight: "700",
                                        color: "var(--primary-color)",
                                    }}
                                >
                                    ${discountedPrice.toFixed(2)}
                                </span>
                                {product.discount > 0 && (
                                    <span
                                        style={{
                                            fontSize: "20px",
                                            color: "var(--muted)",
                                            textDecoration: "line-through",
                                        }}
                                    >
                                        ${product.price.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            {product.discount > 0 && (
                                <div
                                    style={{
                                        color: "#16a34a",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                    }}
                                >
                                    You save $
                                    {(product.price - discountedPrice).toFixed(
                                        2
                                    )}{" "}
                                    ({product.discount}% off)
                                </div>
                            )}
                        </div>

                        {/* Category & Step */}
                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                marginBottom: "20px",
                                flexWrap: "wrap",
                            }}
                        >
                            <span
                                style={{
                                    background: "var(--primary-light)",
                                    color: "var(--primary-color)",
                                    padding: "6px 12px",
                                    borderRadius: "20px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                }}
                            >
                                {product.category}
                            </span>
                            <span
                                style={{
                                    background: "#f0f0f0",
                                    color: "#666",
                                    padding: "6px 12px",
                                    borderRadius: "20px",
                                    fontSize: "14px",
                                }}
                            >
                                Step {product.step}
                            </span>
                            {product.inStock ? (
                                <span
                                    style={{
                                        background: "#e8f5e8",
                                        color: "#16a34a",
                                        padding: "6px 12px",
                                        borderRadius: "20px",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                    }}
                                >
                                    ✓ In Stock ({product.stockQuantity}{" "}
                                    available)
                                </span>
                            ) : (
                                <span
                                    style={{
                                        background: "#fee",
                                        color: "#dc2626",
                                        padding: "6px 12px",
                                        borderRadius: "20px",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                    }}
                                >
                                    Out of Stock
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        <div style={{ marginBottom: "24px" }}>
                            <p
                                style={{
                                    fontSize: "16px",
                                    lineHeight: "1.6",
                                    color: "var(--text-color)",
                                    marginBottom: "16px",
                                }}
                            >
                                {product.description}
                            </p>
                        </div>

                        {/* Skin Types */}
                        <div style={{ marginBottom: "24px" }}>
                            <h4
                                style={{
                                    marginBottom: "12px",
                                    color: "var(--text-color)",
                                }}
                            >
                                Suitable for:
                            </h4>
                            <div
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                }}
                            >
                                {(product.skinType || []).map((type) => (
                                    <span
                                        key={type}
                                        style={{
                                            background: "#e8f5e8",
                                            color: "#2d5016",
                                            padding: "4px 12px",
                                            borderRadius: "16px",
                                            fontSize: "14px",
                                        }}
                                    >
                                        {type}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Quantity Selector */}
                        {product.inStock && (
                            <div style={{ marginBottom: "24px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "8px",
                                        fontWeight: "600",
                                        color: "var(--text-color)",
                                    }}
                                >
                                    Quantity:
                                </label>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <button
                                        onClick={() =>
                                            setQuantity(
                                                Math.max(1, quantity - 1)
                                            )
                                        }
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                            border: "1px solid var(--border-color)",
                                            background: "white",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontSize: "18px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        -
                                    </button>
                                    <span
                                        style={{
                                            minWidth: "40px",
                                            textAlign: "center",
                                            fontSize: "16px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setQuantity(
                                                Math.min(
                                                    product.stockQuantity,
                                                    quantity + 1
                                                )
                                            )
                                        }
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                            border: "1px solid var(--border-color)",
                                            background: "white",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontSize: "18px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                marginBottom: "32px",
                            }}
                        >
                            <button
                                className="btn"
                                onClick={buyNow}
                                disabled={!product.inStock || buyingNow}
                                style={{
                                    flex: 1,
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    padding: "16px",
                                    background: product.inStock
                                        ? "#38a169"
                                        : "#ccc",
                                    cursor: product.inStock
                                        ? "pointer"
                                        : "not-allowed",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                }}
                            >
                                {buyingNow
                                    ? "Processing..."
                                    : product.inStock
                                    ? "Buy Now"
                                    : "Out of Stock"}
                            </button>

                            <button
                                className="btn"
                                onClick={addToCart}
                                disabled={!product.inStock || addingToCart}
                                style={{
                                    flex: 1,
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    padding: "16px",
                                    background: product.inStock
                                        ? undefined
                                        : "#ccc",
                                    cursor: product.inStock
                                        ? "pointer"
                                        : "not-allowed",
                                }}
                            >
                                {addingToCart
                                    ? "Adding..."
                                    : product.inStock
                                    ? "Add to Cart"
                                    : "Out of Stock"}
                            </button>

                            <button
                                onClick={toggleWishlist}
                                disabled={addingToWishlist}
                                style={{
                                    width: "56px",
                                    height: "56px",
                                    border: `2px solid ${
                                        isInWishlist
                                            ? "#dc2626"
                                            : "var(--border-color)"
                                    }`,
                                    background: isInWishlist
                                        ? "#dc2626"
                                        : "white",
                                    color: isInWishlist
                                        ? "white"
                                        : "var(--text-color)",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontSize: "20px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {addingToWishlist
                                    ? "..."
                                    : isInWishlist
                                    ? "❤️"
                                    : "🤍"}
                            </button>
                        </div>

                        {/* Your Review */}
                        <div style={{ marginBottom: "28px" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: 12, color: "#111827" }}>
                                {user ? "Your Review" : "Reviews"}
                            </h3>
                            {user ? (
                                <div style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 12, padding: 16 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                        <span style={{ fontSize: 14, color: "#6b7280", minWidth: 100 }}>Overall rating</span>
                                        <StarInput value={myFeedback.rating} onChange={(v) => setMyFeedback((s) => ({ ...s, rating: v }))} />
                                        <span style={{ fontWeight: 700 }}>{myFeedback.rating}/5</span>
                                    </div>

                                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                                        {[
                                            { v: "improvement", label: "✨ Improved" },
                                            { v: "neutral", label: "😐 No change" },
                                            { v: "irritation", label: "⚠️ Irritation" },
                                        ].map((opt) => (
                                            <button
                                                key={opt.v}
                                                type="button"
                                                onClick={() => setMyFeedback((s) => ({ ...s, reaction: opt.v }))}
                                                className={"reaction-pill" + (myFeedback.reaction === opt.v ? " active" : "")}
                                                style={{
                                                    border: "1px solid #e5e7eb",
                                                    background: myFeedback.reaction === opt.v ? "#ecfdf5" : "#fff",
                                                    color: myFeedback.reaction === opt.v ? "#065f46" : "#374151",
                                                    padding: "6px 10px",
                                                    borderRadius: 999,
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        value={myFeedback.note}
                                        onChange={(e) => setMyFeedback((s) => ({ ...s, note: e.target.value }))}
                                        rows={3}
                                        placeholder="Share a few details about your experience…"
                                        style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, fontSize: 14, resize: "vertical", marginBottom: 12 }}
                                    />

                                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                        <button
                                            className="btn"
                                            disabled={fbSubmitting}
                                            onClick={async () => {
                                                try {
                                                    setFbSubmitting(true);
                                                    await API.post("/feedback", { product: id, ...myFeedback });
                                                    setHasExistingFeedback(true);
                                                    alert("Review saved");
                                                } catch (e) {
                                                    alert(e.response?.data?.error || "Failed to save review");
                                                } finally {
                                                    setFbSubmitting(false);
                                                }
                                            }}
                                        >
                                            {fbSubmitting ? "Saving…" : hasExistingFeedback ? "Update Review" : "Submit Review"}
                                        </button>
                                        {hasExistingFeedback && <span style={{ color: "#6b7280", fontSize: 12 }}>Your review is visible only to you for now.</span>}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ border: "1px dashed #d1d5db", background: "#fff", borderRadius: 12, padding: 16 }}>
                                    <p style={{ margin: 0, color: "#6b7280" }}>Please log in to write a review.</p>
                                    <div style={{ marginTop: 12 }}>
                                        <Link className="btn" to="/login">Login</Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Additional Info Tabs */}
                        <div>
                            <ProductTabs product={product} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProductTabs({ product }) {
    const [activeTab, setActiveTab] = useState("ingredients");

    const tabs = [
        { id: "ingredients", label: "Ingredients" },
        { id: "benefits", label: "Benefits" },
        { id: "howToUse", label: "How to Use" },
    ];

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    borderBottom: "1px solid var(--border-color)",
                    marginBottom: "20px",
                }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: "12px 0",
                            marginRight: "32px",
                            background: "none",
                            border: "none",
                            borderBottom:
                                activeTab === tab.id
                                    ? "2px solid var(--primary-color)"
                                    : "2px solid transparent",
                            color:
                                activeTab === tab.id
                                    ? "var(--primary-color)"
                                    : "var(--muted)",
                            cursor: "pointer",
                            fontWeight: activeTab === tab.id ? "600" : "400",
                            fontSize: "16px",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ minHeight: "100px" }}>
                {activeTab === "ingredients" && (
                    <div>
                        <h4 style={{ marginBottom: "12px" }}>
                            Key Ingredients:
                        </h4>
                        <ul
                            style={{
                                lineHeight: "1.6",
                                color: "var(--text-color)",
                            }}
                        >
                            {product.ingredients?.map((ingredient, index) => (
                                <li key={index} style={{ marginBottom: "4px" }}>
                                    {ingredient}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {activeTab === "benefits" && (
                    <div>
                        <h4 style={{ marginBottom: "12px" }}>Key Benefits:</h4>
                        <ul
                            style={{
                                lineHeight: "1.6",
                                color: "var(--text-color)",
                            }}
                        >
                            {product.benefits?.map((benefit, index) => (
                                <li key={index} style={{ marginBottom: "4px" }}>
                                    {benefit}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {activeTab === "howToUse" && (
                    <div>
                        <h4 style={{ marginBottom: "12px" }}>How to Use:</h4>
                        <p
                            style={{
                                lineHeight: "1.6",
                                color: "var(--text-color)",
                            }}
                        >
                            {product.howToUse}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
