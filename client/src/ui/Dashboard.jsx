import React, { useEffect, useState } from "react";
import API from "../auth";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CATS = ["Cleanser", "Serum", "Moisturizer", "Sunscreen", "Toner", "Mask"];

export default function Dashboard() {
    const nav = useNavigate();
    const { user } = useAuth();
    const [featured, setFeatured] = useState([]);

    useEffect(() => {
        // Load featured products
        (async () => {
            try {
                const { data } = await API.get("/products/featured");
                setFeatured((data || []).slice(0, 8));
            } catch (e) {
                console.log("Featured products API error:", e);
                // Fallback to regular products
                try {
                    const { data } = await API.get(
                        "/products?featured=true&limit=8"
                    );
                    setFeatured((data?.products || []).slice(0, 8));
                } catch (e2) {
                    console.log("Products API error:", e2);
                    // Use fallback data if API fails
                    setFeatured([
                        {
                            _id: "1",
                            name: "Axis-Y Dark Spot Correcting Glow Serum",
                            brand: "Axis-Y",
                            price: 25.99,
                            category: "Serum",
                        },
                        {
                            _id: "2",
                            name: "The Ordinary Niacinamide 10% + Zinc 1%",
                            brand: "The Ordinary",
                            price: 7.9,
                            category: "Serum",
                        },
                        {
                            _id: "3",
                            name: "CeraVe Hydrating Cleanser",
                            brand: "CeraVe",
                            price: 14.99,
                            category: "Cleanser",
                        },
                        {
                            _id: "4",
                            name: "La Roche-Posay Anthelios Ultra-Light Fluid SPF60",
                            brand: "La Roche-Posay",
                            price: 35.99,
                            category: "Sunscreen",
                        },
                    ]);
                }
            }
        })();
    }, []);

    return (
        <div style={{ display: "grid", gap: 0, minHeight: "100vh" }}>
            {/* Hero Section */}
            <section className="hero-banner">
                <div className="hero-inner">
                    <div className="hero-text">
                        <h1>
                            Transform Your Skincare Journey
                            <br />
                            <span>with SkinBloom</span>
                        </h1>
                        <p className="hero-tagline">
                            Personalized skincare routines, expert guidance, and
                            comprehensive tracking tools for healthier, glowing
                            skin
                        </p>
                        <div className="hero-ctas">
                            {!user ? (
                                <>
                                    <Link
                                        to="/register"
                                        className="btn primary"
                                    >
                                        Get Started Free
                                    </Link>
                                    <Link to="/products" className="btn ghost">
                                        Explore Products
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/profile" className="btn primary">
                                        Complete Your Profile
                                    </Link>
                                    <Link to="/routine" className="btn ghost">
                                        Build Routine
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                    <div
                        className="hero-art hero-art--image"
                        aria-hidden="true"
                    >
                        <div className="hero-art-bg hero-art-overlay soft-left-fade" />
                        <img
                            src="../category images/db2a9938-3c9a-46d9-af1e-7ec16256aa46.jpg"
                            alt="Minimal skincare products with branch shadow"
                            className="hero-art-img"
                            onError={(e) => {
                                e.currentTarget.style.opacity = "0";
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section
                style={{
                    padding: "100px 20px",
                    background: "#ffffff",
                }}
            >
                <div
                    style={{
                        maxWidth: "1200px",
                        margin: "0 auto",
                    }}
                >
                    <div
                        style={{
                            textAlign: "center",
                            marginBottom: "80px",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "3rem",
                                fontWeight: "700",
                                marginBottom: "24px",
                                color: "#1f2937",
                            }}
                        >
                            Everything You Need for Perfect Skin
                        </h2>
                        <p
                            style={{
                                fontSize: "1.25rem",
                                color: "#6b7280",
                                maxWidth: "700px",
                                margin: "0 auto",
                                lineHeight: "1.6",
                            }}
                        >
                            From personal skin profiling to professional
                            dermatologist consultations - everything you need
                            for healthy skin
                        </p>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(350px, 1fr))",
                            gap: 40,
                        }}
                    >
                        <Link to="/profile" style={{ textDecoration: "none" }}>
                            <div
                                style={{
                                    background:
                                        "linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%)",
                                    padding: "40px 30px",
                                    borderRadius: "20px",
                                    textAlign: "center",
                                    border: "1px solid #e5e7eb",
                                    transition:
                                        "transform 0.3s ease, box-shadow 0.3s ease",
                                    cursor: "pointer",
                                    height: "100%",
                                }}
                            >
                                <div
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
                                        width: "80px",
                                        height: "80px",
                                        borderRadius: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "0 auto 24px",
                                        fontSize: "32px",
                                    }}
                                >
                                    👤
                                </div>
                                <h3
                                    style={{
                                        fontSize: "24px",
                                        fontWeight: "600",
                                        marginBottom: "16px",
                                        color: "#1f2937",
                                    }}
                                >
                                    Personal Skin Profile
                                </h3>
                                <p
                                    style={{
                                        color: "#6b7280",
                                        lineHeight: "1.6",
                                    }}
                                >
                                    Upload photos, select skin type (oily, dry,
                                    combination, sensitive), include age,
                                    gender, allergies, and concerns for
                                    personalized care
                                </p>
                            </div>
                        </Link>

                        <Link to="/routine" style={{ textDecoration: "none" }}>
                            <div
                                style={{
                                    background:
                                        "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)",
                                    padding: "40px 30px",
                                    borderRadius: "20px",
                                    textAlign: "center",
                                    border: "1px solid #e5e7eb",
                                    transition:
                                        "transform 0.3s ease, box-shadow 0.3s ease",
                                    cursor: "pointer",
                                    height: "100%",
                                }}
                            >
                                <div
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                        width: "80px",
                                        height: "80px",
                                        borderRadius: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "0 auto 24px",
                                        fontSize: "32px",
                                    }}
                                >
                                    📋
                                </div>
                                <h3
                                    style={{
                                        fontSize: "24px",
                                        fontWeight: "600",
                                        marginBottom: "16px",
                                        color: "#1f2937",
                                    }}
                                >
                                    Routine Builder
                                </h3>
                                <p
                                    style={{
                                        color: "#6b7280",
                                        lineHeight: "1.6",
                                    }}
                                >
                                    Create AM/PM skincare routines with
                                    step-by-step product usage guides, set
                                    reminders, and track daily activities
                                </p>
                            </div>
                        </Link>

                        <Link to="/products" style={{ textDecoration: "none" }}>
                            <div
                                style={{
                                    background:
                                        "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
                                    padding: "40px 30px",
                                    borderRadius: "20px",
                                    textAlign: "center",
                                    border: "1px solid #e5e7eb",
                                    transition:
                                        "transform 0.3s ease, box-shadow 0.3s ease",
                                    cursor: "pointer",
                                    height: "100%",
                                }}
                            >
                                <div
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                                        width: "80px",
                                        height: "80px",
                                        borderRadius: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "0 auto 24px",
                                        fontSize: "32px",
                                    }}
                                >
                                    🛒
                                </div>
                                <h3
                                    style={{
                                        fontSize: "24px",
                                        fontWeight: "600",
                                        marginBottom: "16px",
                                        color: "#1f2937",
                                    }}
                                >
                                    Product Tracking
                                </h3>
                                <p
                                    style={{
                                        color: "#6b7280",
                                        lineHeight: "1.6",
                                    }}
                                >
                                    Add skincare products with ingredients, get
                                    suggestions based on skin type, rate
                                    products, and track reactions
                                </p>
                            </div>
                        </Link>

                        <Link to="/timeline" style={{ textDecoration: "none" }}>
                            <div
                                style={{
                                    background:
                                        "linear-gradient(135deg, #fef3f2 0%, #fecaca 100%)",
                                    padding: "40px 30px",
                                    borderRadius: "20px",
                                    textAlign: "center",
                                    border: "1px solid #e5e7eb",
                                    transition:
                                        "transform 0.3s ease, box-shadow 0.3s ease",
                                    cursor: "pointer",
                                    height: "100%",
                                }}
                            >
                                <div
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                        width: "80px",
                                        height: "80px",
                                        borderRadius: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "0 auto 24px",
                                        fontSize: "32px",
                                    }}
                                >
                                    📈
                                </div>
                                <h3
                                    style={{
                                        fontSize: "24px",
                                        fontWeight: "600",
                                        marginBottom: "16px",
                                        color: "#1f2937",
                                    }}
                                >
                                    Progress Timeline
                                </h3>
                                <p
                                    style={{
                                        color: "#6b7280",
                                        lineHeight: "1.6",
                                    }}
                                >
                                    Track your skincare journey with
                                    before/after photos, daily logs, and
                                    progress milestones over time
                                </p>
                            </div>
                        </Link>

                        <Link to="/tickets" style={{ textDecoration: "none" }}>
                            <div
                                style={{
                                    background:
                                        "linear-gradient(135deg, #f0f9ff 0%, #bae6fd 100%)",
                                    padding: "40px 30px",
                                    borderRadius: "20px",
                                    textAlign: "center",
                                    border: "1px solid #e5e7eb",
                                    transition:
                                        "transform 0.3s ease, box-shadow 0.3s ease",
                                    cursor: "pointer",
                                    height: "100%",
                                }}
                            >
                                <div
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                                        width: "80px",
                                        height: "80px",
                                        borderRadius: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "0 auto 24px",
                                        fontSize: "32px",
                                    }}
                                >
                                    🩺
                                </div>
                                <h3
                                    style={{
                                        fontSize: "24px",
                                        fontWeight: "600",
                                        marginBottom: "16px",
                                        color: "#1f2937",
                                    }}
                                >
                                    Professional Help
                                </h3>
                                <p
                                    style={{
                                        color: "#6b7280",
                                        lineHeight: "1.6",
                                    }}
                                >
                                    Submit consultation tickets to
                                    dermatologists, get expert advice, and
                                    receive personalized treatment
                                    recommendations
                                </p>
                            </div>
                        </Link>

                        <Link to="/feedback" style={{ textDecoration: "none" }}>
                            <div
                                style={{
                                    background:
                                        "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
                                    padding: "40px 30px",
                                    borderRadius: "20px",
                                    textAlign: "center",
                                    border: "1px solid #e5e7eb",
                                    transition:
                                        "transform 0.3s ease, box-shadow 0.3s ease",
                                    cursor: "pointer",
                                    height: "100%",
                                }}
                            >
                                <div
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
                                        width: "80px",
                                        height: "80px",
                                        borderRadius: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "0 auto 24px",
                                        fontSize: "32px",
                                    }}
                                >
                                    ❤️
                                </div>
                                <h3
                                    style={{
                                        fontSize: "24px",
                                        fontWeight: "600",
                                        marginBottom: "16px",
                                        color: "#1f2937",
                                    }}
                                >
                                    Favourites & Reviews
                                </h3>
                                <p
                                    style={{
                                        color: "#6b7280",
                                        lineHeight: "1.6",
                                    }}
                                >
                                    Save favorite products, write detailed
                                    reviews, rate effectiveness, and share
                                    experiences with the community
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Collection Highlight */}
            <section className="collection-highlight">
                <div className="highlight-grid">
                    <div className="highlight-text">
                        <p className="eyebrow">Natural Skincare</p>
                        <h3>Daily Routine</h3>
                        <p className="lead">
                            Welcome back {user?.name || "User"}. Continue
                            nurturing your skin with clean, science‑backed
                            formulas.
                        </p>
                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                marginTop: "24px",
                            }}
                        >
                            <Link to="/products" className="btn primary">
                                Shop Now
                            </Link>
                            <Link to="/dashboard" className="btn ghost">
                                My Dashboard
                            </Link>
                        </div>
                    </div>
                    <div className="highlight-media">
                        {/* Replace the src below with your own image placed in /public (e.g. /routine-hero.jpg) */}
                        <img
                            src="../category images/53f327ff-40e1-4ead-9443-b5ed9f9ce923.jpg"
                            alt="Daily skincare routine products neatly arranged"
                            className="highlight-img"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                            onError={(e) => {
                                e.currentTarget.style.objectFit = "contain";
                                e.currentTarget.style.background = "#f3f4f6";
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* Trending Products (matching landing page) */}
            <section className="trending-products">
                <div className="section-header-row">
                    <h2 className="section-heading">Trending Products</h2>
                    <Link to="/products" className="view-all-link">
                        View all →
                    </Link>
                </div>
                <div className="product-grid">
                    {featured.length === 0 && (
                        <div className="loading-placeholder">
                            Loading products…
                        </div>
                    )}
                    {featured.map((p) => (
                        <Link
                            key={p._id}
                            to={`/products/${p._id}`}
                            className="product-card"
                        >
                            <div
                                className="product-thumb"
                                style={{
                                    backgroundImage: `url(${p.image || ""})`,
                                }}
                            />
                            <div className="product-info">
                                <p className="brand">{p?.brand || "Brand"}</p>
                                <h4 className="name">{p?.name || "Product"}</h4>
                                <div className="price-row">
                                    <span className="price">
                                        $
                                        {typeof p?.price === "number"
                                            ? p.price.toFixed(2)
                                            : "0.00"}
                                    </span>
                                    {p?.discount > 0 && (
                                        <span className="badge-sale">
                                            -{p.discount}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Categories Section */}
            <section style={{ padding: "80px 20px", background: "#f9fafb" }}>
                <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "50px" }}>
                        <h2
                            style={{
                                fontSize: "2.5rem",
                                fontWeight: "700",
                                marginBottom: "16px",
                                color: "#1f2937",
                            }}
                        >
                            Shop by Category
                        </h2>
                        <p style={{ fontSize: "18px", color: "#6b7280" }}>
                            Find the perfect products for every step of your
                            routine
                        </p>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(160px, 1fr))",
                            gap: 20,
                        }}
                    >
                        {CATS.map((c, index) => {
                            const colors = [
                                "linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%)",
                                "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)",
                                "linear-gradient(135deg, #fef3f2 0%, #fecaca 100%)",
                                "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
                                "linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)",
                                "linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)",
                            ];
                            return (
                                <div
                                    key={c}
                                    onClick={() =>
                                        nav(
                                            `/products?category=${encodeURIComponent(
                                                c
                                            )}`
                                        )
                                    }
                                    style={{
                                        background:
                                            colors[index % colors.length],
                                        padding: "30px 20px",
                                        textAlign: "center",
                                        cursor: "pointer",
                                        borderRadius: "16px",
                                        border: "1px solid rgba(0,0,0,0.05)",
                                        transition: "all 0.3s ease",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "24px",
                                            fontWeight: "600",
                                            color: "#1f2937",
                                        }}
                                    >
                                        {c}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            {!user && (
                <section
                    style={{
                        padding: "80px 20px",
                        background:
                            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "white",
                        textAlign: "center",
                    }}
                >
                    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                        <h2
                            style={{
                                fontSize: "2.5rem",
                                fontWeight: "700",
                                marginBottom: "24px",
                            }}
                        >
                            Take Control of Your Skin Health
                        </h2>
                        <p
                            style={{
                                fontSize: "20px",
                                opacity: "0.9",
                                marginBottom: "40px",
                                lineHeight: "1.6",
                            }}
                        >
                            From personal skin profiling to professional
                            dermatologist consultations - build routines, track
                            progress, and get expert advice all in one place.
                        </p>
                        <div
                            style={{
                                display: "flex",
                                gap: 20,
                                justifyContent: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            <button
                                onClick={() => nav("/register")}
                                style={{
                                    background: "white",
                                    color: "#10b981",
                                    padding: "16px 32px",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    borderRadius: "12px",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    boxShadow:
                                        "0 4px 20px rgba(255,255,255,0.2)",
                                }}
                            >
                                👤 Create Your Profile
                            </button>
                            <button
                                onClick={() => nav("/products")}
                                style={{
                                    background: "transparent",
                                    color: "white",
                                    padding: "16px 32px",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    borderRadius: "12px",
                                    border: "2px solid white",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                🛍️ Browse Products
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
