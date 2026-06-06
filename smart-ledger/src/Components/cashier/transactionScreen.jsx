import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ShoppingCart, User, CreditCard, DollarSign, Search } from 'lucide-react';

export default function TransactionScreen() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Get current cashier from localStorage
  const currentCashier = JSON.parse(localStorage.getItem('user') || '{}');

  // Helper function to safely format price/currency
  const formatPrice = (value) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Helper function to safely parse numeric values from API
  const parseNumeric = (value) => {
    if (value === null || value === undefined) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      
      // Convert price to number for each product
      const processedProducts = (Array.isArray(data) ? data : []).map(product => ({
        ...product,
        price: parseNumeric(product.price)
      }));
      
      setProducts(processedProducts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/customers');
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      
      // Convert numeric values for each customer
      const processedCustomers = (Array.isArray(data) ? data : []).map(customer => ({
        ...customer,
        outstanding_balance: parseNumeric(customer.outstanding_balance),
        credit_limit: parseNumeric(customer.credit_limit)
      }));
      
      setCustomers(processedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  };

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {});

  const categories = ['all', ...Object.keys(productsByCategory)];

  const getDisplayProducts = () => {
    let allProducts = [];
    if (selectedCategory === 'all') {
      allProducts = products;
    } else {
      allProducts = productsByCategory[selectedCategory] || [];
    }
    
    if (searchTerm) {
      return allProducts.filter(p => 
        p.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return allProducts;
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.product_id);
      if (existing) {
        return prev.map(item => 
          item.id === product.product_id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
        id: product.product_id, 
        name: product.product_name, 
        price: product.price, 
        unit: product.unit,
        quantity: 1 
      }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }
    
    if (paymentMethod === 'credit' && !selectedCustomer) {
      alert('Please select a customer for credit purchase');
      return;
    }
    
    setProcessing(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/transactions/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer || null,
          cashierId: currentCashier.cashier_id,
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          total: calculateTotal(),
          paymentMethod: paymentMethod
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Sale completed!\nTotal: R${formatPrice(calculateTotal())}\nPayment: ${paymentMethod === 'cash' ? 'Cash' : 'Credit'}\nReference: ${data.referenceNumber}`);
        setCart([]);
        setSelectedCustomer('');
        // Refresh customer balances
        fetchCustomers();
      } else {
        alert('Error processing sale');
      }
    } catch (error) {
      alert('Connection error');
    } finally {
      setProcessing(false);
    }
  };

  const selectedCustomerData = customers.find(c => c.customer_id === parseInt(selectedCustomer));
  const availableCredit = selectedCustomerData 
    ? selectedCustomerData.credit_limit - selectedCustomerData.outstanding_balance
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
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
            onClick={() => window.location.reload()} 
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
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
              <h1 className="text-2xl font-bold">New Transaction</h1>
              <p className="text-white/90 text-sm mt-1">Process customer purchases</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Products */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Search Box */}
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="border-b p-4">
                <div className="flex gap-2 overflow-x-auto">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                        selectedCategory === cat 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat === 'all' ? 'All Products' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {getDisplayProducts().map(product => (
                    <button
                      key={product.product_id}
                      onClick={() => addToCart(product)}
                      className="text-left p-4 border border-gray-200 rounded-lg hover:shadow-lg hover:border-purple-300 transition-all bg-white"
                    >
                      <div className="font-bold text-gray-800">{product.product_name}</div>
                      <div className="text-sm text-gray-500 mt-1">{product.unit}</div>
                      <div className="text-purple-600 font-bold text-xl mt-2">R{formatPrice(product.price)}</div>
                    </button>
                  ))}
                </div>
                {getDisplayProducts().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No products found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Payment Method */}
              <div className="border-b p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Payment Method</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                      paymentMethod === 'cash' 
                        ? 'bg-gradient-to-r from-green-600 to-green-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    Cash
                  </button>
                  <button
                    onClick={() => setPaymentMethod('credit')}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                      paymentMethod === 'credit' 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Credit
                  </button>
                </div>
              </div>

              {/* Select Customer */}
              <div className="border-b p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Select Customer</h3>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    disabled={paymentMethod === 'cash'}
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer.customer_id} value={customer.customer_id}>
                        {customer.full_name} - Balance: R{formatPrice(customer.outstanding_balance)}
                      </option>
                    ))}
                  </select>
                </div>
                {paymentMethod === 'credit' && selectedCustomer && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Available Credit: </span>
                    <span className={`font-semibold ${availableCredit >= calculateTotal() ? 'text-green-600' : 'text-red-600'}`}>
                      R{formatPrice(availableCredit)}
                    </span>
                  </div>
                )}
                {paymentMethod === 'credit' && !selectedCustomer && (
                  <p className="text-xs text-red-500 mt-1">Please select a customer for credit purchase</p>
                )}
              </div>

              {/* Cart Items */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Cart Items</h3>
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{item.name}</div>
                          <div className="text-xs text-gray-500">R{formatPrice(item.price)} {item.unit}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 text-sm font-bold"
                            >
                              -
                            </button>
                            <span className="text-sm w-6 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 text-sm font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-800">R{formatPrice(item.price * item.quantity)}</div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 text-sm mt-1 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total and Complete Sale */}
              <div className="border-t p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold text-purple-600">R{formatPrice(calculateTotal())}</span>
                </div>
                <button
                  onClick={handleCompleteSale}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}