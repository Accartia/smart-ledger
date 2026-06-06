import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCircle, AlertCircle, Info, X, Trash2, CheckCheck, Clock, Calendar, Eye } from 'lucide-react';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${currentUser.user_id}`);
      const data = await response.json();
      setNotifications(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, { method: 'PUT' });
      const updatedNotifications = notifications.map(notif => notif.notification_id === notificationId ? { ...notif, is_read: true } : notif);
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`http://localhost:5000/api/notifications/user/${currentUser.user_id}/read-all`, { method: 'PUT' });
      const updatedNotifications = notifications.map(notif => ({ ...notif, is_read: true }));
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${notificationId}`, { method: 'DELETE' });
      const updatedNotifications = notifications.filter(notif => notif.notification_id !== notificationId);
      setNotifications(updatedNotifications);
      if (selectedNotification?.notification_id === notificationId) setSelectedNotification(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      for (const notif of notifications) {
        await deleteNotification(notif.notification_id);
      }
    }
  };

  const viewNotification = (notification) => {
    setSelectedNotification(notification);
    if (!notification.is_read) markAsRead(notification.notification_id);
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.is_read;
    if (filter === 'read') return notif.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error': return <X className="w-5 h-5 text-red-600" />;
      case 'payment': return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'purchase': return <ShoppingBag className="w-5 h-5 text-purple-600" />;
      default: return <Bell className="w-5 h-5 text-purple-600" />;
    }
  };

  const getNotificationBg = (type) => {
    switch(type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'payment': return 'bg-green-50 border-green-200';
      case 'purchase': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/customer/dashboard')} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30"><ArrowLeft className="w-4 h-4" /> Back</button>
            <div><h1 className="text-2xl font-bold">Notifications</h1><p className="text-white/90 text-sm mt-1">Stay updated with your account activity</p></div>
          </div>
          <div className="flex items-center gap-3">
            {notifications.length > 0 && (<><button onClick={markAllAsRead} className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg hover:bg-white/30 text-sm"><CheckCheck className="w-4 h-4" /> Mark all read</button><button onClick={deleteAllNotifications} className="flex items-center gap-2 bg-red-500/20 px-3 py-2 rounded-lg hover:bg-red-500/30 text-sm"><Trash2 className="w-4 h-4" /> Clear all</button></>)}
          </div>
        </div>
      </div>

      <div className="p-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Total Notifications</p><p className="text-2xl font-bold text-gray-800">{notifications.length}</p></div><div className="bg-purple-100 p-3 rounded-full"><Bell className="text-purple-600 w-6 h-6" /></div></div></div>
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Unread</p><p className="text-2xl font-bold text-yellow-600">{unreadCount}</p></div><div className="bg-yellow-100 p-3 rounded-full"><Clock className="text-yellow-600 w-6 h-6" /></div></div></div>
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Read</p><p className="text-2xl font-bold text-green-600">{notifications.length - unreadCount}</p></div><div className="bg-green-100 p-3 rounded-full"><CheckCircle className="text-green-600 w-6 h-6" /></div></div></div>
        </div>

        <div className="bg-white rounded-xl shadow-lg mb-6"><div className="flex border-b"><button onClick={() => setFilter('all')} className={`flex-1 py-3 text-center font-medium ${filter === 'all' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}>All</button><button onClick={() => setFilter('unread')} className={`flex-1 py-3 text-center font-medium ${filter === 'unread' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}>Unread{unreadCount > 0 && <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">{unreadCount}</span>}</button><button onClick={() => setFilter('read')} className={`flex-1 py-3 text-center font-medium ${filter === 'read' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}>Read</button></div></div>

        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center"><Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" /><h3 className="text-lg font-semibold text-gray-800 mb-2">No notifications</h3><p className="text-gray-500">You're all caught up! Check back later for updates.</p></div>
          ) : (
            filteredNotifications.map((notification) => (
              <div key={notification.notification_id} className={`bg-white rounded-xl shadow-lg border-l-4 transition-all hover:shadow-xl cursor-pointer ${!notification.is_read ? 'border-purple-600' : 'border-gray-300'}`} onClick={() => viewNotification(notification)}>
                <div className={`p-5 rounded-xl ${getNotificationBg(notification.type)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1"><div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div><div className="flex-1"><div className="flex items-center gap-2 mb-1"><h3 className={`font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>{notification.title || 'Notification'}</h3>{!notification.is_read && <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">New</span>}</div><p className={`text-sm ${!notification.is_read ? 'text-gray-800' : 'text-gray-600'}`}>{notification.message.length > 100 ? notification.message.substring(0, 100) + '...' : notification.message}</p><div className="flex items-center gap-4 mt-2"><p className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(notification.created_at).toLocaleDateString()}</p><p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(notification.created_at).toLocaleTimeString()}</p></div></div></div>
                    <div className="flex items-center gap-2"><button onClick={(e) => { e.stopPropagation(); viewNotification(notification); }} className="text-purple-600 hover:text-purple-700" title="View Details"><Eye className="w-4 h-4" /></button><button onClick={(e) => { e.stopPropagation(); deleteNotification(notification.notification_id); }} className="text-gray-400 hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className={`rounded-t-xl p-4 ${getNotificationBg(selectedNotification.type)}`}>
              <div className="flex justify-between items-center"><div className="flex items-center gap-3">{getNotificationIcon(selectedNotification.type)}<h2 className="text-xl font-bold text-gray-800">{selectedNotification.title || 'Notification'}</h2></div><button onClick={() => setSelectedNotification(null)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button></div>
            </div>
            <div className="p-6"><p className="text-gray-700 leading-relaxed">{selectedNotification.message}</p><div className="mt-4 pt-4 border-t"><div className="flex justify-between text-sm text-gray-500"><span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(selectedNotification.created_at).toLocaleDateString()}</span><span className="flex items-center gap-1"><Clock className="w-4 h-4" />{new Date(selectedNotification.created_at).toLocaleTimeString()}</span></div></div><div className="mt-6 flex gap-3"><button onClick={() => { deleteNotification(selectedNotification.notification_id); setSelectedNotification(null); }} className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">Delete</button><button onClick={() => setSelectedNotification(null)} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:opacity-90">Close</button></div></div>
          </div>
        </div>
      )}
    </div>
  );
}