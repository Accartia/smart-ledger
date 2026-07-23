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

const addNotification = (userId, title, message, type) => {
    const sql = 'INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, FALSE, NOW())';
    db.query(sql, [userId, title, message, type], (err) => {
        if (err) console.error('Error adding notification:', err);
    });
};

const getUserIdByCustomerId = (customerId) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT user_id FROM customers WHERE customer_id = ?', [customerId], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]?.user_id);
        });
    });
};

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
// LOGIN ROUTE (FIXED)
// ==========================================
app.post('/api/login', (req, res) => {
    const { email, password, role } = req.body;
    
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Role:', role);
    
    if (!email || !password || !role) {
        console.log('Missing login fields');
        return res.status(400).json({ error: 'Email, password, and role are required' });
    }
    
    db.query('SELECT * FROM users WHERE email = ? AND role = ?', [email, role], async (err, results) => {
        if (err) {
            console.error('Login query error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            console.log('User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = results[0];
        
        try {
            const validPassword = await bcrypt.compare(password, user.password);
            
            if (!validPassword) {
                console.log('Invalid password');
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Update last login
            db.query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);
            
            if (role === 'customer') {
                addNotification(user.user_id, 'Welcome Back!', `Welcome back to Smart Ledger! You logged in at ${new Date().toLocaleTimeString()}.`, 'success');
            }
            
            const token = jwt.sign({ userId: user.user_id, role: user.role }, process.env.JWT_SECRET || 'smart_ledger_secret', { expiresIn: '24h' });
            
            let userData = { id: user.user_id, email: user.email, role: user.role, username: user.username };
            
            if (role === 'customer') {
                db.query('SELECT * FROM customers WHERE user_id = ?', [user.user_id], (err, customerData) => {
                    if (err) {
                        console.error('Customer data error:', err);
                        return res.status(500).json({ error: 'Error fetching customer data' });
                    }
                    if (customerData.length > 0) {
                        userData = { ...userData, ...customerData[0] };
                    }
                    console.log('Customer login successful');
                    res.json({ success: true, token, user: userData });
                });
            } else if (role === 'cashier') {
                db.query(`SELECT c.*, s.shop_id, s.shop_name 
                          FROM cashiers c 
                          LEFT JOIN shops s ON c.shop_id = s.shop_id 
                          WHERE c.user_id = ?`, 
                    [user.user_id], 
                    (err, cashierData) => {
                        if (err) {
                            console.error('Cashier data error:', err);
                            return res.status(500).json({ error: 'Error fetching cashier data' });
                        }
                        if (cashierData.length > 0) {
                            userData = { ...userData, ...cashierData[0] };
                        }
                        console.log('Cashier login successful');
                        res.json({ success: true, token, user: userData });
                    });
            } else if (role === 'admin') {
                db.query('SELECT shop_id, shop_name FROM shops WHERE owner_id = ?', [user.user_id], (err, shopData) => {
                    if (err) {
                        console.error('Shop data error:', err);
                        return res.status(500).json({ error: 'Error fetching shop data' });
                    }
                    if (shopData.length > 0) {
                        userData = { ...userData, shop_id: shopData[0].shop_id, shop_name: shopData[0].shop_name };
                    }
                    console.log('Admin login successful');
                    res.json({ success: true, token, user: userData });
                });
            } else {
                res.json({ success: true, token, user: userData });
            }
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
});

// ==========================================
// REGISTER CUSTOMER (COMPLETELY FIXED)
// ==========================================
app.post('/api/register/customer', async (req, res) => {
    const { fullName, email, cellphone, gender, address, employmentStatus, monthlyIncome, password, shopId } = req.body;
    
    console.log('=== CUSTOMER REGISTRATION ===');
    console.log('Full Name:', fullName);
    console.log('Email:', email);
    console.log('Shop ID received:', shopId);
    
    // Validate required fields
    if (!fullName || !email || !cellphone || !gender || !address || !employmentStatus || !monthlyIncome || !password) {
        console.log('Missing required fields');
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
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
        
        // Use default shop ID 1 if shopId is not provided or invalid
        let finalShopId = 1;
        if (shopId) {
            const parsed = parseInt(shopId);
            if (!isNaN(parsed) && parsed > 0) {
                finalShopId = parsed;
            }
        }
        
        console.log('Final shop ID:', finalShopId);
        console.log('Credit limit:', creditLimit);
        
        // Start transaction
        db.beginTransaction((err) => {
            if (err) {
                console.error('Transaction error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Insert user
            db.query('INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
                [email, email, hashedPassword, 'customer', 'active'],
                (err, userResult) => {
                    if (err) {
                        console.error('User insert error:', err);
                        return db.rollback(() => {
                            res.status(500).json({ error: 'Error creating user' });
                        });
                    }
                    
                    const userId = userResult.insertId;
                    console.log('User created with ID:', userId);
                    
                    // Insert customer
                    db.query(`INSERT INTO customers (user_id, full_name, cellphone, gender, address, 
                              employment_status, monthly_income, credit_limit, outstanding_balance, shop_id, status) 
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'active')`,
                        [userId, fullName, cellphone, gender, address, employmentStatus, monthlyIncome, creditLimit, finalShopId],
                        (err) => {
                            if (err) {
                                console.error('Customer insert error:', err);
                                return db.rollback(() => {
                                    res.status(500).json({ error: 'Error creating customer' });
                                });
                            }
                            
                            console.log('Customer created successfully!');
                            
                            // Add welcome notification
                            addNotification(userId, 'Welcome to Smart Ledger!', `Your account has been created successfully. Your credit limit is R${creditLimit}.`, 'success');
                            
                            db.commit((err) => {
                                if (err) {
                                    console.error('Commit error:', err);
                                    return db.rollback(() => {
                                        res.status(500).json({ error: 'Error completing registration' });
                                    });
                                }
                                console.log('Registration completed successfully!');
                                res.json({ success: true, message: 'Registration successful!' });
                            });
                        });
                });
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================================
// REGISTER CASHIER
// ==========================================
app.post('/api/register/cashier', async (req, res) => {
    const { firstName, lastName, email, phone, shopId, position, password } = req.body;
    
    console.log('=== CASHIER REGISTRATION ===');
    console.log('First Name:', firstName);
    console.log('Email:', email);
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const fullName = `${firstName} ${lastName}`;
        
        let finalShopId = 1;
        if (shopId) {
            const parsed = parseInt(shopId);
            if (!isNaN(parsed) && parsed > 0) {
                finalShopId = parsed;
            }
        }
        
        db.beginTransaction((err) => {
            if (err) {
                console.error('Transaction error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            db.query('INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
                [email, email, hashedPassword, 'cashier', 'active'],
                (err, userResult) => {
                    if (err) {
                        console.error('User insert error:', err);
                        return db.rollback(() => {
                            res.status(500).json({ error: 'Error creating user' });
                        });
                    }
                    
                    const userId = userResult.insertId;
                    
                    db.query(`INSERT INTO cashiers (user_id, full_name, email, phone, shop_id, position, status) 
                              VALUES (?, ?, ?, ?, ?, ?, 'active')`,
                        [userId, fullName, email, phone, finalShopId, position],
                        (err) => {
                            if (err) {
                                console.error('Cashier insert error:', err);
                                return db.rollback(() => {
                                    res.status(500).json({ error: 'Error creating cashier' });
                                });
                            }
                            
                            db.commit((err) => {
                                if (err) {
                                    console.error('Commit error:', err);
                                    return db.rollback(() => {
                                        res.status(500).json({ error: 'Error completing registration' });
                                    });
                                }
                                console.log('Cashier registered successfully');
                                res.json({ success: true, message: 'Cashier registered successfully!' });
                            });
                        });
                });
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================================
// REGISTER SHOP OWNER
// ==========================================
app.post('/api/register/admin', async (req, res) => {
    const { fullName, email, phone, shopName, password } = req.body;
    
    console.log('=== ADMIN REGISTRATION ===');
    console.log('Full Name:', fullName);
    console.log('Shop Name:', shopName);
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.beginTransaction((err) => {
            if (err) {
                console.error('Transaction error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            db.query('INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
                [email, email, hashedPassword, 'admin', 'active'],
                (err, userResult) => {
                    if (err) {
                        console.error('User insert error:', err);
                        return db.rollback(() => {
                            res.status(500).json({ error: 'Error creating user' });
                        });
                    }
                    
                    const userId = userResult.insertId;
                    
                    db.query('INSERT INTO shops (shop_name, contact_number, email, owner_id, status) VALUES (?, ?, ?, ?, ?)',
                        [shopName, phone, email, userId, 'active'],
                        (err) => {
                            if (err) {
                                console.error('Shop insert error:', err);
                                return db.rollback(() => {
                                    res.status(500).json({ error: 'Error creating shop' });
                                });
                            }
                            
                            db.commit((err) => {
                                if (err) {
                                    console.error('Commit error:', err);
                                    return db.rollback(() => {
                                        res.status(500).json({ error: 'Error completing registration' });
                                    });
                                }
                                console.log('Admin registered successfully');
                                res.json({ success: true, message: 'Shop owner registered successfully!' });
                            });
                        });
                });
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================================
// OTHER ROUTES (Keep all your existing routes below)
// ==========================================

// SHOP ROUTES
app.get('/api/shops', (req, res) => {
    db.query('SELECT * FROM shops WHERE status = "active"', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// CUSTOMER ROUTES (with shop filtering)
app.get('/api/customers', (req, res) => {
    const shopId = req.headers['shop-id'];
    
    let query = `
        SELECT c.*, u.email, s.shop_name 
        FROM customers c 
        JOIN users u ON c.user_id = u.user_id 
        LEFT JOIN shops s ON c.shop_id = s.shop_id 
        WHERE c.status = 'active'
    `;
    
    const params = [];
    
    if (shopId && shopId !== 'undefined' && shopId !== 'null') {
        query += ' AND c.shop_id = ?';
        params.push(shopId);
    }
    
    query += ' ORDER BY c.full_name';
    
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/customers/:id', (req, res) => {
    const shopId = req.headers['shop-id'];
    
    let query = `
        SELECT c.*, u.email, s.shop_name 
        FROM customers c 
        JOIN users u ON c.user_id = u.user_id 
        LEFT JOIN shops s ON c.shop_id = s.shop_id 
        WHERE c.customer_id = ?
    `;
    
    const params = [req.params.id];
    
    if (shopId && shopId !== 'undefined' && shopId !== 'null') {
        query += ' AND c.shop_id = ?';
        params.push(shopId);
    }
    
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Customer not found' });
        res.json(results[0]);
    });
});

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

// DASHBOARD STATS
app.get('/api/dashboard/stats', (req, res) => {
    const shopId = req.headers['shop-id'];
    
    const totalCustomersQuery = shopId && shopId !== 'undefined' && shopId !== 'null'
        ? 'SELECT COUNT(*) as count FROM customers WHERE status = "active" AND shop_id = ?'
        : 'SELECT COUNT(*) as count FROM customers WHERE status = "active"';
    
    const totalProductsQuery = 'SELECT COUNT(*) as count FROM products WHERE status = "active"';
    
    const totalOutstandingQuery = shopId && shopId !== 'undefined' && shopId !== 'null'
        ? 'SELECT SUM(outstanding_balance) as total FROM customers WHERE shop_id = ?'
        : 'SELECT SUM(outstanding_balance) as total FROM customers';
    
    const todaySalesQuery = 'SELECT SUM(amount) as total FROM transactions WHERE DATE(transaction_date) = CURDATE() AND transaction_type = "purchase"';
    
    const lowStockQuery = 'SELECT COUNT(*) as count FROM products WHERE stock_quantity <= reorder_level';
    
    const params = (shopId && shopId !== 'undefined' && shopId !== 'null') ? [shopId] : [];
    
    Promise.all([
        new Promise((resolve, reject) => {
            db.query(totalCustomersQuery, params, (err, result) => {
                if (err) reject(err);
                else resolve(result[0]);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(totalProductsQuery, (err, result) => {
                if (err) reject(err);
                else resolve(result[0]);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(totalOutstandingQuery, params, (err, result) => {
                if (err) reject(err);
                else resolve(result[0]);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(todaySalesQuery, (err, result) => {
                if (err) reject(err);
                else resolve(result[0]);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(lowStockQuery, (err, result) => {
                if (err) reject(err);
                else resolve(result[0]);
            });
        })
    ]).then(results => {
        const stats = {
            totalCustomers: results[0]?.count || 0,
            totalProducts: results[1]?.count || 0,
            totalOutstanding: results[2]?.total || 0,
            todaySales: results[3]?.total || 0,
            lowStock: results[4]?.count || 0
        };
        res.json(stats);
    }).catch(err => {
        res.status(500).json({ error: err.message });
    });
});

// PAYMENT ROUTE
app.post('/api/transactions/payment', async (req, res) => {
    const { customerId, amount, paymentMethod, cashierId } = req.body;
    
    if (!customerId) {
        return res.status(400).json({ error: 'Customer ID is required' });
    }
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
    }
    
    db.query('SELECT customer_id, outstanding_balance, user_id FROM customers WHERE customer_id = ?', [customerId], async (err, customerResult) => {
        if (err) return res.status(500).json({ error: err.message });
        if (customerResult.length === 0) return res.status(404).json({ error: 'Customer not found' });
        
        const currentBalance = customerResult[0].outstanding_balance;
        
        if (amount > currentBalance) {
            return res.status(400).json({ error: 'Payment amount exceeds outstanding balance' });
        }
        
        const userId = customerResult[0].user_id;
        const referenceNumber = 'PAY' + Date.now();
        
        db.beginTransaction((err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            db.query(`INSERT INTO transactions (customer_id, cashier_id, transaction_type, amount, 
                      payment_method, reference_number, status, transaction_date) 
                      VALUES (?, ?, 'payment', ?, ?, ?, 'completed', NOW())`,
                [customerId, cashierId || null, amount, paymentMethod, referenceNumber],
                (err, transResult) => {
                    if (err) {
                        return db.rollback(() => res.status(500).json({ error: err.message }));
                    }
                    
                    db.query('UPDATE customers SET outstanding_balance = outstanding_balance - ? WHERE customer_id = ?',
                        [amount, customerId],
                        (err) => {
                            if (err) {
                                return db.rollback(() => res.status(500).json({ error: err.message }));
                            }
                            
                            db.query('SELECT outstanding_balance FROM customers WHERE customer_id = ?', [customerId], (err, balanceResult) => {
                                const newBalance = balanceResult[0]?.outstanding_balance || 0;
                                
                                db.query(`INSERT INTO notifications (user_id, title, message, type, is_read, created_at) 
                                          VALUES (?, 'Payment Successful!', ?, 'payment', FALSE, NOW())`,
                                    [userId, `Your payment of R${amount} has been processed successfully. New balance: R${newBalance}. Reference: ${referenceNumber}`],
                                    (err) => { if (err) console.error('Notification error:', err); });
                                
                                db.commit((err) => {
                                    if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                                    res.json({ success: true, transactionId: transResult.insertId, referenceNumber, newBalance });
                                });
                            });
                        });
                });
        });
    });
});

// SALE ROUTE
app.post('/api/transactions/sale', async (req, res) => {
    const { customerId, cashierId, items, total, paymentMethod } = req.body;
    
    db.beginTransaction(async (err) => {
        if (err) throw err;
        
        const referenceNumber = 'TXN' + Date.now();
        
        db.query(`INSERT INTO transactions (customer_id, cashier_id, transaction_type, amount, 
                  payment_method, reference_number, status, transaction_date) 
                  VALUES (?, ?, 'purchase', ?, ?, ?, 'completed', NOW())`,
            [customerId || null, cashierId, total, paymentMethod, referenceNumber],
            (err, transResult) => {
                if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                
                const transactionId = transResult.insertId;
                let itemsProcessed = 0;
                
                items.forEach(item => {
                    db.query(`INSERT INTO transaction_items (transaction_id, product_id, quantity, 
                              unit_price, total_price) VALUES (?, ?, ?, ?, ?)`,
                        [transactionId, item.id, item.quantity, item.price, item.price * item.quantity],
                        (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                            
                            db.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
                                [item.quantity, item.id],
                                (err) => {
                                    if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                                    
                                    itemsProcessed++;
                                    if (itemsProcessed === items.length) {
                                        if (paymentMethod === 'credit' && customerId) {
                                            db.query('UPDATE customers SET outstanding_balance = outstanding_balance + ? WHERE customer_id = ?',
                                                [total, customerId],
                                                async (err) => {
                                                    if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                                                    
                                                    const userId = await getUserIdByCustomerId(customerId);
                                                    addNotification(userId, 'Purchase Made!', `Your purchase of R${total} has been added to your account. Reference: ${referenceNumber}`, 'purchase');
                                                    
                                                    db.commit((err) => {
                                                        if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                                                        res.json({ success: true, transactionId, referenceNumber });
                                                    });
                                                });
                                        } else {
                                            db.commit((err) => {
                                                if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
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

// PRODUCT ROUTES
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products WHERE status = "active" ORDER BY product_name', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

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

app.delete('/api/products/:id', (req, res) => {
    db.query('DELETE FROM products WHERE product_id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.patch('/api/products/:id/stock', (req, res) => {
    const { stock_quantity } = req.body;
    db.query('UPDATE products SET stock_quantity = ? WHERE product_id = ?', [stock_quantity, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// NOTIFICATION ROUTES
app.get('/api/notifications/:userId', (req, res) => {
    db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', 
        [req.params.userId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
});

app.put('/api/notifications/:id/read', (req, res) => {
    db.query('UPDATE notifications SET is_read = TRUE WHERE notification_id = ?', 
        [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

app.put('/api/notifications/user/:userId/read-all', (req, res) => {
    db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', 
        [req.params.userId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

app.delete('/api/notifications/:id', (req, res) => {
    db.query('DELETE FROM notifications WHERE notification_id = ?', 
        [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// TRANSACTION ROUTES
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

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});