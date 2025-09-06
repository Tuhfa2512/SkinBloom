import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../auth";
import Button from "../components/Button";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState({
        search: "",
        category: "",
        skinType: "",
        priceMin: "",
        priceMax: "",
        sortBy: "popular",
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        pages: 0,
    });
    const [wishlist, setWishlist] = useState([]);
    const [cart, setCart] = useState({ items: [] });

    useEffect(() => {
        fetchProducts();
        fetchWishlist();
        fetchCart();
    }, [filters, pagination.page]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...filters,
            });

            const { data } = await API.get(`/products?${params}`);
            setProducts(data.products);
            setPagination((prev) => ({
                ...prev,
                total: data.pagination.total,
                pages: data.pagination.pages,
            }));
        } catch (err) {
            setError("Failed to load products");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWishlist = async () => {
        try {
            const { data } = await API.get("/wishlist");
            setWishlist(data.products?.map((item) => item.productId._id) || []);
        } catch (err) {
            // Ignore errors for wishlist (user might not be logged in)
        }
    };

    const fetchCart = async () => {
        try {
            const { data } = await API.get("/cart");
            setCart(data);
        } catch (err) {
            // Ignore errors for cart (user might not be logged in)
        }
    };

    const toggleWishlist = async (productId) => {
        try {
            const isInWishlist = wishlist.includes(productId);

            if (isInWishlist) {
                await API.delete(`/wishlist/remove/${productId}`);
                setWishlist((prev) => prev.filter((id) => id !== productId));
            } else {
                await API.post("/wishlist/add", { productId });
                setWishlist((prev) => [...prev, productId]);
            }
        } catch (err) {
            console.error("Wishlist error:", err);
        }
    };

    const addToCart = async (productId) => {
        try {
            const { data } = await API.post("/cart/add", {
                productId,
                quantity: 1,
            });
            setCart(data);
            alert("Product added to cart!");
        } catch (err) {
            alert(err.response?.data?.error || "Failed to add to cart");
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const resetFilters = () => {
        setFilters({
            search: "",
            category: "",
            skinType: "",
            priceMin: "",
            priceMax: "",
            sortBy: "popular",
        });
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    if (loading && products.length === 0) {
        return (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: "18px", color: "var(--muted)" }}>
                    Loading products...
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#ffffff" }}>
            {/* Header */}
            <div className="products-header-bar">
                <div className="products-header-inner">
                    <div className="products-header-left">
                        <h1>Skincare Products</h1>
                        <p>
                            Showing {products.length} of {pagination.total}{" "}
                            products
                        </p>
                    </div>
                    <div className="products-header-right">
                        <Link to="/cart" className="cart-chip">
                            🛒 Cart ({cart.totalItems || 0})
                        </Link>
                    </div>
                </div>
            </div>

            <div className="products-shell">
                {/* Filters */}
                <div className="filters-panel">
                    <div className="filters-grid">
                        <input
                            className="input"
                            type="text"
                            placeholder="Search products..."
                            value={filters.search}
                            onChange={(e) =>
                                handleFilterChange("search", e.target.value)
                            }
                            style={{ padding: "10px 12px" }}
                        />

                        <select
                            className="input"
                            value={filters.category}
                            onChange={(e) =>
                                handleFilterChange("category", e.target.value)
                            }
                            style={{ padding: "10px 12px" }}
                        >
                            <option value="">All Categories</option>
                            <option value="Cleanser">Cleanser</option>
                            <option value="Toner">Toner</option>
                            <option value="Serum">Serum</option>
                            <option value="Treatment">Treatment</option>
                            <option value="Moisturizer">Moisturizer</option>
                            <option value="Sunscreen">Sunscreen</option>
                        </select>

                        <select
                            className="input"
                            value={filters.skinType}
                            onChange={(e) =>
                                handleFilterChange("skinType", e.target.value)
                            }
                            style={{ padding: "10px 12px" }}
                        >
                            <option value="">All Skin Types</option>
                            <option value="All">All Skin Types</option>
                            <option value="Dry">Dry</option>
                            <option value="Oily">Oily</option>
                            <option value="Combination">Combination</option>
                            <option value="Sensitive">Sensitive</option>
                            <option value="Normal">Normal</option>
                        </select>

                        <select
                            className="input"
                            value={filters.sortBy}
                            onChange={(e) =>
                                handleFilterChange("sortBy", e.target.value)
                            }
                            style={{ padding: "10px 12px" }}
                        >
                            <option value="popular">Most Popular</option>
                            <option value="rating">Highest Rated</option>
                            <option value="price-low">
                                Price: Low to High
                            </option>
                            <option value="price-high">
                                Price: High to Low
                            </option>
                            <option value="name">Name A-Z</option>
                            <option value="newest">Newest</option>
                        </select>
                    </div>

                    <div className="price-row-inline">
                        <input
                            className="input"
                            type="number"
                            placeholder="Min price"
                            value={filters.priceMin}
                            onChange={(e) =>
                                handleFilterChange("priceMin", e.target.value)
                            }
                            style={{ width: "120px" }}
                        />
                        <span style={{ color: "#718096" }}>-</span>
                        <input
                            className="input"
                            type="number"
                            placeholder="Max price"
                            value={filters.priceMax}
                            onChange={(e) =>
                                handleFilterChange("priceMax", e.target.value)
                            }
                            style={{ width: "120px" }}
                        />
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={resetFilters}
                        >
                            Clear Filters
                        </Button>
                    </div>
                </div>

                {error && (
                    <div
                        style={{
                            background: "#fed7d7",
                            border: "1px solid #fc8181",
                            borderRadius: "6px",
                            padding: "12px",
                            marginBottom: "20px",
                            color: "#9b2c2c",
                            fontSize: "14px",
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Products Grid */}
                <div className="products-grid-full compact-grid">
                    {products.map((product) => (
                        <ProductCard
                            key={product._id}
                            product={product}
                            isInWishlist={wishlist.includes(product._id)}
                            onToggleWishlist={() => toggleWishlist(product._id)}
                            onAddToCart={() => addToCart(product._id)}
                            compact
                        />
                    ))}
                </div>

                {products.length === 0 && !loading && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "60px 20px",
                            background: "white",
                            borderRadius: "12px",
                            border: "1px solid var(--border-color)",
                        }}
                    >
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                            🔍
                        </div>
                        <h3 style={{ marginBottom: "8px" }}>
                            No products found
                        </h3>
                        <p
                            style={{
                                color: "var(--muted)",
                                marginBottom: "20px",
                            }}
                        >
                            Try adjusting your filters or search terms
                        </p>
                        <Button onClick={resetFilters}>
                            Clear All Filters
                        </Button>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "8px",
                            marginTop: "40px",
                        }}
                    >
                        <button
                            className="btn secondary"
                            disabled={pagination.page === 1}
                            onClick={() =>
                                setPagination((prev) => ({
                                    ...prev,
                                    page: prev.page - 1,
                                }))
                            }
                        >
                            Previous
                        </button>

                        {Array.from(
                            { length: Math.min(pagination.pages, 5) },
                            (_, i) => {
                                const page = i + 1;
                                return (
                                    <button
                                        key={page}
                                        className={`btn ${
                                            page === pagination.page
                                                ? ""
                                                : "secondary"
                                        }`}
                                        onClick={() =>
                                            setPagination((prev) => ({
                                                ...prev,
                                                page,
                                            }))
                                        }
                                    >
                                        {page}
                                    </button>
                                );
                            }
                        )}

                        <button
                            className="btn secondary"
                            disabled={pagination.page === pagination.pages}
                            onClick={() =>
                                setPagination((prev) => ({
                                    ...prev,
                                    page: prev.page + 1,
                                }))
                            }
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
            {/* Full width styles */}
            <style>{`
        .products-header-bar {background:#f8f9fa;border-bottom:1px solid #e9ecef;padding:18px 0;margin:0 0 8px 0;}
        .products-header-inner {max-width:1800px;margin:0 auto;padding:0 40px;display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;}
        .products-header-left h1 {font-size:28px;margin:0;color:#1f2937;font-weight:700;}
        .products-header-left p {margin:4px 0 0 0;font-size:14px;color:#64748b;}
        .cart-chip {background:#ffffff;border:1px solid #e2e8f0;padding:10px 18px;border-radius:8px;font-size:14px;text-decoration:none;color:#1f2937;font-weight:500;display:flex;align-items:center;gap:6px;}
        .products-shell {width:100%;max-width:1900px;margin:0 auto;padding:10px 40px 60px;}
        .filters-panel {background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px 28px;margin:0 0 32px 0;}
        .filters-grid {display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px;margin:0 0 16px 0;}
        .filters-panel .input {border:1px solid #e2e8f0;border-radius:8px;font-size:14px;background:#f9fafb;}
        .filters-panel .input:focus {outline:2px solid #3b82f6;background:#fff;}
        .price-row-inline {display:flex;gap:14px;align-items:center;flex-wrap:wrap;}
    .products-grid-full {display:grid;gap:36px;margin:0 0 40px;}
    .products-grid-full.compact-grid {grid-template-columns: repeat(5, 1fr);} 
    @media (max-width: 1400px){ .products-grid-full.compact-grid {grid-template-columns: repeat(4, 1fr);} }
    @media (max-width: 1100px){ .products-grid-full.compact-grid {grid-template-columns: repeat(3, 1fr);} }
    @media (max-width: 800px){ .products-grid-full.compact-grid {grid-template-columns: repeat(2, 1fr);} }
    @media (max-width: 520px){ .products-grid-full.compact-grid {grid-template-columns: 1fr;} }
        @media (max-width:900px){ .products-header-inner{padding:0 20px;} .products-shell{padding:10px 20px 60px;} }
        @media (max-width:600px){ .filters-panel{padding:20px;} .products-grid-full{gap:20px;} }
      `}</style>
        </div>
    );
}

function ProductCard({ product, isInWishlist, onToggleWishlist, onAddToCart, compact=false }) {
    const discountedPrice =
        product.discount > 0
            ? product.price * (1 - product.discount / 100)
            : product.price;

    const [imageError, setImageError] = useState(false);

    const cardBase = compact ? {
        background: "#fff",
        border: "1px solid #f1f5f9",
        borderRadius: "18px",
        overflow: "hidden",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "pointer",
        boxShadow: "0 14px 32px -12px rgba(0,0,0,0.10)",
    } : {
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        overflow: "hidden",
        transition: "all 0.2s ease",
        cursor: "pointer",
    };

    return (
        <div
            className={compact ? 'product-card-c' : undefined}
            style={cardBase}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = compact ? "0 26px 46px -18px rgba(0,0,0,0.18)" : "0 8px 25px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = compact ? "0 14px 32px -12px rgba(0,0,0,0.10)" : "none";
            }}
        >
            {/* Product Image */}
            <Link
                to={`/products/${product._id}`}
                style={{ textDecoration: "none", color: "inherit" }}
            >
                <div
                    style={{
                        height: compact ? "220px" : "240px",
                        background: imageError
                            ? "#f8fafc"
                            : `url(${product.image}) center/contain no-repeat`,
                        backgroundColor: "#f8fafc",
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {imageError && (
                        <div
                            style={{
                                fontSize: "48px",
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
                    {/* Badges */}
                    <div
                        style={{
                            position: "absolute",
                            top: "12px",
                            left: "12px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                        }}
                    >
                        {product.featured && (
                            <span
                                style={{
                                    background: "#3182ce",
                                    color: "white",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    textTransform: "uppercase",
                                }}
                            >
                                Featured
                            </span>
                        )}
                        {product.discount > 0 && (
                            <span
                                style={{
                                    background: "#e53e3e",
                                    color: "white",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                }}
                            >
                                -{product.discount}% OFF
                            </span>
                        )}
                    </div>

                    {/* Wishlist Button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleWishlist();
                        }}
                        style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            background: "rgba(255, 255, 255, 0.9)",
                            border: "none",
                            borderRadius: "50%",
                            width: "36px",
                            height: "36px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "16px",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "white";
                            e.currentTarget.style.transform = "scale(1.1)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                                "rgba(255, 255, 255, 0.9)";
                            e.currentTarget.style.transform = "scale(1)";
                        }}
                    >
                        {isInWishlist ? "❤️" : "🤍"}
                    </button>

            {/* Quick Add removed for compact grid */}
                </div>
            </Link>

        <div style={{ padding: compact ? "14px" : "16px" }}>
                <Link
                    to={`/products/${product._id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                >
                    {/* Brand */}
                    <div
                        style={{
                            fontSize: "12px",
                            color: "#718096",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "4px",
                        }}
                    >
                        {product.brand}
                    </div>

                    {/* Product Name */}
                    <h3
                        style={{
                            fontSize: compact ? "13px" : "14px",
                            fontWeight: 600,
                            lineHeight: 1.3,
                            margin: "0 0 8px 0",
                            color: "#111827",
                            minHeight: compact ? "34px" : "36px",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            textTransform: "capitalize",
                        }}
                    >
                        {product.name}
                    </h3>

                    {!compact && (
                        <div style={{ marginBottom: "8px" }}>
                            <span
                                style={{
                                    background: "#edf2f7",
                                    color: "#4a5568",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    fontSize: "11px",
                                    fontWeight: "500",
                                }}
                            >
                                {product.category}
                            </span>
                        </div>
                    )}

                    {/* Rating */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            marginBottom: compact ? "6px" : "8px",
                            minHeight: "16px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center" }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    style={{
                                        color:
                                            star <= Math.floor(product.rating)
                                                ? "#f59e0b"
                                                : "#e5e7eb",
                                        fontSize: "12px",
                                    }}
                                >
                                    ⭐
                                </span>
                            ))}
                        </div>
                        <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                            ({product.reviewCount || 0})
                        </span>
                    </div>

                    {/* Price */}
                    <div style={{ marginBottom: compact ? "10px" : "12px" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: compact ? "16px" : "16px",
                                    fontWeight: 700,
                                    color: "#059669",
                                }}
                            >
                                ${discountedPrice.toFixed(2)}
                            </span>
                            {product.discount > 0 && (
                                <>
                                    {!compact && (
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                color: "#a0aec0",
                                                textDecoration: "line-through",
                                            }}
                                        >
                                            ${product.price.toFixed(2)}
                                        </span>
                                    )}
                                    <span
                                        style={{
                                            fontSize: "11px",
                                            background: "#eab308",
                                            color: "#111827",
                                            padding: "2px 8px",
                                            borderRadius: "999px",
                                            fontWeight: 700,
                                            lineHeight: 1,
                                        }}
                                    >
                                        -{product.discount}%
                                    </span>
                                </>
                            )}
                        </div>
                        {!compact && product.discount > 0 && (
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: "#38a169",
                                    fontWeight: 600,
                                }}
                            >
                                Save ${
                                    (product.price - discountedPrice).toFixed(2)
                                }
                            </div>
                        )}
                    </div>
                </Link>

                {/* Action Buttons */}
                {compact ? (
                    <div className="hover-add" style={{ marginTop: 8 }}>
                        <button
                            onClick={onAddToCart}
                            disabled={!product.inStock}
                            style={{
                                width: "100%",
                                padding: "10px",
                                background: product.inStock ? "#10b981" : "#a0aec0",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: product.inStock ? "pointer" : "not-allowed",
                                transition: "transform 0.2s ease, background 0.2s ease",
                            }}
                        >
                            {product.inStock ? "Add to cart" : "Out of stock"}
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            onClick={onAddToCart}
                            disabled={!product.inStock}
                            style={{
                                flex: 1,
                                padding: "10px",
                                background: product.inStock ? "#3182ce" : "#a0aec0",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: "600",
                                cursor: product.inStock ? "pointer" : "not-allowed",
                                transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                if (product.inStock) {
                                    e.currentTarget.style.background = "#2c5aa0";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (product.inStock) {
                                    e.currentTarget.style.background = "#3182ce";
                                }
                            }}
                        >
                            {product.inStock ? "Add to Cart" : "Out of Stock"}
                        </button>

                        <Link
                            to={`/products/${product._id}`}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "40px",
                                height: "40px",
                                background: "#f7fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                color: "#4a5568",
                                textDecoration: "none",
                                fontSize: "16px",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#edf2f7";
                                e.currentTarget.style.borderColor = "#cbd5e0";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#f7fafc";
                                e.currentTarget.style.borderColor = "#e2e8f0";
                            }}
                        >
                            👁️
                        </Link>
                    </div>
                )}

                {/* Stock Status */}
                {product.inStock && product.stockQuantity <= 10 && (
                    <div
                        style={{
                            marginTop: "8px",
                            fontSize: "11px",
                            color: "#d69e2e",
                            fontWeight: "600",
                        }}
                    >
                        Only {product.stockQuantity} left!
                    </div>
                )}
            </div>

            <style>{`
                /* Hover add-to-cart reveal for compact cards */
                .product-card-c .hover-add { opacity: 0; transform: translateY(6px); transition: all .18s ease; }
                .product-card-c:hover .hover-add { opacity: 1; transform: translateY(0); }
            `}</style>
        </div>
    );
}
