function CouponInput({ onApply }) {
  const [couponCode, setCouponCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setLoading(true);
    setMessage('');

    try {
      const coupons = await trickleListObjects('coupons', 100, true);
      const coupon = coupons.items.find(c => 
        c.objectData.code === couponCode && 
        c.objectData.isActive &&
        c.objectData.usageCount < c.objectData.usageLimit
      );

      if (coupon) {
        const expiryDate = new Date(coupon.objectData.expiryDate);
        if (expiryDate > new Date()) {
          await trickleUpdateObject('coupons', coupon.objectId, {
            ...coupon.objectData,
            usageCount: coupon.objectData.usageCount + 1
          });
          
          setMessage(`הנחה של ${coupon.objectData.discount}% הוחלה בהצלחה!`);
          onApply(coupon.objectData.discount);
        } else {
          setMessage('הקופון פג תוקף');
        }
      } else {
        setMessage('קוד קופון לא תקין');
      }
    } catch (error) {
      setMessage('שגיאה בבדיקת הקופון');
    } finally {
      setLoading(false);
    }
  };

  try {
    return (
      <div data-name="coupon-input" data-file="components/CouponInput.js">
        <div className="flex space-x-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="הכנס קוד קופון"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-red-600"
          />
          <button
            onClick={applyCoupon}
            disabled={loading || !couponCode.trim()}
            className="btn-secondary disabled:opacity-50"
          >
            {loading ? 'בודק...' : 'החל'}
          </button>
        </div>
        {message && (
          <div className={`mt-2 text-sm ${message.includes('בהצלחה') ? 'text-green-500' : 'text-red-500'}`}>
            {message}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('CouponInput component error:', error);
    return null;
  }
}