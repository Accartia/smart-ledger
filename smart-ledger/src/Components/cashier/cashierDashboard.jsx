import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, ShoppingCart, Package, TrendingUp, LogOut, 
  Clock, DollarSign, CreditCard, Calendar, Store
} from 'lucide-react';

export default function CashierDashboard() {
  const navigate = useNavigate();
  const [todayStats, setTodayStats] = useState({
    transactions: 0,
    totalSales: 0,
    creditSales: 0,
    cashSales: 0,
    customers: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const today = new Date().toISOString().split('T')[0];
  const shopId = currentUser.shop_id;
  const shopName = currentUser.shop_name;

  // Helper function to safely parse numeric values
  const parseNumeric = (value) => {
    if (value === null || value === undefined) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    fetchTodayStats();
    fetchRecentTransactions();
  }, []);

  const fetchTodayStats = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/transactions/daily/${today}`, {
        headers: {
          'shop-id': shopId
        }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      const transactionsArray = Array.isArray(data) ? data : [];
      
      const totalSales = transactionsArray.reduce((sum, t) => sum + parseNumeric(t.amount), 0);
      const creditSales = transactionsArray.filter(t => t.payment_method === 'credit').reduce((sum, t) => sum + parseNumeric(t.amount), 0);
      const cashSales = transactionsArray.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + parseNumeric(t.amount), 0);
      const uniqueCustomers = [...new Set(transactionsArray.map(t => t.customer_id))].length;
      
      setTodayStats({
        transactions: transactionsArray.length,
        totalSales: totalSales,
        creditSales: creditSales,
        cashSales: cashSales,
        customers: uniqueCustomers
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Keep zeros if error
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/transactions/daily/${today}`, {
        headers: {
          'shop-id': shopId
        }
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setRecentTransactions(Array.isArray(data) ? data.slice(0, 5) : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setRecentTransactions([]);
      setLoading(false);
    }
  };

  const actions = [
    { title: 'New Sale', icon: ShoppingCart, path: '/cashier/transaction', color: 'bg-gradient-to-r from-green-500 to-green-600', description: 'Process new transaction' },
    { title: 'Customers', icon: Users, path: '/cashier/customers', color: 'bg-gradient-to-r from-blue-500 to-blue-600', description: 'Manage customer accounts' },
    { title: 'Products', icon: Package, path: '/cashier/products', color: 'bg-gradient-to-r from-purple-500 to-purple-600', description: 'Browse store items' },
    { title: 'Daily Summary', icon: Calendar, path: '/cashier/daily-summary', color: 'bg-gradient-to-r from-yellow-500 to-yellow-600', description: 'View sales history' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-gray-800 font-semibold">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="flex justify-between items-center px-8 py-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Store className="w-5 h-5 text-white" />
              <h1 className="text-2xl font-bold">Cashier Dashboard</h1>
            </div>
            <p className="text-white/90 text-sm mt-1">Welcome, {currentUser.full_name || 'Cashier'}</p>
            <p className="text-white/70 text-xs mt-1">Shop: {shopName || 'Moroka Supermarket'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 px-3 py-1 rounded-lg text-sm">
              <Clock className="w-4 h-4 inline mr-1" />
              {new Date().toLocaleTimeString()}
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
              }}
              className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-800">R{todayStats.totalSales.toFixed(2)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="text-green-600 w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Transactions</p>
              <p className="text-2xl font-bold text-gray-800">{todayStats.transactions}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ShoppingCart className="text-blue-600 w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Credit Sales</p>
              <p className="text-2xl font-bold text-purple-600">R{todayStats.creditSales.toFixed(2)}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <CreditCard className="text-purple-600 w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Customers Served</p>
              <p className="text-2xl font-bold text-gray-800">{todayStats.customers}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Users className="text-yellow-600 w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-8 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition-all hover:scale-105"
            >
              <div className={`${action.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <action.icon className="text-white w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">{action.title}</h3>
              <p className="text-sm text-gray-500">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-8 pb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Recent Transactions</h3>
            <button 
              onClick={() => navigate('/cashier/daily-summary')}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
            >
              View All 
              <TrendingUp className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No transactions today</p>
                <p className="text-sm mt-1">Start by making a sale!</p>
              </div>
            ) : (
              recentTransactions.map(transaction => (
                <div key={transaction.transaction_id} className="flex justify-between items-center py-3 border-b hover:bg-gray-50 px-3 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{transaction.customer_name || 'Walk-in Customer'}</p>
                    <p className="text-sm text-gray-500">{new Date(transaction.transaction_date).toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.payment_method === 'credit' ? 'text-purple-600' : 'text-green-600'}`}>
                      R{parseNumeric(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{transaction.payment_method}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}