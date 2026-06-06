import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Package, Plus, Edit, Trash2, Search, 
  Filter, Download, Printer, X, AlertCircle, DollarSign
} from 'lucide-react';

export default function ManageInventory() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    unit: '',
    stock: '',
    reorderLevel: '',
    supplier: ''
  });

  const units = ['per kg', 'per litre', 'per loaf', 'per dozen', 'per pack', 'per bottle', 'per bar', 'per tube'];

  // Load products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      const productsArray = Array.isArray(data) ? data : [];
      
      // Convert price to number and ensure all numeric values are proper
      const processedProducts = productsArray.map(p => ({
        ...p,
        price: typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0),
        stock_quantity: typeof p.stock_quantity === 'string' ? parseInt(p.stock_quantity) : (p.stock_quantity || 0),
        reorder_level: typeof p.reorder_level === 'string' ? parseInt(p.reorder_level) : (p.reorder_level || 0)
      }));
      
      setProducts(processedProducts);
      // Extract unique categories
      const uniqueCategories = [...new Set(processedProducts.map(p => p?.category).filter(Boolean))];
      setCategories(uniqueCategories);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please make sure the backend is running.');
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    if (!p) return false;
    const matchesSearch = (p.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate statistics
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p && (p.stock_quantity || 0) <= (p.reorder_level || 0)).length;
  const outOfStockCount = products.filter(p => p && (p.stock_quantity || 0) === 0).length;
  const totalValue = products.reduce((sum, p) => sum + ((p?.price || 0) * (p?.stock_quantity || 0)), 0);

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.unit) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: newProduct.name,
          category: newProduct.category,
          price: parseFloat(newProduct.price),
          unit: newProduct.unit,
          stock_quantity: parseInt(newProduct.stock) || 0,
          reorder_level: parseInt(newProduct.reorderLevel) || 10,
          supplier: newProduct.supplier || 'Not specified',
          shop_id: 1
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchProducts();
        setNewProduct({ name: '', category: '', price: '', unit: '', stock: '', reorderLevel: '', supplier: '' });
        setShowAddModal(false);
        alert(`${newProduct.name} added successfully!`);
      } else {
        alert('Error adding product');
      }
    } catch (error) {
      alert('Connection error');
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct.product_name || !editingProduct.category || !editingProduct.price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/products/${editingProduct.product_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: editingProduct.product_name,
          category: editingProduct.category,
          price: parseFloat(editingProduct.price),
          unit: editingProduct.unit,
          stock_quantity: parseInt(editingProduct.stock_quantity) || 0,
          reorder_level: parseInt(editingProduct.reorder_level) || 10,
          supplier: editingProduct.supplier || ''
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchProducts();
        setShowEditModal(false);
        setEditingProduct(null);
        alert(`${editingProduct.product_name} updated successfully!`);
      } else {
        alert('Error updating product');
      }
    } catch (error) {
      alert('Connection error');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${id}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.success) {
          await fetchProducts();
          alert(`${name} deleted successfully!`);
        } else {
          alert('Error deleting product');
        }
      } catch (error) {
        alert('Connection error');
      }
    }
  };

  const handleUpdateStock = async (id, newStock) => {
    if (newStock < 0) return;
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_quantity: newStock })
      });
      
      if (response.ok) {
        await fetchProducts();
      }
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Product Name', 'Category', 'Price', 'Unit', 'Stock', 'Reorder Level', 'Supplier'],
      ...filteredProducts.map(p => [p.product_name, p.category, p.price, p.unit, p.stock_quantity, p.reorder_level, p.supplier])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper function to safely format price
  const formatPrice = (price) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-gray-800 font-semibold">{error}</p>
          <p className="text-gray-500 text-sm mt-2">Make sure your backend is running on port 5000</p>
          <button 
            onClick={fetchProducts} 
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            className="mt-2 ml-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="flex justify-between items-center px-8 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold">Manage Inventory</h1>
              <p className="text-white/90 text-sm mt-1">Track and manage your store products</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30"><Printer className="w-4 h-4" /> Print</button>
            <button onClick={handleExport} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30"><Download className="w-4 h-4" /> Export</button>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30"><Plus className="w-4 h-4" /> Add Product</button>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Total Products</p><p className="text-2xl font-bold text-gray-800">{totalProducts}</p></div><div className="bg-purple-100 p-3 rounded-full"><Package className="text-purple-600 w-6 h-6" /></div></div></div>
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Low Stock Items</p><p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p></div><div className="bg-yellow-100 p-3 rounded-full"><AlertCircle className="text-yellow-600 w-6 h-6" /></div></div></div>
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Out of Stock</p><p className="text-2xl font-bold text-red-600">{outOfStockCount}</p></div><div className="bg-red-100 p-3 rounded-full"><Package className="text-red-600 w-6 h-6" /></div></div></div>
          <div className="bg-white rounded-xl shadow-lg p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Inventory Value</p><p className="text-2xl font-bold text-green-600">R{totalValue.toLocaleString()}</p></div><div className="bg-green-100 p-3 rounded-full"><DollarSign className="text-green-600 w-6 h-6" /></div></div></div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Search products..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
            <div><div className="relative"><Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800"><option value="all">All Categories</option>{categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Product Inventory</h2><p className="text-gray-500 text-sm mt-1">Showing {filteredProducts.length} of {totalProducts} products</p></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr><th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Product</th><th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Category</th><th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Price</th><th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Stock</th><th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Reorder Level</th><th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Supplier</th><th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">Status</th><th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">Actions</th></tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-12 text-gray-500">No products found. Click "Add Product" to create one.</td></tr>
                ) : (
                  filteredProducts.map((product, index) => {
                    const stockQty = product.stock_quantity || 0;
                    const reorderLvl = product.reorder_level || 0;
                    const isLowStock = stockQty <= reorderLvl;
                    const isOutOfStock = stockQty === 0;
                    return (
                      <tr key={product.product_id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4"><div className="font-medium text-gray-800">{product.product_name}</div><div className="text-xs text-gray-500">{product.unit}</div></td>
                        <td className="px-6 py-4 text-gray-600">{product.category}</td>
                        <td className="px-6 py-4 text-right font-semibold text-purple-600">R{formatPrice(product.price)}</td>
                        <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-2"><button onClick={() => handleUpdateStock(product.product_id, stockQty - 1)} className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-sm font-bold">-</button><span className={`font-semibold w-12 text-center ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-800'}`}>{stockQty}</span><button onClick={() => handleUpdateStock(product.product_id, stockQty + 1)} className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-sm font-bold">+</button></div></td>
                        <td className="px-6 py-4 text-right text-gray-600">{reorderLvl}</td>
                        <td className="px-6 py-4 text-gray-600">{product.supplier || '-'}</td>
                        <td className="px-6 py-4 text-center">{isOutOfStock ? <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Out of Stock</span> : isLowStock ? <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Low Stock</span> : <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">In Stock</span>}</td>
                        <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => { setEditingProduct({ ...product }); setShowEditModal(true); }} className="text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeleteProduct(product.product_id, product.product_name)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></div></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl shadow-xl max-w-md w-full"><div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white flex justify-between items-center"><h2 className="text-xl font-bold">Add New Product</h2><button onClick={() => setShowAddModal(false)}><X className="w-6 h-6" /></button></div><div className="p-6"><div className="space-y-4"><input type="text" placeholder="Product Name *" className="w-full px-3 py-2 border rounded-lg" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} /><select className="w-full px-3 py-2 border rounded-lg" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}><option value="">Select Category *</option>{categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select><input type="number" step="0.01" placeholder="Price *" className="w-full px-3 py-2 border rounded-lg" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} /><select className="w-full px-3 py-2 border rounded-lg" value={newProduct.unit} onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}><option value="">Select Unit *</option>{units.map(unit => (<option key={unit} value={unit}>{unit}</option>))}</select><input type="number" placeholder="Stock" className="w-full px-3 py-2 border rounded-lg" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} /><input type="number" placeholder="Reorder Level" className="w-full px-3 py-2 border rounded-lg" value={newProduct.reorderLevel} onChange={(e) => setNewProduct({...newProduct, reorderLevel: e.target.value})} /><input type="text" placeholder="Supplier" className="w-full px-3 py-2 border rounded-lg" value={newProduct.supplier} onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})} /></div><div className="flex gap-3 mt-6"><button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button><button onClick={handleAddProduct} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg">Add Product</button></div></div></div></div>)}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl shadow-xl max-w-md w-full"><div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white flex justify-between items-center"><h2 className="text-xl font-bold">Edit Product</h2><button onClick={() => setShowEditModal(false)}><X className="w-6 h-6" /></button></div><div className="p-6"><div className="space-y-4"><input type="text" className="w-full px-3 py-2 border rounded-lg" value={editingProduct.product_name || ''} onChange={(e) => setEditingProduct({...editingProduct, product_name: e.target.value})} /><select className="w-full px-3 py-2 border rounded-lg" value={editingProduct.category || ''} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}>{categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select><input type="number" step="0.01" className="w-full px-3 py-2 border rounded-lg" value={editingProduct.price || 0} onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} /><select className="w-full px-3 py-2 border rounded-lg" value={editingProduct.unit || ''} onChange={(e) => setEditingProduct({...editingProduct, unit: e.target.value})}>{units.map(unit => (<option key={unit} value={unit}>{unit}</option>))}</select><input type="number" className="w-full px-3 py-2 border rounded-lg" value={editingProduct.stock_quantity || 0} onChange={(e) => setEditingProduct({...editingProduct, stock_quantity: parseInt(e.target.value)})} /><input type="number" placeholder="Reorder Level" className="w-full px-3 py-2 border rounded-lg" value={editingProduct.reorder_level || 0} onChange={(e) => setEditingProduct({...editingProduct, reorder_level: parseInt(e.target.value)})} /><input type="text" placeholder="Supplier" className="w-full px-3 py-2 border rounded-lg" value={editingProduct.supplier || ''} onChange={(e) => setEditingProduct({...editingProduct, supplier: e.target.value})} /></div><div className="flex gap-3 mt-6"><button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button><button onClick={handleEditProduct} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg">Save Changes</button></div></div></div></div>)}
    </div>
  );
}