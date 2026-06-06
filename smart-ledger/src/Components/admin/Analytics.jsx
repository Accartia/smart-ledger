import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, Users, 
  ShoppingBag, CreditCard, Calendar, Download, Printer,
  BarChart, PieChart, Activity, AlertCircle,
  CheckCircle, Target, Award, Zap
} from 'lucide-react';

export default function Analytics() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [analyticsData, setAnalyticsData] = useState({
    sales: { total: 0, growth: 0, daily: [0,0,0,0,0,0,0] },
    payments: { total: 0, byMethod: { cash: 0, credit: 0 } },
    customers: { total: 0, new: 0, active: 0, inactive: 0, topSpenders: [] },
    products: { total: 0, lowStock: 0, outOfStock: 0, topSelling: [] },
    credit: { totalOutstanding: 0, averagePerCustomer: 0, overdue: 0, collectionRate: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [period, selectedYear, selectedMonth]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch customers
      const customersRes = await fetch('http://localhost:5000/api/customers');
      const customers = await customersRes.json();
      
      // Fetch products
      const productsRes = await fetch('http://localhost:5000/api/products');
      const products = await productsRes.json();
      
      // Fetch today's transactions
      const today = new Date().toISOString().split('T')[0];
      const transactionsRes = await fetch(`http://localhost:5000/api/transactions/daily/${today}`);
      const transactions = await transactionsRes.json();
      
      const totalSales = transactions.reduce((sum, t) => sum + t.amount, 0);
      const creditSales = transactions.filter(t => t.payment_method === 'credit').reduce((sum, t) => sum + t.amount, 0);
      const cashSales = transactions.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + t.amount, 0);
      const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0);
      const totalCreditLimit = customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0);
      const activeCustomers = customers.filter(c => c.status === 'active').length;
      const lowStock = products.filter(p => p.stock_quantity <= p.reorder_level).length;
      const outOfStock = products.filter(p => p.stock_quantity === 0).length;
      
      setAnalyticsData({
        sales: { total: totalSales, growth: 0, daily: [totalSales, totalSales * 0.8, totalSales * 1.2] },
        payments: { total: totalSales, byMethod: { cash: cashSales, credit: creditSales } },
        customers: { total: customers.length, new: 0, active: activeCustomers, inactive: customers.length - activeCustomers, topSpenders: [] },
        products: { total: products.length, lowStock: lowStock, outOfStock: outOfStock, topSelling: [] },
        credit: { totalOutstanding: totalOutstanding, averagePerCustomer: totalOutstanding / (customers.length || 1), overdue: 0, collectionRate: totalCreditLimit ? ((totalCreditLimit - totalOutstanding) / totalCreditLimit) * 100 : 0 }
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = [2024, 2025, 2026];

  const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start">
        <div><p className="text-gray-500 text-sm font-medium">{title}</p><p className="text-2xl font-bold mt-2 text-gray-800">{value}</p>{subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}</div>
        <div className={`${color} p-3 rounded-xl`}><Icon className="text-white w-6 h-6" /></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="flex justify-between items-center px-8 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30"><ArrowLeft className="w-4 h-4" /> Back</button>
            <div><h1 className="text-2xl font-bold">Analytics Dashboard</h1><p className="text-white/90 text-sm mt-1">View business performance and customer insights</p></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30"><Printer className="w-4 h-4" /> Print</button>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => setPeriod('daily')} className={`px-4 py-2 rounded-lg font-medium ${period === 'daily' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Daily</button>
              <button onClick={() => setPeriod('weekly')} className={`px-4 py-2 rounded-lg font-medium ${period === 'weekly' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Weekly</button>
              <button onClick={() => setPeriod('monthly')} className={`px-4 py-2 rounded-lg font-medium ${period === 'monthly' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Monthly</button>
              <button onClick={() => setPeriod('yearly')} className={`px-4 py-2 rounded-lg font-medium ${period === 'yearly' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Yearly</button>
            </div>
            <div className="flex gap-2">
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg bg-white"><option value={2024}>2024</option><option value={2025}>2025</option><option value={2026}>2026</option></select>
              {period !== 'yearly' && (<select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg bg-white">{months.map((month, index) => (<option key={index} value={index}>{month}</option>))}</select>)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Revenue" value={`R${analyticsData.sales.total.toLocaleString()}`} icon={DollarSign} color="bg-gradient-to-r from-green-500 to-green-600" />
          <StatCard title="Total Customers" value={analyticsData.customers.total} subtitle={`${analyticsData.customers.active} active`} icon={Users} color="bg-gradient-to-r from-blue-500 to-blue-600" />
          <StatCard title="Outstanding Credit" value={`R${analyticsData.credit.totalOutstanding.toLocaleString()}`} icon={CreditCard} color="bg-gradient-to-r from-yellow-500 to-yellow-600" />
          <StatCard title="Collection Rate" value={`${analyticsData.credit.collectionRate.toFixed(1)}%`} icon={Target} color="bg-gradient-to-r from-purple-500 to-purple-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600" /> Sales Trend</h3></div><div className="h-64 flex items-end gap-2">{analyticsData.sales.daily.map((sale, index) => (<div key={index} className="flex-1 flex flex-col items-center gap-2"><div className="w-full bg-gradient-to-t from-purple-500 to-blue-500 rounded-t-lg" style={{ height: `${(sale / Math.max(...analyticsData.sales.daily, 1)) * 200}px` }}></div><span className="text-xs text-gray-500">{period === 'daily' ? `Day ${index + 1}` : `M${index + 1}`}</span><span className="text-xs font-semibold">R{sale}</span></div>))}</div></div>
          
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><PieChart className="w-5 h-5 text-purple-600" /> Payment Methods</h3></div><div className="space-y-4"><div><div className="flex justify-between mb-1"><span className="text-sm text-gray-600">Cash</span><span className="text-sm font-semibold">R{analyticsData.payments.byMethod.cash.toLocaleString()}</span></div><div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-green-500 h-4 rounded-full" style={{ width: `${analyticsData.payments.total ? (analyticsData.payments.byMethod.cash / analyticsData.payments.total) * 100 : 0}%` }}></div></div></div><div><div className="flex justify-between mb-1"><span className="text-sm text-gray-600">Credit</span><span className="text-sm font-semibold">R{analyticsData.payments.byMethod.credit.toLocaleString()}</span></div><div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-blue-500 h-4 rounded-full" style={{ width: `${analyticsData.payments.total ? (analyticsData.payments.byMethod.credit / analyticsData.payments.total) * 100 : 0}%` }}></div></div></div></div></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center gap-3 mb-3"><Activity className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-gray-800">Customer Activity</h3></div><div className="space-y-2"><div className="flex justify-between"><span className="text-sm text-gray-600">Active Customers</span><span className="font-semibold text-green-600">{analyticsData.customers.active}</span></div><div className="flex justify-between"><span className="text-sm text-gray-600">Inactive Customers</span><span className="font-semibold text-red-600">{analyticsData.customers.inactive}</span></div></div></div>
          
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center gap-3 mb-3"><AlertCircle className="w-5 h-5 text-yellow-600" /><h3 className="font-semibold text-gray-800">Inventory Status</h3></div><div className="space-y-2"><div className="flex justify-between"><span className="text-sm text-gray-600">Total Products</span><span className="font-semibold text-gray-800">{analyticsData.products.total}</span></div><div className="flex justify-between"><span className="text-sm text-gray-600">Low Stock</span><span className="font-semibold text-yellow-600">{analyticsData.products.lowStock}</span></div><div className="flex justify-between"><span className="text-sm text-gray-600">Out of Stock</span><span className="font-semibold text-red-600">{analyticsData.products.outOfStock}</span></div></div></div>
          
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center gap-3 mb-3"><Target className="w-5 h-5 text-purple-600" /><h3 className="font-semibold text-gray-800">Credit Performance</h3></div><div className="space-y-2"><div className="flex justify-between"><span className="text-sm text-gray-600">Avg Credit per Customer</span><span className="font-semibold text-gray-800">R{analyticsData.credit.averagePerCustomer.toFixed(2)}</span></div><div className="flex justify-between"><span className="text-sm text-gray-600">Collection Rate</span><span className="font-semibold text-green-600">{analyticsData.credit.collectionRate.toFixed(1)}%</span></div></div></div>
        </div>
      </div>
    </div>
  );
}