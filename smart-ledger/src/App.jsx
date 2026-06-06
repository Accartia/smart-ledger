import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoleSelection from './components/auth/RoleSelection';
import AdminLogin from './components/auth/AdminLogin';
import CashierLogin from './components/auth/CashierLogin';
import CustomerLogin from './components/auth/CustomerLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import CashierDashboard from './components/cashier/CashierDashboard';
import CustomerDashboard from './components/customer/customerDashboard';
import TransactionScreen from './components/cashier/TransactionScreen';
import CheckBalance from './components/customer/checkBalance';
import CheckLimits from './components/customer/checkLimits';
import MakePayment from './components/customer/makePayment';
import PurchasedItems from './components/customer/purchasedItems';
import CustomerDetails from './components/customer/customerDetails';
import AdminRegister from './components/auth/AdminRegister';
import CashierRegister from './components/auth/CashierRegister';
import CustomerRegister from './Components/auth/CustomerRegister';
import ProductCatalog from './Components/cashier/productCatalog';
import CustomerList from './Components/cashier/CustomerList';
import DailySummary from './Components/cashier/DailySummary';
import Reports from './components/admin/Reports'; 
import ManageInventory from './components/admin/ManageInventory';
import CustomerManagement from './components/admin/CustomerManagement';
import Analytics from './components/admin/Analytics';
import Notifications from './components/customer/Notifications';

function App() {
  return (
    <Router>
      <Routes>
        {/* Role Selection */}
        <Route path="/" element={<RoleSelection />} />
        
        {/* Login Routes */}
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/login/cashier" element={<CashierLogin />} />
        <Route path="/login/customer" element={<CustomerLogin />} />
        
        {/* Registration Routes */}
        <Route path="/register/admin" element={<AdminRegister />} />
        <Route path="/register/cashier" element={<CashierRegister />} />
        <Route path="/register/customer" element={<CustomerRegister />} />
        
        {/* Admin Dashboard Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/reports" element={<Reports />} /> 
          <Route path="/admin/inventory" element={<ManageInventory />} /> 
          <Route path="/admin/customers" element={<CustomerManagement />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          

        {/* Cashier Dashboard Routes */}
        <Route path="/cashier/dashboard" element={<CashierDashboard />} />
        <Route path="/cashier/transaction" element={<TransactionScreen />} />
        <Route path="/cashier/products" element={<ProductCatalog />} />
        <Route path="/cashier/customers" element={<CustomerList />} />
        <Route path="/cashier/daily-summary" element={<DailySummary />} />
        
        {/* Customer Dashboard Routes */}
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/customer/balance" element={<CheckBalance />} />
        <Route path="/customer/limits" element={<CheckLimits />} />
        <Route path="/customer/payment" element={<MakePayment />} />
        <Route path="/customer/history" element={<PurchasedItems />} />
        <Route path="/customer/details" element={<CustomerDetails />} />
        <Route path="/customer/notifications" element={<Notifications />} />
      </Routes>
    </Router>
  );
}

export default App;