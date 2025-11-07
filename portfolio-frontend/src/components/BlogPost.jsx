import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Heart, DollarSign, Users, Target, TrendingUp, ArrowLeft, ExternalLink } from 'lucide-react';
useEffect(() => {
  if (!import.meta.env.PAYPAL_CLIENT_ID && post?.isDonationDrive) {
    console.error('⚠️ PAYPAL_CLIENT_ID is not configured in .env file');
  }
}, [post]);
const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [donationStats, setDonationStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState('');
  const [donorInfo, setDonorInfo] = useState({
    name: '',
    email: '',
    message: '',
    isAnonymous: false,
    notifyOnUpdates: true
  });
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [donationStatus, setDonationStatus] = useState('');

  useEffect(() => {
    fetchPost();
  }, [slug]);

  useEffect(() => {
    // Load PayPal SDK
    if (post && post.isDonationDrive && post.paypalEmail) {
      loadPayPalScript();
    }
  }, [post]);

  useEffect(() => {
    // Render PayPal button when amount and PayPal SDK are ready
    if (paypalLoaded && donationAmount && parseFloat(donationAmount) >= 1 && post) {
      renderPayPalButton();
    }
  }, [paypalLoaded, donationAmount, donorInfo]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`https://ksevillejov2.onrender.com/api/blog/posts/${slug}`);
      const data = await response.json();
      
      if (data.success) {
        setPost(data.post);
        setDonationStats(data.donationStats);
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPayPalScript = () => {
    // Check if PayPal script is already loaded
    if (window.paypal) {
      setPaypalLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.PAYPAL_CLIENT_ID || 'YOUR_CLIENT_ID'}&currency=${post.donationCurrency}`;
    script.async = true;
    script.onload = () => setPaypalLoaded(true);
    script.onerror = () => {
      console.error('Failed to load PayPal SDK');
      setDonationStatus('error');
    };
    document.body.appendChild(script);
  };

  const renderPayPalButton = () => {
    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    // Clear any existing buttons
    container.innerHTML = '';

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal'
      },
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: donationAmount,
              currency_code: post.donationCurrency
            },
            description: `Donation to ${post.title}`
          }]
        });
      },
      onApprove: async (data, actions) => {
        try {
          const details = await actions.order.capture();
          await handleDonationSuccess(details);
        } catch (error) {
          console.error('Error capturing order:', error);
          setDonationStatus('error');
        }
      },
      onError: (err) => {
        console.error('PayPal error:', err);
        setDonationStatus('error');
      }
    }).render('#paypal-button-container');
  };

  const handleDonationSuccess = async (paypalDetails) => {
    try {
      setDonationStatus('processing');

      const donationData = {
        blogPostSlug: slug,
        donorName: donorInfo.isAnonymous ? 'Anonymous' : donorInfo.name || 'Anonymous',
        donorEmail: donorInfo.email,
        amount: parseFloat(donationAmount),
        message: donorInfo.message,
        isAnonymous: donorInfo.isAnonymous,
        notifyOnUpdates: donorInfo.notifyOnUpdates,
        paypalOrderId: paypalDetails.id,
        paypalTransactionId: paypalDetails.purchase_units[0].payments.captures[0].id
      };

      const response = await fetch('https://ksevillejov2.onrender.com/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(donationData)
      });

      const result = await response.json();

      if (result.success) {
        setDonationStatus('success');
        // Reset form
        setDonationAmount('');
        setDonorInfo({
          name: '',
          email: '',
          message: '',
          isAnonymous: false,
          notifyOnUpdates: true
        });
        // Refresh donation stats
        await fetchPost();
      } else {
        setDonationStatus('error');
      }
    } catch (error) {
      console.error('Error recording donation:', error);
      setDonationStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-stone-900 mb-4">Post Not Found</h1>
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold"
          >
            <ArrowLeft size={20} />
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/blog')}
            className="flex items-center gap-2 text-stone-700 hover:text-amber-600 font-semibold transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Blog
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent"
          >
            Kent Sevillejo
          </button>
        </div>
      </nav>

      <div className="py-12 px-4">
        <article className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500 mb-4">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span className="px-3 py-1 bg-stone-200 rounded-full capitalize">
                {post.category}
              </span>
              {post.isDonationDrive && (
                <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full flex items-center gap-1 font-semibold">
                  <Heart size={14} />
                  Donation Drive
                </span>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{post.title}</h1>
            <p className="text-xl text-stone-600 leading-relaxed">{post.excerpt}</p>
          </header>

          {/* Donation Stats (if donation drive) */}
          {post.isDonationDrive && donationStats && (
            <div className="bg-white rounded-3xl p-8 mb-8 shadow-xl border-2 border-amber-100">
              <h2 className="text-2xl font-bold mb-6 text-center">Campaign Progress</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {post.donationCurrency} {donationStats.totalDonations.toLocaleString()}
                  </div>
                  <div className="text-xs text-stone-600 mt-1">Raised</div>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {post.donationCurrency} {donationStats.totalExpenses.toLocaleString()}
                  </div>
                  <div className="text-xs text-stone-600 mt-1">Distributed</div>
                </div>

                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-amber-600">
                    {post.donationCurrency} {donationStats.remainingBalance.toLocaleString()}
                  </div>
                  <div className="text-xs text-stone-600 mt-1">Remaining</div>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {donationStats.donorCount}
                  </div>
                  <div className="text-xs text-stone-600 mt-1">Donors</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-stone-600 mb-2">
                  <span className="font-semibold">Progress to Goal</span>
                  <span className="font-bold text-amber-600">{donationStats.percentComplete}%</span>
                </div>
                <div className="w-full h-4 bg-stone-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-600 to-orange-500 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, donationStats.percentComplete)}%` }}
                  ></div>
                </div>
                <div className="text-right text-sm text-stone-500 mt-1">
                  Goal: {post.donationCurrency} {post.donationGoal.toLocaleString()}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => document.getElementById('donation-form').scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all"
                >
                  <Heart size={20} />
                  Donate Now
                </button>
                <button
                  onClick={() => navigate(`/transparency/${post.slug}`)}
                  className="flex items-center justify-center gap-2 bg-white border-2 border-stone-900 text-stone-900 py-4 rounded-xl font-semibold hover:bg-stone-900 hover:text-white transition-all"
                >
                  <ExternalLink size={20} />
                  View Transparency
                </button>
              </div>
            </div>
          )}

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mb-8 rounded-3xl overflow-hidden shadow-xl">
              <img 
                src={post.featuredImage} 
                alt={post.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Content */}
          <div 
            className="prose prose-lg max-w-none mb-12 bg-white rounded-3xl p-8 md:p-12 shadow-xl prose-headings:font-bold prose-headings:text-stone-900 prose-p:text-stone-700 prose-p:leading-relaxed prose-a:text-amber-600 prose-a:no-underline hover:prose-a:text-amber-700 prose-strong:text-stone-900 prose-img:rounded-xl prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Donation Form (if donation drive) */}
          {post.isDonationDrive && (
            <div id="donation-form" className="bg-gradient-to-br from-white to-amber-50 rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-amber-100">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  Support This Cause
                </h2>
                <p className="text-stone-600 max-w-2xl mx-auto">
                  Your contribution makes a real difference. Every donation helps us reach those in need.
                </p>
              </div>
              
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Quick amounts */}
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-3">
                    Select Amount or Enter Custom
                  </label>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[100, 500, 1000, 2500, 5000, 10000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setDonationAmount(amount.toString())}
                        className={`py-3 rounded-xl font-semibold transition-all ${
                          donationAmount === amount.toString()
                            ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg scale-105'
                            : 'bg-white text-stone-700 hover:bg-stone-50 border-2 border-stone-200'
                        }`}
                      >
                        {post.donationCurrency} {amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    placeholder="Enter custom amount"
                    min="1"
                    className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-lg"
                  />
                </div>

                {/* Donor Info */}
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">
                    Your Name {!donorInfo.isAnonymous && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={donorInfo.name}
                    onChange={(e) => setDonorInfo({ ...donorInfo, name: e.target.value })}
                    disabled={donorInfo.isAnonymous}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors disabled:bg-stone-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">
                    Your Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={donorInfo.email}
                    onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">
                    Message <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={donorInfo.message}
                    onChange={(e) => setDonorInfo({ ...donorInfo, message: e.target.value })}
                    rows="3"
                    placeholder="Leave a message of support..."
                    className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 bg-white rounded-xl p-4 border-2 border-stone-200">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={donorInfo.isAnonymous}
                      onChange={(e) => setDonorInfo({ ...donorInfo, isAnonymous: e.target.checked })}
                      className="mt-1 w-5 h-5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-sm text-stone-700 group-hover:text-stone-900">
                      <strong>Donate Anonymously</strong>
                      <br />
                      <span className="text-stone-500">Your name will not be displayed publicly</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={donorInfo.notifyOnUpdates}
                      onChange={(e) => setDonorInfo({ ...donorInfo, notifyOnUpdates: e.target.checked })}
                      className="mt-1 w-5 h-5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-sm text-stone-700 group-hover:text-stone-900">
                      <strong>Notify me of updates</strong>
                      <br />
                      <span className="text-stone-500">Receive email notifications when we post transparency reports</span>
                    </span>
                  </label>
                </div>

                {/* PayPal Button */}
                {donationAmount && parseFloat(donationAmount) >= 1 && donorInfo.email ? (
                  <div className="bg-white border-2 border-amber-200 rounded-xl p-6">
                    <p className="text-sm text-stone-600 mb-4 text-center">
                      <strong>Complete your donation securely with PayPal</strong>
                      <br />
                      <span className="text-xs text-stone-500">You'll be redirected to PayPal to complete the payment</span>
                    </p>
                    <div id="paypal-button-container" className="max-w-sm mx-auto"></div>
                    {!paypalLoaded && (
                      <div className="text-center">
                        <div className="inline-block w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-stone-500 mt-2">Loading PayPal...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
                    <p className="text-sm text-amber-900">
                      {!donationAmount || parseFloat(donationAmount) < 1
                        ? '💡 Enter a donation amount of at least 1 to continue'
                        : '💡 Enter your email address to continue'
                      }
                    </p>
                  </div>
                )}

                {/* Status Messages */}
                {donationStatus === 'processing' && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                    <div className="inline-block w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-blue-800 font-semibold">Processing your donation...</p>
                  </div>
                )}

                {donationStatus === 'success' && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-green-800 font-bold text-lg mb-2">Thank You! 🎉</p>
                    <p className="text-green-700">Your donation has been received. You'll receive an email confirmation shortly.</p>
                  </div>
                )}

                {donationStatus === 'error' && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-red-800 font-bold text-lg mb-2">Something went wrong</p>
                    <p className="text-red-700">Please try again or contact support if the problem persists.</p>
                  </div>
                )}

                <p className="text-xs text-stone-500 text-center">
                  🔒 Secure payment powered by PayPal. Your information is encrypted and protected.
                </p>
              </div>
            </div>
          )}
        </article>
      </div>

      {/* Footer */}
      <footer className="bg-stone-900 text-white py-8 px-4 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-stone-400">
            © 2025 Kent Sevillejo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BlogPost;