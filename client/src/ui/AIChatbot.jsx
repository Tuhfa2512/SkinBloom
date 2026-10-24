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
  // PERSONALIZED_CHAT_UI_V1
  const [useSkinProfile, setUseSkinProfile] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

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
        { message, history, useSkinProfile },
        { timeout: 35000 }
      );

      setMessages((prev) => [
        ...prev,
        { role: "model", text: data.reply }
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

          <div className="skinbloom-ai-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`skinbloom-ai-message ${
                  message.role === "user" ? "user" : "assistant"
                }`}
              >
                {message.text}
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
