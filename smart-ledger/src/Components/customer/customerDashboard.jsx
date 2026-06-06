import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, CreditCard, History, User, LogOut, 
  ShoppingBag, Bell, HelpCircle, 
  TrendingUp, Clock, CheckCircle, Store
} from 'lucide-react';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Helper function to safely format currency
  const formatCurrency = (value) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Helper function to safely parse numeric values
  const parseNumeric = (value) => {
    if (value === null || value === undefined) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    if (currentUser.customer_id) {
      fetchCustomerData();
      fetchUnreadCount();
      fetchRecentTransactions();
    } else {
      setLoading(false);
      setError('No customer ID found. Please login again.');
    }
  }, []);

  // Expose refresh function for child components
  useEffect(() => {
    window.refreshCustomerData = () => {
      fetchCustomerData();
      fetchUnreadCount();
      fetchRecentTransactions();
    };
    return () => {
      delete window.refreshCustomerData;
    };
  }, []);

  const fetchCustomerData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/customers/${currentUser.customer_id}`);
      if (!response.ok) throw new Error('Failed to fetch customer data');
      const data = await response.json();
      
      const processedData = {
        ...data,
        outstanding_balance: parseNumeric(data.outstanding_balance),
        credit_limit: parseNumeric(data.credit_limit)
      };
      
      setCustomer(processedData);
    } catch (error) {
      console.error('Error fetching customer:', error);
      setError('Failed to load customer data');
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${currentUser.user_id}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/transactions/customer/${currentUser.customer_id}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      const processedData = (Array.isArray(data) ? data : []).map(t => ({
        ...t,
        amount: parseNumeric(t.amount)
      }));
      setRecentTransactions(processedData.slice(0, 3));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setRecentTransactions([]);
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const menuItems = [
    { title: 'Check Balance', icon: Wallet, path: '/customer/balance', color: 'bg-blue-600', description: 'View current balance' },
    { title: 'Credit Limits', icon: CreditCard, path: '/customer/limits', color: 'bg-green-600', description: 'Check your limits' },
    { title: 'Make Payment', icon: ShoppingBag, path: '/customer/payment', color: 'bg-purple-600', description: 'Pay your account' },
    { title: 'Transaction History', icon: History, path: '/customer/history', color: 'bg-yellow-600', description: 'View past purchases' },
    { title: 'My Profile', icon: User, path: '/customer/details', color: 'bg-red-600', description: 'Update information' },
  ];

  const getCreditUtilization = () => {
    if (!customer) return '0';
    if (customer.credit_limit === 0) return '0';
    return ((customer.outstanding_balance / customer.credit_limit) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-gray-800 font-semibold">{error || 'Unable to load dashboard'}</p>
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login/customer'); }} className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg">Go to Login</button>
        </div>
      </div>
    );
  }

  const balance = customer.outstanding_balance;
  const creditLimit = customer.credit_limit;
  const availableCredit = creditLimit - balance;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="flex justify-between items-center px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold">Customer Dashboard</h1>
            <p className="text-white/90 text-sm mt-1">Welcome back, {customer.full_name || 'Customer'}!</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => navigate('/customer/notifications')}
                className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); }} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 pt-6">
        <div className="bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-full"><Store className="w-5 h-5 text-purple-600" /></div>
          <div><p className="text-xs text-gray-500">Your Registered Shop</p><p className="font-semibold text-gray-800">{customer.shop_name || 'Moroka Supermarket'}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-lg p-6 text-white">
          <p className="opacity-90 text-sm">Current Balance</p>
          <p className="text-3xl font-bold mt-2">R{formatCurrency(balance)}</p>
          <p className="text-xs opacity-75 mt-2">Outstanding amount</p>
        </div>
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl shadow-lg p-6 text-white">
          <p className="opacity-90 text-sm">Credit Limit</p>
          <p className="text-3xl font-bold mt-2">R{formatCurrency(creditLimit)}</p>
          <p className="text-xs opacity-75 mt-2">Maximum credit available</p>
        </div>
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl shadow-lg p-6 text-white">
          <p className="opacity-90 text-sm">Available Credit</p>
          <p className="text-3xl font-bold mt-2">R{formatCurrency(availableCredit)}</p>
          <p className="text-xs opacity-75 mt-2">Remaining credit</p>
        </div>
      </div>

      <div className="px-8 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800">Credit Utilization</h3>
            <span className="text-sm text-gray-600">{getCreditUtilization()}% used</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${getCreditUtilization()}%` }}></div>
          </div>
          <div className="flex justify-between mt-4 text-sm text-gray-600">
            <span>Credit Score: Good</span>
            <span>Member since: {new Date(customer.register_date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="px-8 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {menuItems.map((item, index) => (
            <button key={index} onClick={() => navigate(item.path)} className="bg-white rounded-xl shadow-lg p-4 text-center hover:shadow-2xl transition-all hover:scale-105 group">
              <div className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <item.icon className="text-white w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">{item.title}</h3>
              <p className="text-xs text-gray-500 mt-1 hidden md:block">{item.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 pb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Recent Activity</h3>
            <button onClick={() => navigate('/customer/history')} className="text-purple-600 hover:text-purple-700 text-sm">View All →</button>
          </div>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No transactions yet</div>
            ) : (
              recentTransactions.map(activity => (
                <div key={activity.transaction_id} className="flex justify-between items-center py-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${activity.transaction_type === 'purchase' ? 'bg-red-100' : 'bg-green-100'}`}>
                      {activity.transaction_type === 'purchase' ? <ShoppingBag className="w-4 h-4 text-red-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 capitalize">{activity.transaction_type}</p>
                      <p className="text-xs text-gray-500">{activity.shop_name || customer.shop_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${activity.transaction_type === 'purchase' ? 'text-red-600' : 'text-green-600'}`}>
                      {activity.transaction_type === 'purchase' ? '-' : '+'}R{formatCurrency(activity.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(activity.transaction_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="px-8 pb-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-center text-white">
          <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-90" />
          <h3 className="font-semibold text-white mb-1">Need Help?</h3>
          <p className="text-sm text-white/90 mb-3">Contact our support team</p>
          <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100">Contact Support</button>
        </div>
      </div>
    </div>
  );
}