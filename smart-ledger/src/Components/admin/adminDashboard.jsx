import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, ShoppingBag, TrendingUp, AlertCircle, FileText, 
  Package, UserPlus, LogOut, DollarSign, CreditCard, 
  Calendar, Download, Search, Eye, BarChart, Store
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOutstanding: 0,
    totalCreditLimit: 0,
    overdueAccounts: 0,
    totalProducts: 0,
    todaySales: 0,
    lowStock: 0
  });
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
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
    fetchDashboardData();
    fetchCustomers();
    fetchRecentTransactions();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/dashboard/stats', {
        headers: {
          'shop-id': shopId
        }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats({
        totalCustomers: data.totalCustomers || 0,
        totalOutstanding: parseNumeric(data.totalOutstanding),
        totalCreditLimit: parseNumeric(data.totalCreditLimit),
        overdueAccounts: data.overdueAccounts || 0,
        totalProducts: data.totalProducts || 0,
        todaySales: parseNumeric(data.todaySales),
        lowStock: data.lowStock || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/customers', {
        headers: {
          'shop-id': shopId
        }
      });
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      const processedCustomers = (Array.isArray(data) ? data : []).map(customer => ({
        ...customer,
        outstanding_balance: parseNumeric(customer.outstanding_balance),
        credit_limit: parseNumeric(customer.credit_limit)
      }));
      setCustomers(processedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/transactions/daily/${today}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      const processedTransactions = (Array.isArray(data) ? data : []).map(t => ({
        ...t,
        amount: parseNumeric(t.amount)
      }));
      setTransactions(processedTransactions.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => {
    const displayValue = value !== undefined && value !== null ? value : 0;
    const formattedValue = typeof displayValue === 'number' && title.includes('R') 
      ? `R${displayValue.toLocaleString()}`
      : displayValue;
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold mt-2 text-gray-800">{formattedValue}</p>
            {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
          </div>
          <div className={`${color} p-3 rounded-xl`}>
            <Icon className="text-white w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-gray-800 font-semibold">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="flex justify-between items-center px-8 py-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Store className="w-5 h-5 text-white" />
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-white/90 text-sm">Welcome back, {currentUser.full_name || 'Store Manager'}</p>
            <p className="text-white/70 text-xs mt-1">Shop: {shopName || 'Your Store'}</p>
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

      <div className="bg-white shadow-md px-8">
        <div className="flex gap-6">
          {['overview', 'customers', 'transactions', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-2 capitalize font-medium transition-colors ${
                activeTab === tab 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} color="bg-gradient-to-r from-blue-500 to-blue-600" />
              <StatCard title="Outstanding Balance" value={`R${(stats.totalOutstanding || 0).toLocaleString()}`} icon={ShoppingBag} color="bg-gradient-to-r from-yellow-500 to-yellow-600" />
              <StatCard title="Total Credit Limit" value={`R${(stats.totalCreditLimit || 0).toLocaleString()}`} icon={TrendingUp} color="bg-gradient-to-r from-green-500 to-green-600" />
              <StatCard title="Today's Sales" value={`R${(stats.todaySales || 0).toLocaleString()}`} icon={DollarSign} color="bg-gradient-to-r from-purple-500 to-purple-600" />
            </div>

            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <button onClick={() => navigate('/admin/reports')} className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all group">
                <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="text-purple-600 w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Generate Reports</h3>
                <p className="text-sm text-gray-500">Daily, weekly & monthly reports</p>
              </button>
              <button onClick={() => navigate('/admin/inventory')} className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all group">
                <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Package className="text-green-600 w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Manage Inventory</h3>
                <p className="text-sm text-gray-500">Update product catalog</p>
              </button>
              <button onClick={() => navigate('/admin/customers')} className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all group">
                <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UserPlus className="text-blue-600 w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Customer Management</h3>
                <p className="text-sm text-gray-500">Add or edit customers</p>
              </button>
              <button onClick={() => navigate('/admin/analytics')} className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all group">
                <div className="bg-yellow-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart className="text-yellow-600 w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">View Analytics</h3>
                <p className="text-sm text-gray-500">Customer payment behavior</p>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No transactions yet</div>
                  ) : (
                    transactions.map(transaction => (
                      <div key={transaction.transaction_id} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="font-medium text-gray-800">{transaction.customer_name || 'Walk-in'}</p>
                          <p className="text-sm text-gray-500 capitalize">{transaction.payment_method}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">R{parseNumeric(transaction.amount).toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{new Date(transaction.transaction_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Store Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-sm">Total Products</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalProducts || 0}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-sm">Low Stock Items</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.lowStock || 0}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-gray-500 text-sm">Today's Sales</p>
                    <p className="text-2xl font-bold text-green-600">R{(stats.todaySales || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-gray-500 text-sm">Active Credits</p>
                    <p className="text-2xl font-bold text-blue-600">{customers.filter(c => parseNumeric(c.outstanding_balance) > 0).length}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'customers' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Customer Management</h2>
              <button 
                onClick={() => navigate('/admin/customers')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Manage All Customers
              </button>
            </div>
            
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Search customers..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Phone</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Balance</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Credit Limit</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-500">No customers found for your shop</td>
                    </tr>
                  ) : (
                    customers.map(customer => (
                      <tr key={customer.customer_id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-800">{customer.full_name}</td>
                        <td className="px-4 py-3 text-gray-600">{customer.cellphone}</td>
                        <td className="px-4 py-3 text-right text-red-600">R{parseNumeric(customer.outstanding_balance).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-800">R{parseNumeric(customer.credit_limit).toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${customer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {customer.status || 'active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-blue-600 hover:text-blue-800 mx-1">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Transaction History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-500">No transactions yet</td>
                    </tr>
                  ) : (
                    transactions.map(transaction => (
                      <tr key={transaction.transaction_id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">#{transaction.transaction_id}</td>
                        <td className="px-4 py-3 text-gray-800">{transaction.customer_name || 'Walk-in'}</td>
                        <td className="px-4 py-3 capitalize text-gray-600">{transaction.transaction_type}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${transaction.transaction_type === 'payment' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.transaction_type === 'payment' ? '-' : '+'}R{parseNumeric(transaction.amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Financial Reports</h2>
              <button onClick={() => navigate('/admin/reports')} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                View Full Reports
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="text-purple-600" />
                  <h3 className="font-semibold text-gray-800">Daily Report</h3>
                </div>
                <p className="text-2xl font-bold text-gray-800 mb-2">R{(stats.todaySales || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Today's total sales</p>
                <button onClick={() => navigate('/admin/reports')} className="mt-4 text-purple-600 hover:text-purple-700 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              </div>
              <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="text-green-600" />
                  <h3 className="font-semibold text-gray-800">Monthly Summary</h3>
                </div>
                <p className="text-2xl font-bold text-gray-800 mb-2">R{((stats.todaySales || 0) * 30).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Estimated monthly sales</p>
                <button onClick={() => navigate('/admin/reports')} className="mt-4 text-purple-600 hover:text-purple-700 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}