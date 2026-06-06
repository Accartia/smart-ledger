import { useNavigate } from 'react-router-dom';
import { Store, User, Users } from 'lucide-react';

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-purple-600 mb-4">Smart Ledger</h1>
          <p className="text-gray-600 text-lg">Debit & Credit Management System</p>
          <p className="text-gray-400 text-sm mt-2">Select your role to continue</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Shop Owner Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Store className="text-white w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Shop Owner</h2>
            <p className="text-gray-500 text-center mb-4">Manage store, customers & credit</p>
            <button
              onClick={() => navigate('/login/admin')}
              className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 mb-2"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register/admin')}
              className="w-full border border-purple-600 text-purple-600 py-2 rounded-lg font-semibold hover:bg-purple-50"
            >
              Register Shop
            </button>
          </div>

          {/* Cashier Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <User className="text-white w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Cashier</h2>
            <p className="text-gray-500 text-center mb-4">Process sales & customer payments</p>
            <button
              onClick={() => navigate('/login/cashier')}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 mb-2"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register/cashier')}
              className="w-full border border-blue-600 text-blue-600 py-2 rounded-lg font-semibold hover:bg-blue-50"
            >
              Register
            </button>
          </div>

          {/* Customer Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="text-white w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Customer</h2>
            <p className="text-gray-500 text-center mb-4">View balance & make payments</p>
            <button
              onClick={() => navigate('/login/customer')}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 mb-2"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register/customer')}
              className="w-full border border-green-600 text-green-600 py-2 rounded-lg font-semibold hover:bg-green-50"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}