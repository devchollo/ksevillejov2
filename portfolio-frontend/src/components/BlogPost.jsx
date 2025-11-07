import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Heart, DollarSign, Users, Target, TrendingUp } from 'lucide-react';

const BlogPost = () => {
  const { slug } = useParams();
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

  useEffect(() => {
    fetchPost();
  }, [slug]);

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

  const handleDonate = async () => {
    // PayPal integration will go here
    // This is a placeholder for the PayPal button integration
    console.log('Initiating donation...', { donationAmount, donorInfo });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-stone-900 mb-4">Post Not Found</h1>
          <a href="/blog" className="text-amber-600 hover:text-amber-700">← Back to Blog</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-20 px-4">
      <article className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 text-sm text-stone-500 mb-4">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(post.publishedAt).toLocaleDateString()}
            </span>
            <span className="px-3 py-1 bg-stone-200 rounded-full">
              {post.category}
            </span>
            {post.isDonationDrive && (
              <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full flex items-center gap-1">
                <Heart size={14} />
                Donation Drive
              </span>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
          <p className="text-xl text-stone-600">{post.excerpt}</p>
        </header>

        {/* Donation Stats (if donation drive) */}
        {post.isDonationDrive && donationStats && (
          <div className="bg-white rounded-3xl p-8 mb-8 shadow-lg">
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600">
                  ₱{donationStats.totalDonations.toLocaleString()}
                </div>
                <div className="text-sm text-stone-600">Total Raised</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600">
                  ₱{donationStats.totalExpenses.toLocaleString()}
                </div>
                <div className="text-sm text-stone-600">Distributed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600">
                  ₱{donationStats.remainingBalance.toLocaleString()}
                </div>
                <div className="text-sm text-stone-600">Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600">
                  {donationStats.donorCount}
                </div>
                <div className="text-sm text-stone-600">Donors</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-stone-600 mb-2">
                <span>Progress to Goal</span>
                <span>{donationStats.percentComplete}%</span>
              </div>
              <div className="w-full h-4 bg-stone-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 to-orange-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, donationStats.percentComplete)}%` }}
                ></div>
              </div>
              <div className="text-right text-sm text-stone-500 mt-1">
                Goal: ₱{post.donationGoal.toLocaleString()}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => document.getElementById('donation-form').scrollIntoView({ behavior: 'smooth' })}
                className="flex-1 bg-gradient-to-r from-amber-600 to-orange-500 text-white py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all"
              >
                Donate Now
              </button>
              <a
                href={`/transparency/${post.slug}`}
                className="flex-1 bg-white border-2 border-stone-900 text-stone-900 py-4 rounded-xl font-semibold hover:bg-stone-900 hover:text-white transition-all text-center"
              >
                View Transparency
              </a>
            </div>
          </div>
        )}

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8 rounded-3xl overflow-hidden">
            <img 
              src={post.featuredImage} 
              alt={post.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none mb-12 bg-white rounded-3xl p-8 shadow-lg"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Donation Form (if donation drive) */}
        {post.isDonationDrive && (
          <div id="donation-form" className="bg-white rounded-3xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold mb-6 text-center">
              Support This Cause
            </h2>
            
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
                          ? 'bg-amber-600 text-white shadow-lg'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      ₱{amount.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="Enter custom amount"
                  className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Donor Info */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Your Name {!donorInfo.isAnonymous && '*'}
                </label>
                <input
                  type="text"
                  value={donorInfo.name}
                  onChange={(e) => setDonorInfo({ ...donorInfo, name: e.target.value })}
                  disabled={donorInfo.isAnonymous}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Your Email *
                </label>
                <input
                  type="email"
                  required
                  value={donorInfo.email}
                  onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={donorInfo.message}
                  onChange={(e) => setDonorInfo({ ...donorInfo, message: e.target.value })}
                  rows="3"
                  placeholder="Leave a message of support..."
                  className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={donorInfo.isAnonymous}
                    onChange={(e) => setDonorInfo({ ...donorInfo, isAnonymous: e.target.checked })}
                    className="mt-1 w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-stone-700">
                    <strong>Donate Anonymously</strong>
                    <br />
                    Your name will not be displayed publicly
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={donorInfo.notifyOnUpdates}
                    onChange={(e) => setDonorInfo({ ...donorInfo, notifyOnUpdates: e.target.checked })}
                    className="mt-1 w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-stone-700">
                    <strong>Notify me of updates</strong>
                    <br />
                    Receive email notifications when we post transparency reports
                  </span>
                </label>
              </div>

              {/* PayPal Button Placeholder */}
              <div className="bg-stone-50 border-2 border-dashed border-stone-300 rounded-xl p-8 text-center">
                <p className="text-stone-600 mb-4">
                  Click the button below to complete your donation via PayPal
                </p>
                {/* PayPal button will be integrated here */}
                <div id="paypal-button-container" className="max-w-xs mx-auto"></div>
                <p className="text-xs text-stone-500 mt-4">
                  Secure payment powered by PayPal
                </p>
              </div>
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

export default BlogPost;