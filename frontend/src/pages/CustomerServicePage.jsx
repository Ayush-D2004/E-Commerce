import React, { useState } from 'react';

const faqs = [
  { question: 'Where is my order?', answer: 'Open Orders to see real-time status. If it is delayed, you can request a return or replacement from your order detail.' },
  { question: 'How do I return an item?', answer: 'Visit Orders, select the item, and choose Return or Replace. We will email you next steps.' },
  { question: 'How do I update my address?', answer: 'Open Address Book and edit your saved addresses or set a new default.' },
  { question: 'How do I redeem a gift card?', answer: 'Use the Gift Cards page to enter your code and apply the balance.' }
];

export default function CustomerServicePage() {
  const [openIndex, setOpenIndex] = useState(0);
  const [form, setForm] = useState({ email: '', order: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const toggleFaq = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container" style={{ padding: '30px 0' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Customer Service</h1>
      <p style={{ color: '#555', marginBottom: '20px' }}>Get help with orders, returns, and account settings.</p>

      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '12px' }}>Quick FAQs</h3>
        {faqs.map((faq, index) => (
          <div key={faq.question} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
            <button
              onClick={() => toggleFaq(index)}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {faq.question}
            </button>
            {openIndex === index && <p style={{ color: '#555', marginTop: '6px' }}>{faq.answer}</p>}
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '10px' }}>Contact Us</h3>
        <p style={{ color: '#555', marginBottom: '15px' }}>Send us a message and we will respond within 24 hours.</p>
        {submitted ? (
          <div style={{ backgroundColor: '#e7f3ec', padding: '12px', borderRadius: '6px' }}>
            Thanks! Your message has been received.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px', maxWidth: '520px' }}>
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Order number (optional)"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
            />
            <textarea
              placeholder="How can we help?"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              required
            />
            <button type="submit" className="btn-primary">Send message</button>
          </form>
        )}
      </div>
    </div>
  );
}
