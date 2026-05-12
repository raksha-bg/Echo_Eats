const Razorpay = require('razorpay');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'INR', receipt } = req.body;
    
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_SdTWYyzys8e6Zq';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'SsjpBTteSJl17Va53IFlk2sC';

    const razorpay = new Razorpay({
      key_id: key_id,
      key_secret: key_secret,
    });

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      razorpayOrderId: order.id,
      orderId: receipt
    });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
