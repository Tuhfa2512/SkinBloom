import "./styles.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, RoleBasedRedirect } from "./components/ProtectedRoute";
import App from "./ui/App.jsx";
import SimpleDashboard from "./ui/SimpleDashboard.jsx";
import Dashboard from "./ui/Dashboard.jsx";
import AdminDashboard from "./ui/AdminDashboard.jsx";
import DermatologistDashboard from "./ui/DermatologistDashboard.jsx";
import Login from "./ui/Login.jsx";
import Register from "./ui/Register.jsx";
import Profile from "./ui/Profile.jsx";
import Products from "./ui/Products.jsx";
import ProductDetail from "./ui/ProductDetail.jsx";
import ProductDetailDebug from "./ui/ProductDetailDebug.jsx";
import BuyNowTest from "./ui/BuyNowTest.jsx";
import Wishlist from "./ui/Wishlist.jsx";
import Cart from "./ui/Cart.jsx";
import SimpleCart from "./ui/SimpleCart.jsx";
import CartDebug from "./ui/CartDebug.jsx";
import CartDebugPage from "./ui/CartDebugPage.jsx";
import Checkout from "./ui/Checkout.jsx";
import PaymentSuccess from "./ui/PaymentSuccess.jsx";
import PaymentCancel from "./ui/PaymentCancel.jsx";
import Routine from "./ui/Routine.jsx";
import Feedback from "./ui/Feedback.jsx";
import Timeline from "./ui/Timeline.jsx";
import Tickets from "./ui/Tickets.jsx";
import TicketDetails from "./ui/TicketDetails.jsx";
import ConsultationRequest from "./ui/ConsultationRequest.jsx";
import UserBookings from "./ui/UserBookings.jsx";
import Notifications from "./ui/Notifications.jsx";
import Unauthorized from "./ui/Unauthorized.jsx";
const root = createRoot(document.getElementById("root"));
root.render(
    <BrowserRouter>
        <AuthProvider>
            <Routes>
                <Route path="/" element={<App />}>
                    <Route index element={<SimpleDashboard />} />

                    {/* Public routes */}
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="unauthorized" element={<Unauthorized />} />

                    {/* Semi-public routes - accessible to logged in users */}
                    <Route
                        path="products"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "user",
                                    "dermatologist",
                                    "admin",
                                ]}
                            >
                                <Products />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="products/:id"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "user",
                                    "dermatologist",
                                    "admin",
                                ]}
                            >
                                <ProductDetail />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="products/:id/debug"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "user",
                                    "dermatologist",
                                    "admin",
                                ]}
                            >
                                <ProductDetailDebug />
                            </ProtectedRoute>
                        }
                    />

                    {/* Protected routes - Auto redirect based on role */}
                    <Route
                        path="auto-redirect"
                        element={<RoleBasedRedirect />}
                    />

                    {/* User routes */}
                    <Route
                        path="dashboard"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="wishlist"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <Wishlist />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="cart"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <Cart />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="cart-simple"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <SimpleCart />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="cart-debug"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <CartDebug />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="cart-debug-page"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <CartDebugPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="checkout"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <Checkout />
                            </ProtectedRoute>
                        }
                    />

                    {/* Payment routes - accessible without strict authentication for guest checkout */}
                    <Route
                        path="payment/success"
                        element={<PaymentSuccess />}
                    />
                    <Route path="payment/cancel" element={<PaymentCancel />} />
                    <Route
                        path="bookings/:id/payment/success"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <PaymentSuccess />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="test/buynow"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "user",
                                    "dermatologist",
                                    "admin",
                                ]}
                            >
                                <BuyNowTest />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="profile"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "user",
                                    "dermatologist",
                                    "admin",
                                ]}
                            >
                                <Profile />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="routine"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <Routine />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="feedback"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <Feedback />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="timeline"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <Timeline />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="tickets"
                        element={
                            <ProtectedRoute
                                allowedRoles={["user", "dermatologist"]}
                            >
                                <Tickets />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="tickets/:id"
                        element={
                            <ProtectedRoute
                                allowedRoles={["user", "dermatologist"]}
                            >
                                <TicketDetails />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="notifications"
                        element={
                            <ProtectedRoute
                                allowedRoles={["user", "dermatologist", "admin"]}
                            >
                                <Notifications />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="consultation-request"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <ConsultationRequest />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="my-bookings"
                        element={
                            <ProtectedRoute allowedRoles={["user"]}>
                                <UserBookings />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin routes */}
                    <Route
                        path="admin/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Dermatologist routes */}
                    <Route
                        path="dermatologist/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={["dermatologist"]}>
                                <DermatologistDashboard />
                            </ProtectedRoute>
                        }
                    />
                </Route>
            </Routes>
        </AuthProvider>
    </BrowserRouter>
);
