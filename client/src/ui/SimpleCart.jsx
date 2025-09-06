import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function SimpleCart() {
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log("SimpleCart: Component mounted");
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            console.log("SimpleCart: Starting to fetch cart");
            setLoading(true);
            const token = localStorage.getItem("token");
            console.log("SimpleCart: Token exists:", !!token);

            if (!token) {
                console.log("SimpleCart: No token, stopping");
                setLoading(false);
                return;
            }

            console.log("SimpleCart: Making API call");
            const response = await axios.get("http://localhost:5000/api/cart", {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("SimpleCart: API response:", response.data);
            setCart(response.data);
        } catch (error) {
            console.error("SimpleCart: Error fetching cart:", error);
            setError("Failed to load cart");
        } finally {
            console.log("SimpleCart: Setting loading to false");
            setLoading(false);
        }
    };

    console.log("SimpleCart: Rendering with state:", {
        loading,
        error,
        cart: cart ? "present" : "null",
    });

    if (loading) {
        return (
            <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>Loading cart...</h2>
                <p>Please wait while we load your cart.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
                <h2>Error loading cart</h2>
                <p>{error}</p>
                <button
                    onClick={fetchCart}
                    style={{ padding: "10px 20px", marginTop: "10px" }}
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>Your cart is empty</h2>
                <p>Start shopping to add items to your cart.</p>
                <Link
                    to="/products"
                    style={{
                        display: "inline-block",
                        padding: "10px 20px",
                        background: "#007bff",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "4px",
                        marginTop: "10px",
                    }}
                >
                    Shop Now
                </Link>
            </div>
        );
    }

    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
            <h1>Shopping Cart ({cart.items.length} items)</h1>

            <div style={{ marginBottom: "20px" }}>
                {cart.items.map((item) => (
                    <div
                        key={item.product._id}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            padding: "15px",
                            marginBottom: "15px",
                            display: "flex",
                            gap: "15px",
                        }}
                    >
                        <div
                            style={{
                                width: "80px",
                                height: "80px",
                                background: `url(${item.product.image}) center/cover`,
                                backgroundColor: "#f5f5f5",
                                borderRadius: "4px",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <img
                                src={item.product.image}
                                alt={item.product.name}
                                style={{ display: "none" }}
                                onError={(e) => {
                                    e.target.parentElement.style.background =
                                        "#f5f5f5";
                                    e.target.parentElement.innerHTML =
                                        '<div style="font-size: 24px; color: #cbd5e0;">📦</div>';
                                }}
                            />
                        </div>

                        <div style={{ flex: 1 }}>
                            <h3
                                style={{
                                    margin: "0 0 5px 0",
                                    fontSize: "16px",
                                }}
                            >
                                {item.product.name}
                            </h3>
                            <p
                                style={{
                                    margin: "0 0 5px 0",
                                    color: "#666",
                                    fontSize: "14px",
                                }}
                            >
                                {item.product.brand}
                            </p>
                            <p style={{ margin: "0", fontSize: "14px" }}>
                                Quantity: {item.quantity} × $
                                {item.product.price.toFixed(2)} = $
                                {(item.quantity * item.product.price).toFixed(
                                    2
                                )}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div
                style={{
                    border: "2px solid #007bff",
                    borderRadius: "8px",
                    padding: "20px",
                    background: "#f8f9fa",
                }}
            >
                <h3 style={{ margin: "0 0 10px 0" }}>Order Summary</h3>
                <div
                    style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        marginBottom: "15px",
                    }}
                >
                    Total: ${cart.totalAmount.toFixed(2)}
                </div>

                <button
                    onClick={() => navigate("/checkout")}
                    style={{
                        width: "100%",
                        padding: "15px",
                        background: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        cursor: "pointer",
                    }}
                >
                    Proceed to Checkout
                </button>
            </div>

            <div style={{ marginTop: "20px", textAlign: "center" }}>
                <Link
                    to="/products"
                    style={{ color: "#007bff", textDecoration: "none" }}
                >
                    ← Continue Shopping
                </Link>
            </div>
        </div>
    );
}

export default SimpleCart;
