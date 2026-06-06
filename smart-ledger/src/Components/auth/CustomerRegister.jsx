import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Store } from 'lucide-react';

export default function CustomerRegister() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    cellphone: '',
    gender: '',
    address: '',
    employmentStatus: '',
    monthlyIncome: '',
    selectedShop: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/shops');
      const data = await response.json();
      setShops(data);
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getIncomeOptions = () => {
    if (formData.employmentStatus === 'employed') {
      return [
        { value: '1500-3000', label: 'R1,500 - R3,000' },
        { value: '3000-5000', label: 'R3,000 - R5,000' },
        { value: '5000-7000', label: 'R5,000 - R7,000' },
        { value: '7000-10000', label: 'R7,000 - R10,000' },
        { value: '10000+', label: 'R10,000+' }
      ];
    } else if (formData.employmentStatus === 'unemployed') {
      return [
        { value: '350', label: 'SASSA Grant - R350' },
        { value: '510', label: 'SASSA Grant - R510' },
        { value: '2420', label: 'SASSA Grant - R2,420' }
      ];
    }
    return [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          cellphone: formData.cellphone,
          gender: formData.gender,
          address: formData.address,
          employmentStatus: formData.employmentStatus,
          monthlyIncome: formData.monthlyIncome,
          password: formData.password,
          shopId: formData.selectedShop
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login/customer');
        }, 3000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <div className="text-green-500 text-4xl">✓</div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-4">Your account has been created successfully.</p>
          <Link to="/login/customer" className="inline-block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:opacity-90">
            Proceed to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 mb-4 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4" />
          Back to Role Selection
        </Link>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <Store className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Customer Registration</h1>
                <p className="mt-1 opacity-90">Create your customer account</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Cellphone Number *</label>
                <input
                  type="tel"
                  name="cellphone"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                  value={formData.cellphone}
                  onChange={handleChange}
                  placeholder="0712345678"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Gender *</label>
                <select
                  name="gender"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-medium mb-1">Address *</label>
                <textarea
                  name="address"
                  required
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Employment Status *</label>
                <select
                  name="employmentStatus"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                  value={formData.employmentStatus}
                  onChange={handleChange}
                >
                  <option value="">Select Status</option>
                  <option value="employed">Employed</option>
                  <option value="unemployed">Unemployed (SASSA Grant)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Monthly Income *</label>
                <select
                  name="monthlyIncome"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                  value={formData.monthlyIncome}
                  onChange={handleChange}
                  disabled={!formData.employmentStatus}
                >
                  <option value="">Select Income Range</option>
                  {getIncomeOptions().map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Select Shop *</label>
                <select
                  name="selectedShop"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                  value={formData.selectedShop}
                  onChange={handleChange}
                >
                  <option value="">Select a shop</option>
                  {shops.map(shop => (
                    <option key={shop.shop_id} value={shop.shop_id}>{shop.shop_name}</option>
                  ))}
                </select>
                {shops.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">No shops available. Please contact shop owner.</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity mt-6 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Customer Account'}
            </button>

            <div className="mt-4 text-center">
              <p className="text-gray-600 text-sm">
                Already have an account? 
                <Link to="/login/customer" className="text-purple-600 hover:underline ml-1">
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}