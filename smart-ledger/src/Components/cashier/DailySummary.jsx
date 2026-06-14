import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Search, Eye, Download, 
  DollarSign, CreditCard, TrendingUp, Users,
  Printer, Filter, Store
} from 'lucide-react';

export default function DailySummary() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const shopId = currentUser.shop_id;
  const shopName = currentUser.shop_name;

  // Helper function to safely parse numeric values
  const parseNumeric = (value) => {
    if (value === null || value === undefined) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedDate]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/transactions/daily/${selectedDate}`, {
        headers: {
          'shop-id': shopId
        }
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      
      // Process transactions - ensure numeric values are numbers
      const processedTransactions = (Array.isArray(data) ? data : []).map(transaction => ({
        ...transaction,
        amount: parseNumeric(transaction.amount)
      }));
      
      setTransactions(processedTransactions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions');
      setLoading(false);
    }
  };

  const dailyTotal = transactions.reduce((sum, t) => sum + t.amount, 0);
  const dailyCredit = transactions.filter(t => t.payment_method === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const dailyCash = transactions.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + t.amount, 0);
  
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = (t.customer_name || 'Walk-in').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || t.payment_method === selectedType;
    return matchesSearch && matchesType;
  });

  const handleExport = () => {
    const csvContent = [
      ['Transaction ID', 'Reference', 'Customer', 'Type', 'Amount', 'Time', 'Cashier', 'Status'],
      ...filteredTransactions.map(t => [
        t.transaction_id, t.reference_number, t.customer_name || 'Walk-in', 
        t.payment_method, t.amount.toFixed(2), new Date(t.transaction_date).toLocaleTimeString(), 
        t.cashier_name || 'N/A', t.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_summary_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-gray-800 font-semibold">{error}</p>
          <button onClick={fetchTransactions} className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="flex justify-between items-center px-8 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/cashier/dashboard')}
              className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                <h1 className="text-2xl font-bold">Daily Summary Report</h1>
              </div>
              <p className="text-white/90 text-sm mt-1">View daily sales transactions for {shopName || 'your shop'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30">
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Select Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Transaction Type</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="all">All Transactions</option>
                  <option value="cash">Cash Only</option>
                  <option value="credit">Credit Only</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by customer or reference..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <p className="text-sm opacity-90">Total Sales</p>
            <p className="text-2xl font-bold">R{dailyTotal.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <p className="text-sm opacity-90">Credit Sales</p>
            <p className="text-2xl font-bold">R{dailyCredit.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <p className="text-sm opacity-90">Cash Sales</p>
            <p className="text-2xl font-bold">R{dailyCash.toFixed(2)}</p>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
            <p className="text-gray-500 text-sm mt-1">Showing {filteredTransactions.length} transactions</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Ref</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Cashier</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-500">
                      No transactions for this date
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction, index) => (
                    <tr key={transaction.transaction_id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4 text-sm text-gray-600">{transaction.reference_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(transaction.transaction_date).toLocaleTimeString()}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{transaction.customer_name || 'Walk-in Customer'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.payment_method === 'credit' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {transaction.payment_method === 'credit' ? 'Credit' : 'Cash'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800">R{transaction.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{transaction.cashier_name || 'N/A'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-100 font-semibold">
                <tr>
                  <td className="px-6 py-4" colSpan="4">Total:</td>
                  <td className="px-6 py-4 text-right text-gray-800">R{dailyTotal.toFixed(2)}</td>
                  <td className="px-6 py-4" colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}