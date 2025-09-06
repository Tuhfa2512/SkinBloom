import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../auth";

/*
  New universal landing / home page.
  - Shows marketing hero, categories, collection highlight, trending products
  - If user logged in: greets by name & swaps primary CTA
  - Uses public products endpoint for data
*/

export default function SimpleDashboard() {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let ignore = false;
        async function load() {
            try {
                setLoading(true);
                const { data } = await API.get("/products");
                // API returns an object: { products: [...], pagination: {...} }
                const list = Array.isArray(data?.products)
                    ? data.products
                    : Array.isArray(data)
                    ? data
                    : [];
                if (!ignore) setProducts(list);
            } catch (e) {
                console.error("Products load failed:", e);
                if (!ignore) setError("Failed to load products");
            } finally {
                if (!ignore) setLoading(false);
            }
        }
        load();
        return () => {
            ignore = true;
        };
    }, []);

    const categories = ["Cleanser", "Moisturizer", "Mask", "Sunscreen", "Lip"];
    const trending = products.slice(0, 8);

    return (
        <div className="landing-wrapper">
            {/* Hero */}
            <section className="hero-banner">
                <div className="hero-inner">
                    <div className="hero-text">
                        <h1>
                            Natural Skincare
                            <br />
                            <span>Daily Routine</span>
                        </h1>
                        <p className="hero-tagline">
                            {user
                                ? `Welcome back ${user.name}. Continue nurturing your skin with clean, science‑backed formulas.`
                                : "Products that harness the power of 100% natural, dermatologist guided formulation."}
                        </p>
                        <div className="hero-ctas">
                            <Link to="/products" className="btn primary">
                                Shop Products
                            </Link>
                            {!user && (
                                <Link to="/register" className="btn ghost">
                                    Create Account
                                </Link>
                            )}
                            {user && user.role === "user" && (
                                <Link to="/dashboard" className="btn ghost">
                                    My Dashboard
                                </Link>
                            )}
                        </div>
                    </div>
                    <div
                        className="hero-art hero-art--image"
                        aria-hidden="true"
                    >
                        <img
                            src="../category images/eb9f1214-559d-4a62-b7ca-166303c53d99.jpg"
                            alt="Minimal skincare products with branch shadow"
                            className="hero-art-img"
                            onError={(e) => {
                                e.currentTarget.style.opacity = "0";
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="categories-block">
                <h2 className="section-heading">Popular Categories</h2>
                <div className="category-scroller">
                    {categories.map((c) => (
                        <Link key={c} to="/products" className="category-pill">
                            <div className="cat-img" />
                            <span>{c}</span>
                        </Link>
                    ))}
                    {categories.length === 0 && (
                        <div className="category-empty">
                            {loading ? "Loading…" : "No categories yet"}
                        </div>
                    )}
                </div>
            </section>

            {/* Collection Highlight */}
            <section className="collection-highlight">
                <div className="highlight-grid">
                    <div className="highlight-text">
                        <p className="eyebrow">Best of Collection 2025</p>
                        <h3>Discover a Best of the Best world of Herbal</h3>
                        <p className="lead">
                            Our therapy‑inspired range brings advanced
                            botanicals together with dermatologist expertise for
                            healthy, resilient skin.
                        </p>
                        <Link to="/products" className="btn slim">
                            Explore Collection
                        </Link>
                    </div>
                    <div className="highlight-media" />
                </div>
            </section>

            {/* Trending Products */}
            <section className="trending-products">
                <div className="section-header-row">
                    <h2 className="section-heading">Trending Products</h2>
                    <Link to="/products" className="view-all-link">
                        View all →
                    </Link>
                </div>
                {error && <div className="error-inline">{error}</div>}
                <div className="product-grid">
                    {loading && trending.length === 0 && (
                        <div className="loading-placeholder">
                            Loading products…
                        </div>
                    )}
                    {!loading && trending.length === 0 && !error && (
                        <div className="empty-placeholder">
                            No products available
                        </div>
                    )}
                    {trending.map((p) => (
                        <Link
                            key={p?._id || Math.random()}
                            to={p?._id ? `/products/${p._id}` : "#"}
                            className="product-card"
                        >
                            <div
                                className="product-thumb"
                                style={{
                                    backgroundImage: `url(${p?.image || ""})`,
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

            {/* CTA Footer */}
            <section className="bottom-cta">
                <h2>
                    {user
                        ? "Keep glowing with SkinBloom"
                        : "Having a place set aside for consistent care changes everything"}
                </h2>
                <p>
                    {user
                        ? "Jump back into your personalized routine or explore new arrivals curated for you."
                        : "Create your free account to build routines, track progress and shop dermatologist‑recommended products."}
                </p>
                <div className="hero-ctas">
                    <Link to="/products" className="btn primary">
                        Shop Products
                    </Link>
                    {!user && (
                        <Link to="/register" className="btn ghost">
                            Create Account
                        </Link>
                    )}
                    {user && user.role === "user" && (
                        <Link to="/dashboard" className="btn ghost">
                            Go to Dashboard
                        </Link>
                    )}
                </div>
            </section>
        </div>
    );
}
