import React, { useEffect, useState } from 'react';
import apiClient from '../apiClient';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const { data } = await apiClient.get('/notifications');
      setNotifications(data.items || []);
      if ((data.items || []).some((note) => !note.is_read)) {
        await apiClient.put('/notifications/read-all');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markSingleRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container" style={{ padding: '30px 0' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Your Messages</h1>
      <p style={{ color: '#555', marginBottom: '20px' }}>Order updates and account notifications.</p>

      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((note) => (
            <div
              key={note.id}
              className="card"
              style={{ padding: '16px', borderLeft: note.is_read ? '4px solid #d5d9d9' : '4px solid #f0c14b' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div>
                  <h3 style={{ marginBottom: '4px' }}>{note.title}</h3>
                  <p style={{ marginBottom: '6px', color: '#555' }}>{note.body}</p>
                  <span style={{ fontSize: '12px', color: '#777' }}>{new Date(note.created_at).toLocaleString()}</span>
                </div>
                {!note.is_read && (
                  <button
                    onClick={() => markSingleRead(note.id)}
                    style={{ backgroundColor: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
