import React, { useEffect, useRef, useState } from "react";
import API from "../auth";
import "./AIChatbot.css";

const welcomeMessage = {
  role: "model",
  text: "Hi! 🌸 I'm SkinBloom AI, your skincare companion. Ask me about skincare, products, routines, or anything you'd like to talk about!"
};

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // SKINBLOOM_CHAT_HISTORY_UI_V1
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem("token"))
  );

  // PERSONALIZED_CHAT_UI_V1
  const [useSkinProfile, setUseSkinProfile] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  const loadConversations = async () => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(Boolean(token));

    if (!token) {
      setConversations([]);
      return;
    }

    setHistoryLoading(true);
    setHistoryError("");

    try {
      const { data } = await API.get("/chatbot/conversations");
      setConversations(Array.isArray(data.conversations)
        ? data.conversations
        : []);
    } catch (error) {
      setHistoryError(
        error.response?.data?.error || "Could not load chat history."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const startNewChat = () => {
    if (loading || historyLoading) return;
    setConversationId(null);
    setMessages([welcomeMessage]);
    setInput("");
    setShowHistory(false);
    setHistoryError("");
  };

  const openConversation = async (id) => {
    if (loading || historyLoading) return;

    setHistoryLoading(true);
    setHistoryError("");

    try {
      const { data } = await API.get(`/chatbot/conversations/${id}`);
      const savedMessages = Array.isArray(data.conversation?.messages)
        ? data.conversation.messages
        : [];

      setConversationId(data.conversation._id);
      setMessages([welcomeMessage, ...savedMessages]);
      setInput("");
      setShowHistory(false);
    } catch (error) {
      setHistoryError(
        error.response?.data?.error || "Could not open conversation."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const deleteConversation = async (id) => {
    if (loading || historyLoading) return;
    if (!window.confirm("Delete this conversation permanently?")) return;

    setHistoryLoading(true);
    setHistoryError("");

    try {
      await API.delete(`/chatbot/conversations/${id}`);

      setConversations((prev) =>
        prev.filter((conversation) => conversation._id !== id)
      );

      if (conversationId === id) {
        setConversationId(null);
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      setHistoryError(
        error.response?.data?.error || "Could not delete conversation."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const sendMessage = async (text) => {
    const message = text.trim();
    if (!message || loading) return;

    const history = messages
      .filter((m) => m !== welcomeMessage)
      .slice(-10);

    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await API.post(
        "/chatbot/message",
        { message, history, useSkinProfile, conversationId },
        { timeout: 35000 }
      );

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: data.reply,
          products: Array.isArray(data.products)
            ? data.products.slice(0, 5)
            : []
        }
      ]);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        "Sorry, I couldn't connect right now. Please try again.";

      setMessages((prev) => [
        ...prev,
        { role: "model", text: errorMessage }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="skinbloom-ai-widget">
      {isOpen && (
        <section className="skinbloom-ai-window" aria-label="SkinBloom AI chat">
          <header className="skinbloom-ai-header">
            <div>
              <strong>🌸 SkinBloom AI</strong>
              <small>Your skincare companion</small>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
              className="skinbloom-ai-close"
            >
              ✕
            </button>
          </header>

          {/* SKINBLOOM_CHAT_HISTORY_PANEL_V1 */}
          <div className="skinbloom-ai-history-toolbar">
            <button
              type="button"
              onClick={startNewChat}
              disabled={loading || historyLoading}
            >
              + New Chat
            </button>

            {isLoggedIn && (
              <button
                type="button"
                onClick={() => {
                  if (!showHistory) loadConversations();
                  setShowHistory((prev) => !prev);
                }}
                disabled={loading || historyLoading}
              >
                {showHistory ? "Back to Chat" : "History"}
              </button>
            )}
          </div>

          {showHistory && isLoggedIn && (
            <div className="skinbloom-ai-history-panel">
              <strong>Previous Conversations</strong>

              {historyLoading && <p>Loading conversations...</p>}
              {historyError && <p role="alert">{historyError}</p>}

              {!historyLoading && conversations.length === 0 && (
                <p>No saved conversations yet.</p>
              )}

              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className="skinbloom-ai-history-item"
                >
                  <button
                    type="button"
                    onClick={() => openConversation(conversation._id)}
                    disabled={loading || historyLoading}
                  >
                    {conversation.title || "New Conversation"}
                  </button>

                  <button
                    type="button"
                    aria-label="Delete conversation"
                    onClick={() => deleteConversation(conversation._id)}
                    disabled={loading || historyLoading}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="skinbloom-ai-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`skinbloom-ai-message ${
                  message.role === "user" ? "user" : "assistant"
                }`}
              >
                {message.text}

                {/* SKINBLOOM_PRODUCT_CARDS_V1 */}
                {message.role === "model" &&
                  Array.isArray(message.products) &&
                  message.products.length > 0 && (
                    <div className="skinbloom-ai-product-list">
                      {message.products.map((product) => (
                        <div
                          className="skinbloom-ai-product-card"
                          key={product.id}
                        >
                          {product.image && (
                            <img
                              src={product.image}
                              alt={product.name}
                              loading="lazy"
                            />
                          )}

                          <div className="skinbloom-ai-product-info">
                            <strong>{product.name}</strong>
                            <span>{product.brand}</span>

                            <b>
                              ৳{Number(product.price).toLocaleString("en-BD")}
                            </b>

                            <a href={`/products/${product.id}`}>
                              View Product →
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ))}

            {loading && (
              <div className="skinbloom-ai-message assistant">
                SkinBloom AI is typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="skinbloom-ai-suggestions">
              {[
                "Suggest a skincare routine",
                "How to care for oily skin?",
                "Can we talk?"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <label className="skinbloom-ai-profile-option">
            <input
              type="checkbox"
              checked={useSkinProfile}
              onChange={(event) =>
                setUseSkinProfile(event.target.checked)
              }
              disabled={loading}
            />
            Use my saved skin profile for personalized advice
          </label>

          <form className="skinbloom-ai-form" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask SkinBloom AI..."
              aria-label="Message SkinBloom AI"
              maxLength={2000}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>

          <p className="skinbloom-ai-disclaimer">
            AI-generated advice. Not a substitute for medical care.
          </p>
        </section>
      )}

      <button
        type="button"
        className="skinbloom-ai-launcher"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close SkinBloom AI" : "Open SkinBloom AI"}
        aria-expanded={isOpen}
      >
        {isOpen ? "✕" : "🌸"}
        <span>{isOpen ? "Close" : "Ask SkinBloom AI"}</span>
      </button>
    </div>
  );
}
