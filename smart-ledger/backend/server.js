const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root1',
    database: process.env.DB_NAME || 'smart_ledger'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('✅ Connected to MySQL database');
});

// ==========================================
// NOTIFICATION HELPER FUNCTIONS
// ==========================================

// Add notification for a user
const addNotification = (userId, title, message, type) => {
    const sql = 'INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, FALSE, NOW())';
    db.query(sql, [userId, title, message, type], (err) => {
        if (err) console.error('Error adding notification:', err);
    });
};

// Get user ID by customer ID
const getUserIdByCustomerId = (customerId) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT user_id FROM customers WHERE customer_id = ?', [customerId], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]?.user_id);
        });
    });
};

// Get user ID by cashier ID
const getUserIdByCashierId = (cashierId) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT user_id FROM cashiers WHERE cashier_id = ?', [cashierId], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]?.user_id);
        });
    });
};

// ==========================================
// TEST ROUTE
// ==========================================
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Login for all roles
app.post('/api/login', (req, res) => {
    const { email, password, role } = req.body;
    
    db.query('SELECT * FROM users WHERE email = ? AND role = ?', [email, role], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        
        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
        
        // Update last login
        db.query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);
        
        // Add welcome notification for customer login
        if (role === 'customer') {
            addNotification(user.user_id, 'Welcome Back!', `Welcome back to Smart Ledger! You logged in at ${new Date().toLocaleTimeString()}.`, 'success');
        }
        
        const token = jwt.sign({ userId: user.user_id, role: user.role }, process.env.JWT_SECRET || 'smart_ledger_secret', { expiresIn: '24h' });
        
        let userData = { id: user.user_id, email: user.email, role: user.role, username: user.username };
        
        if (role === 'customer') {
            db.query('SELECT * FROM customers WHERE user_id = ?', [user.user_id], (err, customerData) => {
                if (customerData.length > 0) {
                    userData = { ...userData, ...customerData[0] };
                }
                res.json({ success: true, token, user: userData });
            });
        } else if (role === 'cashier') {
            db.query('SELECT * FROM cashiers WHERE user_id = ?', [user.user_id], (err, cashierData) => {
                if (cashierData.length > 0) {
                    userData = { ...userData, ...cashierData[0] };
                }
                res.json({ success: true, token, user: userData });
            });
        } else {
            res.json({ success: true, token, user: userData });
        }
    });
});

// Register Customer
app.post('/api/register/customer', async (req, res) => {
    const { fullName, email, cellphone, gender, address, employmentStatus, monthlyIncome, password, shopId } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Calculate credit limit based on income
        let creditLimit = 0;
        if (employmentStatus === 'employed') {
            if (monthlyIncome === '1500-3000') creditLimit = 1000;
            else if (monthlyIncome === '3000-5000') creditLimit = 2000;
            else if (monthlyIncome === '5000-7000') creditLimit = 3500;
            else if (monthlyIncome === '7000-10000') creditLimit = 5000;
            else if (monthlyIncome === '10000+') creditLimit = 7500;
        } else {
            if (monthlyIncome === '350') creditLimit = 500;
            else if (monthlyIncome === '510') creditLimit = 800;
            else if (monthlyIncome === '2420') creditLimit = 1500;
        }
        
        db.beginTransaction((err) => {
            if (err) throw err;
            
            db.query('INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
                [email, email, hashedPassword, 'customer', 'active'],
                (err, userResult) => {
                    if (err) {
                        return db.rollback(() => { console.error(err); });
                    }
                    
                    const userId = userResult.insertId;
                    
                    db.query(`INSERT INTO customers (user_id, full_name, cellphone, gender, address, 
                              employment_status, monthly_income, credit_limit, outstanding_balance, shop_id, status) 
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'active')`,
                        [userId, fullName, cellphone, gender, address, employmentStatus, monthlyIncome, creditLimit, shopId],
                        (err) => {
                            if (err) {
                                return db.rollback(() => { console.error(err); });
                            }
                            
                            // Add welcome notification
                            addNotification(userId, 'Welcome to Smart Ledger!', `Your account has been created successfully. Your credit limit is R${creditLimit}.`, 'success');
                            
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => { console.error(err); });
                                }
                                res.json({ success: true, message: 'Registration successful!' });
                            });
                        });
                });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Process payment (UPDATED with notification)
app.post('/api/transactions/payment', async (req, res) => {
    const { customerId, amount, paymentMethod, cashierId } = req.body;
    
    db.beginTransaction(async (err) => {
        if (err) throw err;
        
        const referenceNumber = 'PAY' + Date.now();
        
        db.query(`INSERT INTO transactions (customer_id, cashier_id, transaction_type, amount, 
                  payment_method, reference_number, status) VALUES (?, ?, 'payment', ?, ?, ?, 'completed')`,
            [customerId, cashierId || null, amount, paymentMethod, referenceNumber],
            (err, transResult) => {
                if (err) {
                    return db.rollback(() => { console.error(err); });
                }
                
                db.query('UPDATE customers SET outstanding_balance = outstanding_balance - ? WHERE customer_id = ?',
                    [amount, customerId],
                    async (err) => {
                        if (err) {
                            return db.rollback(() => { console.error(err); });
                        }
                        
                        db.query('SELECT outstanding_balance FROM customers WHERE customer_id = ?', [customerId], async (err, balanceResult) => {
                            const newBalance = balanceResult[0].outstanding_balance;
                            
                            // Get user ID for notification
                            const userId = await getUserIdByCustomerId(customerId);
                            
                            // Add payment success notification
                            addNotification(userId, 'Payment Successful!', `Your payment of R${amount} has been processed. New balance: R${newBalance}. Reference: ${referenceNumber}`, 'payment');
                            
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => { console.error(err); });
                                }
                                res.json({ success: true, transactionId: transResult.insertId, referenceNumber, newBalance });
                            });
                        });
                    });
            });
    });
});

// Process sale (UPDATED with notification)
app.post('/api/transactions/sale', async (req, res) => {
    const { customerId, cashierId, items, total, paymentMethod } = req.body;
    
    db.beginTransaction(async (err) => {
        if (err) throw err;
        
        const referenceNumber = 'TXN' + Date.now();
        
        db.query(`INSERT INTO transactions (customer_id, cashier_id, transaction_type, amount, 
                  payment_method, reference_number, status) VALUES (?, ?, 'purchase', ?, ?, ?, 'completed')`,
            [customerId || null, cashierId, total, paymentMethod, referenceNumber],
            (err, transResult) => {
                if (err) {
                    return db.rollback(() => { console.error(err); });
                }
                
                const transactionId = transResult.insertId;
                let itemsProcessed = 0;
                
                items.forEach(item => {
                    db.query(`INSERT INTO transaction_items (transaction_id, product_id, quantity, 
                              unit_price, total_price) VALUES (?, ?, ?, ?, ?)`,
                        [transactionId, item.id, item.quantity, item.price, item.price * item.quantity],
                        (err) => {
                            if (err) {
                                return db.rollback(() => { console.error(err); });
                            }
                            
                            db.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
                                [item.quantity, item.id],
                                (err) => {
                                    if (err) {
                                        return db.rollback(() => { console.error(err); });
                                    }
                                    
                                    itemsProcessed++;
                                    if (itemsProcessed === items.length) {
                                        if (paymentMethod === 'credit' && customerId) {
                                            db.query('UPDATE customers SET outstanding_balance = outstanding_balance + ? WHERE customer_id = ?',
                                                [total, customerId],
                                                async (err) => {
                                                    if (err) {
                                                        return db.rollback(() => { console.error(err); });
                                                    }
                                                    
                                                    // Add purchase notification for customer
                                                    const userId = await getUserIdByCustomerId(customerId);
                                                    addNotification(userId, 'Purchase Made!', `Your purchase of R${total} has been added to your account. Reference: ${referenceNumber}`, 'purchase');
                                                    
                                                    db.commit((err) => {
                                                        if (err) {
                                                            return db.rollback(() => { console.error(err); });
                                                        }
                                                        res.json({ success: true, transactionId, referenceNumber });
                                                    });
                                                });
                                        } else {
                                            db.commit((err) => {
                                                if (err) {
                                                    return db.rollback(() => { console.error(err); });
                                                }
                                                res.json({ success: true, transactionId, referenceNumber });
                                            });
                                        }
                                    }
                                });
                        });
                });
            });
    });
});

// Get notifications for user
app.get('/api/notifications/:userId', (req, res) => {
    db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', 
        [req.params.userId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
});

// Mark notification as read
app.put('/api/notifications/:id/read', (req, res) => {
    db.query('UPDATE notifications SET is_read = TRUE WHERE notification_id = ?', 
        [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// Mark all as read
app.put('/api/notifications/user/:userId/read-all', (req, res) => {
    db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', 
        [req.params.userId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// Delete notification
app.delete('/api/notifications/:id', (req, res) => {
    db.query('DELETE FROM notifications WHERE notification_id = ?', 
        [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// ==========================================
// OTHER ROUTES (Keep your existing ones)
// ==========================================

// Get products
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products WHERE status = "active" ORDER BY product_name', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get shops
app.get('/api/shops', (req, res) => {
    db.query('SELECT * FROM shops WHERE status = "active"', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get customers
app.get('/api/customers', (req, res) => {
    db.query(`SELECT c.*, u.email, s.shop_name 
              FROM customers c 
              JOIN users u ON c.user_id = u.user_id 
              LEFT JOIN shops s ON c.shop_id = s.shop_id 
              WHERE c.status = 'active'
              ORDER BY c.full_name`, 
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
});

// Get customer by ID
app.get('/api/customers/:id', (req, res) => {
    db.query(`SELECT c.*, u.email, s.shop_name 
              FROM customers c 
              JOIN users u ON c.user_id = u.user_id 
              LEFT JOIN shops s ON c.shop_id = s.shop_id 
              WHERE c.customer_id = ?`, 
        [req.params.id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results[0] || {});
        });
});

// Get daily transactions
app.get('/api/transactions/daily/:date', (req, res) => {
    const date = req.params.date;
    db.query(`SELECT t.*, c.full_name as customer_name, cash.full_name as cashier_name
              FROM transactions t
              LEFT JOIN customers c ON t.customer_id = c.customer_id
              LEFT JOIN cashiers cash ON t.cashier_id = cash.cashier_id
              WHERE DATE(t.transaction_date) = ?
              ORDER BY t.transaction_date DESC`,
        [date], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
});

// Get customer transactions
app.get('/api/transactions/customer/:customerId', (req, res) => {
    db.query(`SELECT t.*, ti.product_id, ti.quantity, ti.unit_price, p.product_name 
              FROM transactions t 
              LEFT JOIN transaction_items ti ON t.transaction_id = ti.transaction_id
              LEFT JOIN products p ON ti.product_id = p.product_id
              WHERE t.customer_id = ? 
              ORDER BY t.transaction_date DESC 
              LIMIT 50`, 
        [req.params.customerId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
    const queries = {
        totalCustomers: 'SELECT COUNT(*) as count FROM customers WHERE status = "active"',
        totalProducts: 'SELECT COUNT(*) as count FROM products WHERE status = "active"',
        totalOutstanding: 'SELECT SUM(outstanding_balance) as total FROM customers',
        todaySales: 'SELECT SUM(amount) as total FROM transactions WHERE DATE(transaction_date) = CURDATE() AND transaction_type = "purchase"',
        lowStock: 'SELECT COUNT(*) as count FROM products WHERE stock_quantity <= reorder_level'
    };
    
    Promise.all(Object.values(queries).map(q => new Promise((resolve, reject) => {
        db.query(q, (err, result) => {
            if (err) reject(err);
            else resolve(result[0]);
        });
    }))).then(results => {
        const stats = {
            totalCustomers: results[0].count || 0,
            totalProducts: results[1].count || 0,
            totalOutstanding: results[2].total || 0,
            todaySales: results[3].total || 0,
            lowStock: results[4].count || 0
        };
        res.json(stats);
    }).catch(err => {
        res.status(500).json({ error: err.message });
    });
});

// Add product
app.post('/api/products', (req, res) => {
    const { product_name, category, price, unit, stock_quantity, reorder_level, supplier, shop_id } = req.body;
    
    db.query(`INSERT INTO products (product_name, category, price, unit, stock_quantity, reorder_level, supplier, shop_id, status) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [product_name, category, price, unit, stock_quantity, reorder_level, supplier, shop_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, productId: result.insertId });
        });
});

// Update product
app.put('/api/products/:id', (req, res) => {
    const { product_name, category, price, unit, stock_quantity, reorder_level, supplier } = req.body;
    db.query(`UPDATE products SET product_name=?, category=?, price=?, unit=?, 
              stock_quantity=?, reorder_level=?, supplier=?, updated_at=NOW() WHERE product_id=?`,
        [product_name, category, price, unit, stock_quantity, reorder_level, supplier, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
    db.query('DELETE FROM products WHERE product_id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Update stock
app.patch('/api/products/:id/stock', (req, res) => {
    const { stock_quantity } = req.body;
    db.query('UPDATE products SET stock_quantity = ? WHERE product_id = ?', [stock_quantity, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Update customer
app.put('/api/customers/:id', (req, res) => {
    const { full_name, email, cellphone, address } = req.body;
    db.beginTransaction((err) => {
        if (err) throw err;
        db.query('UPDATE customers SET full_name = ?, cellphone = ?, address = ? WHERE customer_id = ?',
            [full_name, cellphone, address, req.params.id],
            (err) => {
                if (err) return db.rollback(() => { console.error(err); });
                db.query('UPDATE users SET email = ? WHERE user_id = (SELECT user_id FROM customers WHERE customer_id = ?)',
                    [email, req.params.id],
                    (err) => {
                        if (err) return db.rollback(() => { console.error(err); });
                        db.commit((err) => {
                            if (err) return db.rollback(() => { console.error(err); });
                            res.json({ success: true });
                        });
                    });
            });
    });
});

// Register Cashier
app.post('/api/register/cashier', async (req, res) => {
    const { firstName, lastName, email, phone, shopName, shopLocation, position, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const fullName = `${firstName} ${lastName}`;
        db.beginTransaction((err) => {
            if (err) throw err;
            db.query('INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
                [email, email, hashedPassword, 'cashier', 'active'],
                (err, userResult) => {
                    if (err) return db.rollback(() => { console.error(err); });
                    const userId = userResult.insertId;
                    db.query('SELECT shop_id FROM shops WHERE shop_name = ?', [shopName], (err, shopResult) => {
                        let shopId;
                        if (shopResult.length > 0) {
                            shopId = shopResult[0].shop_id;
                            insertCashier();
                        } else {
                            db.query('INSERT INTO shops (shop_name, location, status) VALUES (?, ?, ?)', [shopName, shopLocation, 'active'], (err, newShop) => {
                                if (err) return db.rollback(() => { console.error(err); });
                                shopId = newShop.insertId;
                                insertCashier();
                            });
                        }
                        function insertCashier() {
                            db.query(`INSERT INTO cashiers (user_id, full_name, email, phone, shop_id, position, status) VALUES (?, ?, ?, ?, ?, ?, 'active')`,
                                [userId, fullName, email, phone, shopId, position],
                                (err) => {
                                    if (err) return db.rollback(() => { console.error(err); });
                                    db.commit((err) => {
                                        if (err) return db.rollback(() => { console.error(err); });
                                        res.json({ success: true, message: 'Cashier registered successfully!' });
                                    });
                                });
                        }
                    });
                });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Register Shop Owner
app.post('/api/register/admin', async (req, res) => {
    const { fullName, email, phone, shopName, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.beginTransaction((err) => {
            if (err) throw err;
            db.query('INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
                [email, email, hashedPassword, 'admin', 'active'],
                (err, userResult) => {
                    if (err) return db.rollback(() => { console.error(err); });
                    const userId = userResult.insertId;
                    db.query('INSERT INTO shops (shop_name, contact_number, email, owner_id, status) VALUES (?, ?, ?, ?, ?)',
                        [shopName, phone, email, userId, 'active'],
                        (err) => {
                            if (err) return db.rollback(() => { console.error(err); });
                            db.commit((err) => {
                                if (err) return db.rollback(() => { console.error(err); });
                                res.json({ success: true, message: 'Shop owner registered successfully!' });
                            });
                        });
                });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});