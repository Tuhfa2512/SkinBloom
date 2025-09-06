import React, { useEffect, useRef, useState } from "react";
import {
    Link,
    NavLink,
    Outlet,
    useNavigate,
    useLocation,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../auth";

export default function App() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [unread, setUnread] = useState(0);
    const [recent, setRecent] = useState([]);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Check if we're on the home page
    const isHomePage = location.pathname === "/";

    useEffect(() => {
        // Remove cart tracking as products are removed
    }, []);

    // Fetch unread count and recent notifications (polling) when logged in
    useEffect(() => {
        if (!user) {
            return;
        }
        let cancelled = false;
        const fetchNotifications = async () => {
            try {
                const { data } = await API.get("/notifications", { params: { limit: 5 } });
                if (!cancelled) {
                    setUnread(data.unreadCount || 0);
                    setRecent((data.notifications || []).slice(0, 5));
                }
            } catch (e) {
                // ignore
            }
        };
        fetchNotifications();
        const id = setInterval(fetchNotifications, 15000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [user]);

    // Close dropdown on outside click
    useEffect(() => {
        const onClick = (e) => {
            if (open && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [open]);

    function getNavItems() {
        if (!user) {
            return [];
        }

        const commonItems = [{ to: "/profile", label: "Profile" }];

        switch (user.role) {
            case "admin":
                return [
                    { to: "/admin/dashboard", label: "Admin Dashboard" },
                    ...commonItems,
                ];
            case "dermatologist":
                return [
                    { to: "/dermatologist/dashboard", label: "Dashboard" },
                    { to: "/products", label: "Products" },
                    { to: "/tickets", label: "Consultations" },
                    ...commonItems,
                ];
            case "user":
            default:
                return [
                    { to: "/dashboard", label: "Dashboard" },
                    { to: "/products", label: "Shop" },
                    { to: "/consultation-request", label: "Book Consultation" },
                    { to: "/wishlist", label: "Wishlist" },
                    { to: "/cart", label: "Cart" },
                    { to: "/routine", label: "Routine" },
                    { to: "/timeline", label: "Progress" },
                    { to: "/tickets", label: "Help" },
                    ...commonItems,
                ];
        }
    }

    const navItems = getNavItems();

    return (
        <>
            {/* Header */}
            <div className="header">
                <div className="container navbar">
                    <Link to="/" className="logo">
                        SkinBloom
                    </Link>

                    <div className="nav-link-group">
                        {user ? (
                            <>
                                {/* Notifications bell */}
                                <div style={{ position: "relative" }} ref={dropdownRef}>
                                    <button
                                        className="nav-link"
                                        onClick={() => setOpen((v) => !v)}
                                        aria-label="Notifications"
                                        title="Notifications"
                                        style={{ position: "relative" }}
                                    >
                                        🔔
                                        {unread > 0 && (
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    right: 0,
                                                    transform: "translate(50%,-50%)",
                                                    background: "#ef4444",
                                                    color: "white",
                                                    borderRadius: "999px",
                                                    padding: "0 6px",
                                                    fontSize: 10,
                                                    lineHeight: "16px",
                                                    minWidth: 16,
                                                    textAlign: "center",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {unread}
                                            </span>
                                        )}
                                    </button>
                                    {open && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                right: 0,
                                                top: "calc(100% + 8px)",
                                                width: 320,
                                                background: "white",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: 8,
                                                boxShadow:
                                                    "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
                                                zIndex: 1000,
                                            }}
                                        >
                                            <div style={{ padding: 12, borderBottom: "1px solid #f3f4f6" }}>
                                                <strong>Notifications</strong>
                                            </div>
                                            <div style={{ maxHeight: 320, overflowY: "auto" }}>
                                                {recent.length === 0 ? (
                                                    <div style={{ padding: 16, color: "#6b7280" }}>
                                                        You have no notifications yet.
                                                    </div>
                                                ) : (
                                                    recent.map((n) => (
                                                        <div
                                                            key={n._id}
                                                            className="nav-link"
                                                            onClick={() => {
                                                                setOpen(false);
                                                                if (n.actionUrl) {
                                                                    window.location.href = n.actionUrl;
                                                                }
                                                            }}
                                                            style={{
                                                                display: "block",
                                                                padding: 12,
                                                                borderBottom: "1px solid #f3f4f6",
                                                                background: n.read ? "white" : "#f8fafc",
                                                                cursor: n.actionUrl ? "pointer" : "default",
                                                            }}
                                                        >
                                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</div>
                                                            <div style={{ color: "#6b7280", fontSize: 12 }}>{n.message}</div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div style={{ padding: 8, textAlign: "center" }}>
                                                <NavLink to="/notifications" className="nav-link" onClick={() => setOpen(false)}>
                                                    View all
                                                </NavLink>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <NavLink to="/profile" className="nav-link">
                                    Hi {user?.name || "User"}
                                    <span
                                        style={{
                                            fontSize: "11px",
                                            background:
                                                user.role === "admin"
                                                    ? "#dc2626"
                                                    : user.role ===
                                                      "dermatologist"
                                                    ? "#0369a1"
                                                    : "#16a34a",
                                            color: "white",
                                            padding: "2px 6px",
                                            borderRadius: "4px",
                                            marginLeft: "6px",
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        {user.role}
                                    </span>
                                </NavLink>
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        className="nav-link"
                                    >
                                        {item.label}
                                    </NavLink>
                                ))}
                                <button className="btn ghost" onClick={logout}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/login" className="nav-link">
                                    Login
                                </NavLink>
                                <NavLink to="/register" className="btn blue">
                                    Sign up
                                </NavLink>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div
                className={isHomePage ? "" : "container"}
                style={isHomePage ? {} : { padding: "24px 0" }}
            >
                <Outlet />
            </div>

            {/* Footer */}
            <div className="footer">
                <div className="container footer-content">
                    <div>
                        © {new Date().getFullYear()} SkinBloom • Skincare
                        simplified
                    </div>
                    <div className="footer-links">
                        <Link to="/profile">Profile</Link>
                        <Link to="/routine">Routine</Link>
                        <a href="mailto:support@skinbloom.app">Contact</a>
                    </div>
                </div>
            </div>
        </>
    );
}
