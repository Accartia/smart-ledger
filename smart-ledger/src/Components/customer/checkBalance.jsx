import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Calendar, TrendingUp } from 'lucide-react';

export default function CheckBalance() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchCustomerData();
  }, []);

  // Helper function to safely format currency
  const formatCurrency = (value) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const fetchCustomerData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/customers/${currentUser.customer_id}`);
      if (!response.ok) throw new Error('Failed to fetch customer data');
      const data = await response.json();
      
      // Convert string values to numbers
      const processedData = {
        ...data,
        outstanding_balance: typeof data.outstanding_balance === 'string' ? parseFloat(data.outstanding_balance) : (data.outstanding_balance || 0),
        credit_limit: typeof data.credit_limit === 'string' ? parseFloat(data.credit_limit) : (data.credit_limit || 0)
      };
      
      setCustomer(processedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customer:', error);
      setError('Failed to load balance data');
      setLoading(false);
    }
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
          <p className="text-gray-800 font-semibold">{error || 'Unable to load balance'}</p>
          <button 
            onClick={() => navigate('/customer/dashboard')} 
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
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
        <div className="flex items-center gap-4 px-8 py-4">
          <button 
            onClick={() => navigate('/customer/dashboard')}
            className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold">Check Balance</h1>
            <p className="text-white/90 text-sm mt-1">View your current account balance</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Main Balance Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
              <Wallet className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Your Balance</h2>
            <p className="text-gray-500 text-sm mb-6">Current outstanding amount</p>
            <p className="text-6xl font-bold text-purple-600 mb-4">R{formatCurrency(balance)}</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Account Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Credit Limit</p>
                <p className="text-2xl font-bold mt-1">R{formatCurrency(creditLimit)}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Available Credit</p>
                <p className="text-2xl font-bold mt-1">R{formatCurrency(availableCredit)}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Credit Utilization Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">Credit Utilization</h3>
            <span className="text-sm font-medium text-purple-600">
              {creditLimit > 0 ? ((balance / creditLimit) * 100).toFixed(1) : 0}% Used
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${creditLimit > 0 ? (balance / creditLimit) * 100 : 0}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-4 text-sm text-gray-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/customer/payment')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Make a Payment
          </button>
        </div>
      </div>
    </div>
  );
}