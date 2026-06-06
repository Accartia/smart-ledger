import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Save, Shield, Edit2, CheckCircle } from 'lucide-react';

export default function CustomerDetails() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Helper function to safely format currency
  const formatCurrency = (value) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

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
      setFormData({
        full_name: processedData.full_name,
        email: currentUser.email,
        phone: processedData.cellphone,
        address: processedData.address,
        gender: processedData.gender,
        employment_status: processedData.employment_status
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customer:', error);
      setError('Failed to load customer data');
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`http://localhost:5000/api/customers/${currentUser.customer_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          cellphone: formData.phone,
          address: formData.address
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowSuccess(true);
        setIsEditing(false);
        setTimeout(() => setShowSuccess(false), 3000);
        // Refresh customer data
        fetchCustomerData();
      }
    } catch (error) {
      alert('Error updating profile');
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
          <p className="text-gray-800 font-semibold">{error || 'Unable to load profile'}</p>
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
  const outstandingBalance = customer.outstanding_balance;
  const availableCredit = creditLimit - outstandingBalance;
  const utilizationRate = creditLimit > 0 ? Math.round((outstandingBalance / creditLimit) * 100) : 0;

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
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-white/90 text-sm mt-1">View and manage your personal information</p>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-3xl mx-auto">
        {showSuccess && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800">{customer.full_name}</h2>
              <p className="text-gray-500 text-sm">Member since: {new Date(customer.register_date).toLocaleDateString()}</p>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600">Verified Account</span>
              </div>
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className="flex items-center gap-2 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50"
            >
              <Edit2 className="w-4 h-4" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-white" />
              <h2 className="text-xl font-bold text-white">Personal Information</h2>
            </div>
          </div>
          
          <form onSubmit={handleUpdate} className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Full Name</label>
                <input 
                  type="text" 
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800 ${!isEditing ? 'bg-gray-100 border-gray-200 text-gray-500' : 'border-gray-300'}`} 
                  value={formData.full_name || ''} 
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                  disabled={!isEditing} 
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
                <input 
                  type="email" 
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800 ${!isEditing ? 'bg-gray-100 border-gray-200 text-gray-500' : 'border-gray-300'}`} 
                  value={formData.email || ''} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  disabled={!isEditing} 
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800 ${!isEditing ? 'bg-gray-100 border-gray-200 text-gray-500' : 'border-gray-300'}`} 
                  value={formData.phone || ''} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  disabled={!isEditing} 
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Gender</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500" 
                  value={formData.gender || ''} 
                  disabled 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-medium mb-2">Address</label>
                <textarea 
                  rows="3" 
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800 ${!isEditing ? 'bg-gray-100 border-gray-200 text-gray-500' : 'border-gray-300'}`} 
                  value={formData.address || ''} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  disabled={!isEditing} 
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Employment Status</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500" 
                  value={formData.employment_status === 'employed' ? 'Employed' : 'Unemployed (SASSA Grant)'} 
                  disabled 
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Registered Shop</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500" 
                  value={customer.shop_name || 'Moroka Supermarket'} 
                  disabled 
                />
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Account Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">R{formatCurrency(creditLimit)}</p>
              <p className="text-xs text-gray-500">Credit Limit</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">R{formatCurrency(outstandingBalance)}</p>
              <p className="text-xs text-gray-500">Outstanding Balance</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">R{formatCurrency(availableCredit)}</p>
              <p className="text-xs text-gray-500">Available Credit</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{utilizationRate}%</p>
              <p className="text-xs text-gray-500">Utilization Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}