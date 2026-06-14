import { useNavigate } from 'react-router-dom';
import { Store, User, Users } from 'lucide-react';

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/super.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Smart Ledger
            </h1>
            <p className="text-white/90 text-xl drop-shadow-md">Debit & Credit Management System</p>
            <p className="text-white/70 text-sm mt-2">Select your role to continue</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Shop Owner Card */}
            <button
              onClick={() => navigate('/login/admin')}
              className="group bg-white/15 backdrop-blur-md rounded-xl border border-white/30 p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer hover:bg-white/25"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Store className="text-white w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 text-center">Shop Owner</h2>
              <p className="text-white/80 text-center">Manage store, customers & credit</p>
            </button>

            {/* Cashier Card */}
            <button
              onClick={() => navigate('/login/cashier')}
              className="group bg-white/15 backdrop-blur-md rounded-xl border border-white/30 p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer hover:bg-white/25"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <User className="text-white w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 text-center">Cashier</h2>
              <p className="text-white/80 text-center">Process sales & customer payments</p>
            </button>

            {/* Customer Card */}
            <button
              onClick={() => navigate('/login/customer')}
              className="group bg-white/15 backdrop-blur-md rounded-xl border border-white/30 p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer hover:bg-white/25"
            >
              <div className="bg-gradient-to-r from-green-600 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Users className="text-white w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 text-center">Customer</h2>
              <p className="text-white/80 text-center">View balance & make payments</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}