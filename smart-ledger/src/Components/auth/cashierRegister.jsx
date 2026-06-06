import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, ArrowLeft, Briefcase, MapPin, Store } from 'lucide-react';

export default function CashierRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    shopName: '',
    shopLocation: '',
    position: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || 
        !formData.shopName || !formData.shopLocation || !formData.position) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

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
      const response = await fetch('http://localhost:5000/api/register/cashier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login/cashier');
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
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 mb-4 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 text-white">
            <h1 className="text-xl font-bold">Cashier Registration</h1>
            <p className="text-sm opacity-90 mt-1">Create your cashier account</p>
          </div>

          <form onSubmit={handleSubmit} className="p-5">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="cashier@store.com"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0712345678"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-1">Shop Name</label>
                <input
                  type="text"
                  name="shopName"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                  value={formData.shopName}
                  onChange={handleChange}
                  placeholder="Enter shop name"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-1">Shop Location</label>
                <input
                  type="text"
                  name="shopLocation"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                  value={formData.shopLocation}
                  onChange={handleChange}
                  placeholder="Enter shop location"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-1">Position</label>
                <select
                  name="position"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                  value={formData.position}
                  onChange={handleChange}
                >
                  <option value="">Select position</option>
                  <option value="Senior Cashier">Senior Cashier</option>
                  <option value="Junior Cashier">Junior Cashier</option>
                  <option value="Trainee">Trainee</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create password"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity mt-6 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Cashier Account'}
            </button>

            <div className="mt-4 text-center">
              <p className="text-gray-600 text-sm">
                Already have an account? 
                <Link to="/login/cashier" className="text-blue-600 hover:underline ml-1">
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