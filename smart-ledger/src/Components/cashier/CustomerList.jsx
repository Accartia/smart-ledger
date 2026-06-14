import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Eye, Trash2, 
  Users, Phone, Mail, CreditCard,
  DollarSign, Download, Printer, Filter, Store
} from 'lucide-react';

export default function CustomerList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
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
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/customers', {
        headers: {
          'shop-id': shopId
        }
      });
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      
      // Process customers - ensure numeric values are numbers
      const processedCustomers = (Array.isArray(data) ? data : []).map(customer => ({
        ...customer,
        outstanding_balance: parseNumeric(customer.outstanding_balance),
        credit_limit: parseNumeric(customer.credit_limit)
      }));
      
      setCustomers(processedCustomers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers');
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.cellphone?.includes(searchTerm);
    return matchesSearch;
  });

  // Calculate totals
  const totalCustomers = customers.length;
  const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0);
  const totalCreditLimit = customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0);

  const handleExport = () => {
    const csvContent = [
      ['Full Name', 'Email', 'Phone', 'Balance', 'Credit Limit', 'Status'],
      ...filteredCustomers.map(c => [
        c.full_name,
        c.email,
        c.cellphone,
        parseNumeric(c.outstanding_balance).toFixed(2),
        parseNumeric(c.credit_limit).toFixed(2),
        c.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
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
          <button 
            onClick={fetchCustomers} 
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
          <button 
            onClick={() => navigate('/cashier/dashboard')} 
            className="mt-2 ml-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
          >
            Back to Dashboard
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
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/cashier/dashboard')}
              className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                <h1 className="text-2xl font-bold">Customer Management</h1>
              </div>
              <p className="text-white/90 text-sm mt-1">View customers for {shopName || 'your shop'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Customers</p>
                <p className="text-2xl font-bold text-gray-800">{totalCustomers}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="text-purple-600 w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Outstanding</p>
                <p className="text-2xl font-bold text-red-600">R{parseNumeric(totalOutstanding).toFixed(2)}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <DollarSign className="text-red-600 w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Credit Limit</p>
                <p className="text-2xl font-bold text-blue-600">R{parseNumeric(totalCreditLimit).toFixed(2)}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <CreditCard className="text-blue-600 w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Registered Customers</h2>
            <p className="text-gray-500 text-sm mt-1">Showing {filteredCustomers.length} of {totalCustomers} customers</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Contact</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Credit Limit</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Balance</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500">
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No customers found for your shop</p>
                      <p className="text-sm mt-1">Customers who register at {shopName || 'your shop'} will appear here</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <tr key={customer.customer_id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{customer.full_name}</p>
                            <p className="text-xs text-gray-500 capitalize">{customer.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-800">{customer.email}</p>
                        <p className="text-xs text-gray-500">{customer.cellphone}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-blue-600">R{parseNumeric(customer.credit_limit).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-semibold ${parseNumeric(customer.outstanding_balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          R{parseNumeric(customer.outstanding_balance).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {customer.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => alert(`Customer Details: ${customer.full_name}\nEmail: ${customer.email}\nPhone: ${customer.cellphone}\nBalance: R${parseNumeric(customer.outstanding_balance).toFixed(2)}\nCredit Limit: R${parseNumeric(customer.credit_limit).toFixed(2)}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {filteredCustomers.length} of {totalCustomers} customers
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">Total Outstanding: <strong className="text-red-600">R{parseNumeric(totalOutstanding).toFixed(2)}</strong></span>
                <span className="text-gray-600">Shop: {shopName || 'Your Store'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}