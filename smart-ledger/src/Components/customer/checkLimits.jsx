import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, TrendingUp, AlertCircle, Shield } from 'lucide-react';

export default function CheckLimits() {
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
        credit_limit: typeof data.credit_limit === 'string' ? parseFloat(data.credit_limit) : (data.credit_limit || 0),
        outstanding_balance: typeof data.outstanding_balance === 'string' ? parseFloat(data.outstanding_balance) : (data.outstanding_balance || 0)
      };
      
      setCustomer(processedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customer:', error);
      setError('Failed to load credit information');
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
          <p className="text-gray-800 font-semibold">{error || 'Unable to load credit information'}</p>
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

  const creditLimit = customer.credit_limit;
  const balance = customer.outstanding_balance;
  const availableCredit = creditLimit - balance;
  const utilizationPercent = creditLimit > 0 ? ((balance / creditLimit) * 100).toFixed(1) : '0';
  
  const getCreditHealth = () => {
    const percent = parseFloat(utilizationPercent);
    if (percent <= 30) return { text: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (percent <= 50) return { text: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (percent <= 70) return { text: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
  };
  
  const creditHealth = getCreditHealth();

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
            <h1 className="text-2xl font-bold">Credit Information</h1>
            <p className="text-white/90 text-sm mt-1">View your credit limit and usage</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Credit Score Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${creditHealth.bg} p-3 rounded-full`}>
                <Shield className={`w-6 h-6 ${creditHealth.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Credit Health Score</p>
                <p className={`text-xl font-bold ${creditHealth.color}`}>{creditHealth.text}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Utilization Rate</p>
              <p className="text-xl font-bold text-purple-600">{utilizationPercent}%</p>
            </div>
          </div>
        </div>

        {/* Main Credit Info Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-white" />
              <h2 className="text-xl font-bold text-white">Your Credit Details</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Credit Limit</span>
                </div>
                <span className="font-bold text-2xl text-green-600">R{formatCurrency(creditLimit)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-gray-600">Current Balance</span>
                </div>
                <span className="font-bold text-2xl text-red-600">R{formatCurrency(balance)}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600">Available Credit</span>
                </div>
                <span className="font-bold text-2xl text-blue-600">R{formatCurrency(availableCredit)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Utilization Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">Credit Utilization</h3>
            <span className="text-sm font-medium text-purple-600">{utilizationPercent}% of limit used</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${utilizationPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Keeping your utilization below 30% helps maintain a good credit score
          </p>
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