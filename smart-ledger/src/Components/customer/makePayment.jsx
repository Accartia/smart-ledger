import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, DollarSign, Lock, CheckCircle, Wallet, Banknote, Receipt } from 'lucide-react';

export default function MakePayment() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Helper functions
  const formatCurrency = (value) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const parseNumeric = (value) => {
    if (value === null || value === undefined) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      console.log('Fetching customer data for ID:', currentUser.customer_id);
      const response = await fetch(`http://localhost:5000/api/customers/${currentUser.customer_id}`);
      if (!response.ok) throw new Error('Failed to fetch customer data');
      const data = await response.json();
      
      setCustomer({
        ...data,
        outstanding_balance: parseNumeric(data.outstanding_balance),
        credit_limit: parseNumeric(data.credit_limit)
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customer:', error);
      setError('Failed to load customer data');
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(amount);
    
    console.log('=== PAYMENT DEBUG ===');
    console.log('Amount:', paymentAmount);
    console.log('Payment Method:', paymentMethod);
    console.log('Customer ID:', currentUser.customer_id);
    console.log('Current Balance:', customer?.outstanding_balance);
    
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (paymentAmount > (customer?.outstanding_balance || 0)) {
      alert(`Payment amount cannot exceed your outstanding balance of R${formatCurrency(customer?.outstanding_balance || 0)}`);
      return;
    }
    
    if (paymentMethod === 'card') {
      const cleanCardNumber = cardNumber.replace(/\s/g, '');
      if (!cleanCardNumber || cleanCardNumber.length < 16) {
        alert('Please enter a valid 16-digit card number');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        alert('Please enter valid expiry date (MM/YY)');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        alert('Please enter valid CVV');
        return;
      }
    }
    
    setIsProcessing(true);
    
    try {
      const requestBody = {
        customerId: currentUser.customer_id,
        amount: paymentAmount,
        paymentMethod: paymentMethod,
        cashierId: null
      };
      
      console.log('Sending payment request:', requestBody);
      
      const response = await fetch('http://localhost:5000/api/transactions/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.success) {
        setReceiptData({
          transactionId: data.referenceNumber,
          amount: paymentAmount,
          paymentMethod: paymentMethod,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          customerName: customer.full_name,
          previousBalance: customer.outstanding_balance,
          newBalance: data.newBalance,
          status: 'Completed'
        });
        setShowReceipt(true);
        
        // Refresh customer data in parent dashboard
        if (window.refreshCustomerData) {
          setTimeout(() => {
            window.refreshCustomerData();
          }, 500);
        }
      } else {
        alert(data.error || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Connection error: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '');
    }
    return v;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-gray-800 font-semibold">{error || 'Unable to load payment data'}</p>
          <button onClick={() => navigate('/customer/dashboard')} className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (showReceipt && receiptData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white text-center rounded-t-xl">
            <Receipt className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-2xl font-bold">Payment Receipt</h2>
            <p className="text-white/80 text-sm">Transaction Confirmation</p>
          </div>
          
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Payment Successful!</h3>
              <p className="text-sm text-gray-500">Your payment has been processed</p>
            </div>

            <div className="border-t border-b py-4 space-y-3">
              <div className="flex justify-between"><span className="text-gray-600">Transaction ID:</span><span className="font-semibold text-gray-800">{receiptData.transactionId}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Date:</span><span className="text-gray-800">{receiptData.date}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Time:</span><span className="text-gray-800">{receiptData.time}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Payment Method:</span><span className="capitalize font-semibold text-purple-600">{receiptData.paymentMethod}</span></div>
              <div className="flex justify-between pt-2 border-t"><span className="text-gray-600">Amount Paid:</span><span className="text-green-600 font-bold">-R{formatCurrency(receiptData.amount)}</span></div>
              <div className="flex justify-between pt-2 border-t"><span className="text-gray-700 font-semibold">New Balance:</span><span className="text-blue-600 font-bold text-lg">R{formatCurrency(receiptData.newBalance)}</span></div>
            </div>

            <button onClick={() => navigate('/customer/dashboard')} className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:opacity-90">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const balance = customer.outstanding_balance;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="flex items-center gap-4 px-8 py-4">
          <button onClick={() => navigate('/customer/dashboard')} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold">Make Payment</h1>
            <p className="text-white/90 text-sm mt-1">Pay your outstanding balance</p>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-2xl mx-auto">
        {/* Balance Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-full">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-600">R{formatCurrency(balance)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-white" />
              <h2 className="text-xl font-bold text-white">Payment Details</h2>
            </div>
          </div>
          
          <form onSubmit={handlePayment} className="p-6">
            {/* Payment Method Selection */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-3">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button" 
                  onClick={() => setPaymentMethod('card')} 
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-md' 
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5" /> Credit Card
                </button>
                <button 
                  type="button" 
                  onClick={() => setPaymentMethod('cash')} 
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    paymentMethod === 'cash' 
                      ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-md' 
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Banknote className="w-5 h-5" /> Cash
                </button>
              </div>
            </div>

            {/* Card Details */}
            {paymentMethod === 'card' && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600" /> Card Information
                </h3>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Card Number" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500" 
                    value={cardNumber} 
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} 
                    maxLength="19" 
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500" 
                      value={cardExpiry} 
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))} 
                      maxLength="5" 
                    />
                    <input 
                      type="password" 
                      placeholder="CVV" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500" 
                      value={cardCvv} 
                      onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))} 
                      maxLength="4" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cash Instructions */}
            {paymentMethod === 'cash' && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Banknote className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-1">Cash Payment Instructions</h3>
                    <p className="text-sm text-blue-700">
                      Please visit any of our store locations to make your cash payment. 
                      Bring your customer ID: <strong>#{currentUser.customer_id}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">Amount (R)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="number" 
                  step="0.01" 
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800 text-lg" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="0.00" 
                  required 
                />
              </div>
            </div>

            {/* Suggested Amounts */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Suggested amounts:</p>
              <div className="flex flex-wrap gap-3">
                {[100, 250, 500, 1000, balance].map((suggested) => (
                  suggested > 0 && suggested <= balance && (
                    <button 
                      key={suggested} 
                      type="button" 
                      onClick={() => setAmount(suggested.toString())} 
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                    >
                      R{suggested}
                    </button>
                  )
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Payment Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Amount:</span>
                  <span className="font-semibold text-gray-800">R{amount ? parseFloat(amount).toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold text-gray-800 capitalize">{paymentMethod === 'card' ? 'Credit Card' : 'Cash'}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-600">New Balance After Payment:</span>
                  <span className="font-semibold text-green-600">
                    R{amount ? (balance - parseFloat(amount)).toFixed(2) : formatCurrency(balance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-center gap-2 mb-6 text-xs text-gray-500">
              <Lock className="w-3 h-3" />
              <span>Your payment information is secure and encrypted</span>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isProcessing || !amount || parseFloat(amount) <= 0} 
              className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                isProcessing || !amount || parseFloat(amount) <= 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing Payment...
                </>
              ) : (
                <>
                  {paymentMethod === 'card' ? <CreditCard className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                  Process Payment
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}