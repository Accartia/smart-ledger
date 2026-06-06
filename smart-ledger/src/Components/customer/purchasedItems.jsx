import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Calendar, DollarSign, Package, TrendingUp, Eye, Download } from 'lucide-react';

export default function PurchasedItems() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Helper function to safely parse numeric values
  const parseNumeric = (value) => {
    if (value === null || value === undefined) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  // Helper function to safely format currency
  const formatCurrency = (value) => {
    const num = parseNumeric(value);
    return num.toFixed(2);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/transactions/customer/${currentUser.customer_id}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      
      // Process transactions - ensure amount is a number
      const processedTransactions = (Array.isArray(data) ? data : []).map(transaction => ({
        ...transaction,
        amount: parseNumeric(transaction.amount)
      }));
      
      setTransactions(processedTransactions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transaction history');
      setLoading(false);
    }
  };

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const averagePurchase = transactions.length > 0 ? totalSpent / transactions.length : 0;
  const totalPurchases = transactions.length;

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
        <div className="flex items-center gap-4 px-8 py-4">
          <button onClick={() => navigate('/customer/dashboard')} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div><h1 className="text-2xl font-bold">Purchase History</h1><p className="text-white/90 text-sm mt-1">View all your past purchases and transactions</p></div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Total Spent</p><p className="text-2xl font-bold text-purple-600">R{formatCurrency(totalSpent)}</p></div>
              <div className="bg-purple-100 p-3 rounded-full"><DollarSign className="text-purple-600 w-6 h-6" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Total Purchases</p><p className="text-2xl font-bold text-blue-600">{totalPurchases}</p></div>
              <div className="bg-blue-100 p-3 rounded-full"><ShoppingBag className="text-blue-600 w-6 h-6" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Average Purchase</p><p className="text-2xl font-bold text-green-600">R{formatCurrency(averagePurchase)}</p></div>
              <div className="bg-green-100 p-3 rounded-full"><TrendingUp className="text-green-600 w-6 h-6" /></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50"><h2 className="text-lg font-semibold text-gray-800">Transaction History</h2><p className="text-sm text-gray-500 mt-1">Showing last {transactions.length} transactions</p></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600"><Calendar className="w-4 h-4 inline mr-1" /> Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600"><Package className="w-4 h-4 inline mr-1" /> Reference</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600"><DollarSign className="w-4 h-4 inline mr-1" /> Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Payment Method</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-12 text-gray-500">No transactions yet</td></tr>
                ) : (
                  transactions.map((transaction, index) => (
                    <tr key={transaction.transaction_id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4 text-gray-600">{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-gray-600">{transaction.reference_number}</td>
                      <td className="px-6 py-4 text-right font-semibold text-red-600">R{formatCurrency(transaction.amount)}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.payment_method === 'credit' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{transaction.payment_method === 'credit' ? 'Credit' : 'Cash'}</span></td>
                      <td className="px-6 py-4 text-center"><span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">{transaction.status}</span></td>
                      <td className="px-6 py-4 text-center"><button className="text-purple-600 hover:text-purple-800"><Eye className="w-4 h-4" /></button></td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-100 font-semibold"><tr><td className="px-6 py-4" colSpan="2">Total:</td><td className="px-6 py-4 text-right text-gray-800">R{formatCurrency(totalSpent)}</td><td className="px-6 py-4" colSpan="3"></td></tr></tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}