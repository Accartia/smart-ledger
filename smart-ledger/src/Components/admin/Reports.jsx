import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Calendar, TrendingUp, DollarSign, Users, ShoppingBag, CreditCard, FileText } from 'lucide-react';

export default function Reports() {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('sales');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to safely parse numeric values
  const parseNumeric = (value) => {
    if (value === null || value === undefined) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [transactionsRes, customersRes] = await Promise.all([
        fetch(`http://localhost:5000/api/transactions/daily/${selectedDate}`),
        fetch('http://localhost:5000/api/customers')
      ]);
      
      if (!transactionsRes.ok) throw new Error('Failed to fetch transactions');
      if (!customersRes.ok) throw new Error('Failed to fetch customers');
      
      const transactionsData = await transactionsRes.json();
      const customersData = await customersRes.json();
      
      // Process transactions - ensure amount is a number
      const processedTransactions = (Array.isArray(transactionsData) ? transactionsData : []).map(t => ({
        ...t,
        amount: parseNumeric(t.amount)
      }));
      
      setTransactions(processedTransactions);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load report data');
      setLoading(false);
    }
  };

  const totalSales = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCredit = transactions.filter(t => t.payment_method === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const totalCash = transactions.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + t.amount, 0);
  const totalTransactions = transactions.length;
  
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const totalOutstanding = customers.reduce((sum, c) => sum + parseNumeric(c.outstanding_balance), 0);
  const totalCreditLimit = customers.reduce((sum, c) => sum + parseNumeric(c.credit_limit), 0);

  const handleExport = () => {
    let csvContent = [];
    if (reportType === 'sales') {
      csvContent = [['Transaction ID', 'Customer', 'Type', 'Amount', 'Date', 'Status'], 
        ...transactions.map(t => [t.transaction_id, t.customer_name || 'Walk-in', t.payment_method, t.amount.toFixed(2), new Date(t.transaction_date).toLocaleDateString(), t.status])];
    } else {
      csvContent = [['Customer Name', 'Email', 'Phone', 'Balance', 'Credit Limit', 'Status'], 
        ...customers.map(c => [c.full_name, c.email, c.cellphone, parseNumeric(c.outstanding_balance).toFixed(2), parseNumeric(c.credit_limit).toFixed(2), c.status])];
    }
    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => { window.print(); };

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
          <button onClick={fetchData} className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="flex justify-between items-center px-8 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30"><ArrowLeft className="w-4 h-4" /> Back</button>
            <div><h1 className="text-2xl font-bold">Reports & Analytics</h1><p className="text-white/90 text-sm mt-1">Generate and export business reports</p></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30"><Printer className="w-4 h-4" /> Print</button>
            <button onClick={handleExport} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30"><Download className="w-4 h-4" /> Export</button>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <button onClick={() => setReportType('sales')} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold ${reportType === 'sales' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}><FileText className="w-5 h-5" /> Sales Report</button>
            <button onClick={() => setReportType('customers')} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold ${reportType === 'customers' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}><Users className="w-5 h-5" /> Customer Report</button>
          </div>
        </div>

        {reportType === 'sales' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Total Sales</p><p className="text-2xl font-bold text-gray-800">R{totalSales.toFixed(2)}</p></div><div className="bg-green-100 p-3 rounded-full"><DollarSign className="text-green-600 w-6 h-6" /></div></div></div>
              <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Credit Sales</p><p className="text-2xl font-bold text-purple-600">R{totalCredit.toFixed(2)}</p></div><div className="bg-purple-100 p-3 rounded-full"><CreditCard className="text-purple-600 w-6 h-6" /></div></div></div>
              <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Cash Sales</p><p className="text-2xl font-bold text-blue-600">R{totalCash.toFixed(2)}</p></div><div className="bg-blue-100 p-3 rounded-full"><ShoppingBag className="text-blue-600 w-6 h-6" /></div></div></div>
              <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Transactions</p><p className="text-2xl font-bold text-gray-800">{totalTransactions}</p></div><div className="bg-yellow-100 p-3 rounded-full"><TrendingUp className="text-yellow-600 w-6 h-6" /></div></div></div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Transaction Details</h2><p className="text-gray-500 text-sm mt-1">Showing {totalTransactions} transactions</p></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">ID</th><th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Customer</th><th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Type</th><th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Amount</th><th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Date</th><th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">Status</th></tr></thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-12 text-gray-500">No transactions for this date</td></tr>
                    ) : (
                      transactions.map(transaction => (
                        <tr key={transaction.transaction_id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-600">#{transaction.transaction_id}</td>
                          <td className="px-6 py-4 font-medium text-gray-800">{transaction.customer_name || 'Walk-in'}</td>
                          <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.payment_method === 'credit' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{transaction.payment_method === 'credit' ? 'Credit' : 'Cash'}</span></td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-800">R{transaction.amount.toFixed(2)}</td>
                          <td className="px-6 py-4 text-gray-600">{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-center"><span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">{transaction.status}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-gray-100"><tr><td className="px-6 py-4" colSpan="3"><p className="text-right">Total:</p></td><td className="px-6 py-4 text-right text-gray-800">R{totalSales.toFixed(2)}</td><td className="px-6 py-4" colSpan="2"></td></tr></tfoot>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Total Customers</p><p className="text-2xl font-bold text-gray-800">{totalCustomers}</p></div><div className="bg-purple-100 p-3 rounded-full"><Users className="text-purple-600 w-6 h-6" /></div></div></div>
              <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Active Customers</p><p className="text-2xl font-bold text-green-600">{activeCustomers}</p></div><div className="bg-green-100 p-3 rounded-full"><Users className="text-green-600 w-6 h-6" /></div></div></div>
              <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Total Outstanding</p><p className="text-2xl font-bold text-red-600">R{totalOutstanding.toFixed(2)}</p></div><div className="bg-red-100 p-3 rounded-full"><DollarSign className="text-red-600 w-6 h-6" /></div></div></div>
              <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Total Credit Limit</p><p className="text-2xl font-bold text-blue-600">R{totalCreditLimit.toFixed(2)}</p></div><div className="bg-blue-100 p-3 rounded-full"><CreditCard className="text-blue-600 w-6 h-6" /></div></div></div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Customer Details</h2><p className="text-gray-500 text-sm mt-1">Showing all registered customers</p></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Name</th><th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Email</th><th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Balance</th><th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Credit Limit</th><th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">Status</th></tr></thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-12 text-gray-500">No customers found</td></tr>
                    ) : (
                      customers.map(customer => (
                        <tr key={customer.customer_id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-800">{customer.full_name}</td>
                          <td className="px-6 py-4 text-gray-600">{customer.email}</td>
                          <td className="px-6 py-4 text-right font-semibold text-red-600">R{parseNumeric(customer.outstanding_balance).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-semibold text-green-600">R{parseNumeric(customer.credit_limit).toFixed(2)}</td>
                          <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${customer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{customer.status || 'active'}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-gray-100"><tr><td className="px-6 py-4 text-right" colSpan="2">Totals:</td><td className="px-6 py-4 text-right text-red-600">R{totalOutstanding.toFixed(2)}</td><td className="px-6 py-4 text-right text-green-600">R{totalCreditLimit.toFixed(2)}</td><td className="px-6 py-4"></td></tr></tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}