import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, UserPlus, Trash2, Check, X, Bell } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // API base URL - ajusta según tu configuración
  const API_BASE_URL = 'https://dekansta.onrender.com/api/v1/notification';

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  // Cargar contador de no leídas
  const loadUnreadCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/unread-count`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Ajusta según tu auth
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadNotifications = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Ajusta según tu auth
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(prev => 
          page === 1 ? data.notifications : [...prev, ...data.notifications]
        );
        setUnreadCount(data.unreadCount);
        setHasMore(data.hasMore);
        setCurrentPage(data.currentPage);
      } else {
        throw new Error('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        throw new Error('Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      } else {
        throw new Error('Failed to mark all as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const notification = notifications.find(n => n._id === notificationId);
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else {
        throw new Error('Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/delete-all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      } else {
        throw new Error('Failed to delete all notifications');
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-8 h-8 text-red-500 fill-current" />;
      case 'comment':
        return <MessageCircle className="w-8 h-8 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-8 h-8 text-green-500" />;
      default:
        return <Bell className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute right-0 top-12 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Marcar todas
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-80">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">Cargando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Profile Picture or Icon */}
                      <div className="relative flex-shrink-0">
                        {notification.from?.profilePicture ? (
                          <img
                            src={notification.from.profilePicture}
                            alt={notification.from.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                        
                        {/* Notification Type Icon */}
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">
                                {notification.from?.username || 'Sistema'}
                              </span>{' '}
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>

                          {/* Post thumbnail */}
                          {notification.post?.image && (
                            <img
                              src={notification.post.image}
                              alt="Post"
                              className="w-10 h-10 rounded object-cover ml-2 flex-shrink-0"
                            />
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Marcar como leída
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="text-red-600 hover:text-red-700 text-xs font-medium flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Load More Button */}
                {hasMore && (
                  <div className="p-4 text-center">
                    <button
                      onClick={() => loadNotifications(currentPage + 1)}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                    >
                      {loading ? 'Cargando...' : 'Cargar más'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <button
                  onClick={deleteAllNotifications}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Eliminar todas
                </button>
                <span className="text-xs text-gray-500">
                  {notifications.length} notificación{notifications.length !== 1 ? 'es' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default Notifications;