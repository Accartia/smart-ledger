import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Download, Plus, Package, Edit, Trash2, X, PlusCircle } from 'lucide-react';

export default function ProductCatalog() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [showNewUnitModal, setShowNewUnitModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState(['Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Meat', 'Pantry', 'Beverages', 'Household', 'Personal Care']);
  const [units, setUnits] = useState(['per kg', 'per litre', 'per loaf', 'per dozen', 'per pack', 'per bottle', 'per bar', 'per tube']);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    unit: '',
    stock: ''
  });

  // Load categories and units from localStorage
  useEffect(() => {
    loadCategoriesFromStorage();
    loadUnitsFromStorage();
  }, []);

  const loadCategoriesFromStorage = () => {
    const savedCategories = localStorage.getItem('productCategories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
  };

  const loadUnitsFromStorage = () => {
    const savedUnits = localStorage.getItem('productUnits');
    if (savedUnits) {
      setUnits(JSON.parse(savedUnits));
    }
  };

  const saveCategoriesToStorage = (updatedCategories) => {
    localStorage.setItem('productCategories', JSON.stringify(updatedCategories));
    setCategories(updatedCategories);
  };

  const saveUnitsToStorage = (updatedUnits) => {
    localStorage.setItem('productUnits', JSON.stringify(updatedUnits));
    setUnits(updatedUnits);
  };

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }
    if (categories.includes(newCategoryName)) {
      alert('Category already exists');
      return;
    }
    const updatedCategories = [...categories, newCategoryName];
    saveCategoriesToStorage(updatedCategories);
    setNewCategoryName('');
    setShowNewCategoryModal(false);
    alert(`Category "${newCategoryName}" added successfully!`);
  };

  const handleAddNewUnit = () => {
    if (!newUnitName.trim()) {
      alert('Please enter a unit name');
      return;
    }
    if (units.includes(newUnitName)) {
      alert('Unit already exists');
      return;
    }
    const updatedUnits = [...units, newUnitName];
    saveUnitsToStorage(updatedUnits);
    setNewUnitName('');
    setShowNewUnitModal(false);
    alert(`Unit "${newUnitName}" added successfully!`);
  };

  // Load products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const csvContent = [
      ['Product Name', 'Category', 'Price', 'Unit', 'Stock'],
      ...filteredProducts.map(p => [p.product_name, p.category, p.price, p.unit, p.stock_quantity])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product_catalog_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.unit) {
      alert('Please fill in all fields');
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
          reorder_level: 10,
          supplier: 'Store',
          shop_id: 1
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchProducts();
        setNewProduct({ name: '', category: '', price: '', unit: '', stock: '' });
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
      alert('Please fill in all fields');
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
          reorder_level: editingProduct.reorder_level,
          supplier: editingProduct.supplier
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
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
              <h1 className="text-2xl font-bold">Product Catalog</h1>
              <p className="text-white/90 text-sm mt-1">Browse all available products in your store</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Search Box */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products by name or category..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">All Products</h2>
            <p className="text-gray-500 text-sm mt-1">Showing {filteredProducts.length} of {products.length} products</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <div key={product.product_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-purple-300 transition-all bg-white">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">{product.product_name}</h3>
                      <p className="text-gray-500 text-sm mt-1">{product.category}</p>
                      <p className="text-purple-600 font-bold text-xl mt-2">R{product.price}</p>
                      <p className="text-xs text-gray-400">{product.unit}</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => {
                          setEditingProduct({ ...product });
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.product_id, product.product_name)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500">Stock: <span className="font-medium">{product.stock_quantity} units</span></p>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No products found</p>
                <p className="text-sm mt-1">Try adjusting your search</p>
              </div>
            )}
          </div>

          {/* Summary Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Total Products: {products.length}
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">Categories: {categories.length}</span>
                <span className="text-gray-600">In Stock: {products.filter(p => p.stock_quantity > 0).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Add New Product</h2>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Product Name *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Category *</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowNewCategoryModal(true)}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
                    >
                      <PlusCircle className="w-4 h-4" />
                      New
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Price (R) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Unit *</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                    >
                      <option value="">Select Unit</option>
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowNewUnitModal(true)}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
                    >
                      <PlusCircle className="w-4 h-4" />
                      New
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Initial Stock</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProduct}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:opacity-90"
                >
                  Add Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Edit Product</h2>
              <button onClick={() => setShowEditModal(false)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Product Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                    value={editingProduct.product_name || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, product_name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Category</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                      value={editingProduct.category || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowNewCategoryModal(true)}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
                    >
                      <PlusCircle className="w-4 h-4" />
                      New
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Price (R)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Unit</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                      value={editingProduct.unit || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, unit: e.target.value})}
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowNewUnitModal(true)}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
                    >
                      <PlusCircle className="w-4 h-4" />
                      New
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                    value={editingProduct.stock_quantity || 0}
                    onChange={(e) => setEditingProduct({...editingProduct, stock_quantity: parseInt(e.target.value)})}
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditProduct}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:opacity-90"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Category Modal */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Add New Category</h2>
              <button onClick={() => setShowNewCategoryModal(false)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter new category name"
                />
                <p className="text-xs text-gray-400 mt-1">e.g., Snacks, Frozen Foods, etc.</p>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowNewCategoryModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleAddNewCategory} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg">
                  Add Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Unit Modal */}
      {showNewUnitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Add New Unit</h2>
              <button onClick={() => setShowNewUnitModal(false)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Unit Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder="Enter new unit"
                />
                <p className="text-xs text-gray-400 mt-1">e.g., per box, per pack, per piece, etc.</p>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowNewUnitModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleAddNewUnit} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg">
                  Add Unit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}