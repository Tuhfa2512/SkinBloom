import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [paymentOptions, setPaymentOptions] = useState(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState('full');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    acceptMarketing: false
  });

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (cart && cart.totalAmount) {
      fetchPaymentOptions();
    }
  }, [cart]);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('Fetching cart data...');
      const response = await axios.get('http://localhost:5000/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Cart response:', response.data);
      
      if (!response.data.items || response.data.items.length === 0) {
        console.log('Cart is empty, redirecting to cart page');
        navigate('/cart');
        return;
      }
      
      setCart(response.data);
      console.log('Cart loaded successfully:', response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (error.response?.status === 401) {
        console.log('Unauthorized, redirecting to login');
        navigate('/login');
      } else {
        setError('Failed to load cart');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentOptions = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/payment/options?amount=${cart.totalAmount}`);
      setPaymentOptions(response.data);
    } catch (error) {
      console.error('Error fetching payment options:', error.message || error);
    }
  };

  const handleCheckout = async () => {
    try {
      setProcessing(true);
      setError(null);

      const token = localStorage.getItem('token');
      const cartItems = cart.items.map(item => ({
        productId: (item.productId && item.productId._id) || (item.product && item.product._id),
        quantity: item.quantity
      })).filter(ci => ci.productId); // filter out any malformed entries

      if (!cartItems.length) {
        setError('No valid cart items to checkout');
        setProcessing(false);
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/payment/checkout',
        {
          cartItems,
          paymentType: selectedPaymentType,
          customerInfo
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.url) {
        console.log('Redirecting to Stripe URL:', response.data.url)
        window.location.href = response.data.url;
      } else {
        console.warn('Checkout response missing URL:', response.data)
        setError('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error full:', error)
      console.error('Checkout error response:', error.response?.data)
      setError(error.response?.data?.error || error.message || 'Failed to process checkout');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading checkout...</div>
      </div>
    );
  }

  if (error && !cart) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>❌</div>
        <h2 style={{ fontSize: '24px', marginBottom: '12px', color: '#e53e3e' }}>
          Checkout Error
        </h2>
        <p style={{ fontSize: '16px', color: '#718096', marginBottom: '30px' }}>
          {error}
        </p>
        <button
          onClick={() => navigate('/cart')}
          style={{
            padding: '12px 24px',
            background: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Back to Cart
        </button>
      </div>
    );
  }

  const getSelectedPaymentDetails = () => {
    if (!paymentOptions) {
      return null;
    }
    
    switch (selectedPaymentType) {
      case 'cash_discount':
        return paymentOptions.cash_discount;
      case 'emi':
        return paymentOptions.emi_options;
      default:
        return paymentOptions.full_payment;
    }
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '30px', color: '#2d3748' }}>
        Checkout
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }}>
        {/* Main Checkout Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Contact Information */}
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#2d3748' }}>
              Contact Information
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <input
                type="email"
                placeholder="Email address"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#4a5568' }}>
              <input
                type="checkbox"
                checked={customerInfo.acceptMarketing}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, acceptMarketing: e.target.checked }))}
              />
              Email me with news and offers
            </label>
          </div>

          {/* Payment Options */}
          {paymentOptions && (
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#2d3748' }}>
                Payment Options
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Full Payment */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  border: selectedPaymentType === 'full' ? '2px solid #3182ce' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedPaymentType === 'full' ? '#f0f8ff' : 'white'
                }}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="full"
                    checked={selectedPaymentType === 'full'}
                    onChange={(e) => setSelectedPaymentType(e.target.value)}
                    style={{ marginTop: '2px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                      Pay Full Amount
                    </div>
                    <div style={{ fontSize: '14px', color: '#4a5568', marginBottom: '4px' }}>
                      {paymentOptions.full_payment.description}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#2d3748' }}>
                      ${paymentOptions.full_payment.amount.toFixed(2)}
                    </div>
                  </div>
                </label>

                {/* Cash Discount */}
                {paymentOptions.cash_discount.available && (
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    border: selectedPaymentType === 'cash_discount' ? '2px solid #3182ce' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedPaymentType === 'cash_discount' ? '#f0f8ff' : 'white',
                    position: 'relative'
                  }}>
                    <input
                      type="radio"
                      name="paymentType"
                      value="cash_discount"
                      checked={selectedPaymentType === 'cash_discount'}
                      onChange={(e) => setSelectedPaymentType(e.target.value)}
                      style={{ marginTop: '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                        Cash Payment Discount
                        <span style={{
                          background: '#38a169',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          marginLeft: '8px'
                        }}>
                          SAVE ${paymentOptions.cash_discount.savings.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#4a5568', marginBottom: '4px' }}>
                        {paymentOptions.cash_discount.description}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', color: '#718096', textDecoration: 'line-through' }}>
                          ${paymentOptions.full_payment.amount.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#38a169' }}>
                          ${paymentOptions.cash_discount.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </label>
                )}

                {/* EMI Options */}
                {paymentOptions.emi_options.available && (
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    border: selectedPaymentType === 'emi' ? '2px solid #3182ce' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedPaymentType === 'emi' ? '#f0f8ff' : 'white'
                  }}>
                    <input
                      type="radio"
                      name="paymentType"
                      value="emi"
                      checked={selectedPaymentType === 'emi'}
                      onChange={(e) => setSelectedPaymentType(e.target.value)}
                      style={{ marginTop: '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>
                        EMI Options
                        <span style={{
                          background: '#805ad5',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          marginLeft: '8px'
                        }}>
                          Flexible
                        </span>
                      </div>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {paymentOptions.emi_options.plans.map((plan, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: '#f7fafc',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}>
                            <span>
                              {plan.months} months ({plan.interest_rate} interest)
                            </span>
                            <span style={{ fontWeight: '600' }}>
                              ${plan.monthly_amount}/month
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}

          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#fed7d7',
              border: '1px solid #feb2b2',
              borderRadius: '8px',
              color: '#c53030',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          height: 'fit-content',
          position: 'sticky',
          top: '20px'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#2d3748' }}>
            Order Summary
          </h3>

          {/* Cart Items */}
          <div style={{ marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
            {cart?.items.map(item => (
              <div key={item.productId?._id || item.product?._id} style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: `url(${item.productId?.image || item.product?.image}) center/cover`,
                  backgroundColor: '#f7fafc',
                  borderRadius: '8px'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    {item.productId?.name || item.product?.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>
                    {item.productId?.brand || item.product?.brand}
                  </div>
                  <div style={{ fontSize: '14px', color: '#4a5568' }}>
                    Qty: {item.quantity} × ${((item.price ?? item.productId?.price ?? item.product?.price) || 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                  ${(((item.price ?? item.productId?.price ?? item.product?.price) || 0) * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span>Subtotal:</span>
              <span>${cart?.totalAmount.toFixed(2)}</span>
            </div>
            
            {selectedPaymentType === 'cash_discount' && paymentOptions?.cash_discount.available && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#38a169' }}>
                <span>Cash Discount (5%):</span>
                <span>-${paymentOptions.cash_discount.savings.toFixed(2)}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span>Shipping:</span>
              <span>Free</span>
            </div>
            
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700' }}>
                <span>Total:</span>
                <span>
                  {selectedPaymentType === 'cash_discount' && paymentOptions?.cash_discount.available
                    ? `$${paymentOptions.cash_discount.amount.toFixed(2)}`
                    : `$${cart?.totalAmount.toFixed(2)}`
                  }
                </span>
              </div>
              
              {selectedPaymentType === 'emi' && paymentOptions?.emi_options.available && (
                <div style={{ fontSize: '12px', color: '#718096', textAlign: 'right', marginTop: '4px' }}>
                  Starting from ${paymentOptions.emi_options.plans[0]?.monthly_amount}/month
                </div>
              )}
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={processing || !customerInfo.email}
            style={{
              width: '100%',
              padding: '16px',
              background: processing || !customerInfo.email ? '#a0aec0' : '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: processing || !customerInfo.email ? 'not-allowed' : 'pointer',
              marginBottom: '16px'
            }}
          >
            {processing ? 'Processing...' : 'Complete Order'}
          </button>

          {/* Security Badges */}
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#718096' }}>
            🔒 Secure 256-bit SSL encryption<br />
            💳 All major cards accepted<br />
            🛡️ 100% secure checkout
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
