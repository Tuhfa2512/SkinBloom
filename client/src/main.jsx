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
                        element={<Products />}
                    />
            </Routes>
        </AuthProvider>
    </BrowserRouter>
);
