import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DollarSign, TrendingDown, Users, Calendar, FileText, Download, ArrowLeft } from 'lucide-react';

const TransparencyPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransparencyData();
  }, [slug]);

  const fetchTransparencyData = async () => {
    try {
      const response = await fetch(`https://ksevillejov2.onrender.com/api/transparency/${slug}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch transparency data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">Loading transparency data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-stone-50">
        {/* Header */}
        <nav className="bg-white shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <button
              onClick={() => navigate('/')}
              className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent"
            >
              Kent Sevillejo
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-stone-700 hover:text-amber-600 font-semibold transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/blog')}
                className="px-4 py-2 text-stone-700 hover:text-amber-600 font-semibold transition-colors"
              >
                Blog
              </button>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-stone-900 mb-4">Data Not Found</h1>
            <button 
              onClick={() => navigate('/blog')}
              className="text-amber-600 hover:text-amber-700 font-semibold"
            >
              ← Back to Blog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header/Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent hover:scale-105 transition-transform"
          >
            Kent Sevillejo
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-stone-700 hover:text-amber-600 font-semibold transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => navigate('/blog')}
              className="px-4 py-2 text-stone-700 hover:text-amber-600 font-semibold transition-colors"
            >
              Blog
            </button>
            <button
              onClick={() => navigate(`/blog/${data.blogPost.slug}`)}
              className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg font-semibold transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Campaign
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-amber-100 text-amber-900 rounded-full text-sm font-semibold mb-4">
              Transparency Report
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {data.blogPost.title}
            </h1>
            <p className="text-lg text-stone-600">
              Complete breakdown of donations received and how they're being used
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-stone-600">Total Donations</div>
                  <div className="text-2xl font-bold text-green-600">
                    {data.blogPost.currency} {data.summary.totalDonations.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="text-sm text-stone-600">Total Distributed</div>
                  <div className="text-2xl font-bold text-amber-600">
                    {data.blogPost.currency} {data.summary.totalExpenses.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-stone-600">Remaining Balance</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {data.blogPost.currency} {data.summary.remainingBalance.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-stone-600">Total Donors</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {data.summary.donorCount}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Donations List */}
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Users className="text-amber-600" />
                Recent Donations
              </h2>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {data.donations.length === 0 ? (
                  <p className="text-center text-stone-500 py-8">No donations yet</p>
                ) : (
                  data.donations.map((donation, idx) => (
                    <div key={idx} className="p-4 bg-stone-50 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold">{donation.donorName}</div>
                          <div className="text-xs text-stone-500">
                            {new Date(donation.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-lg font-bold text-amber-600">
                          {data.blogPost.currency} {donation.amount.toLocaleString()}
                        </div>
                      </div>
                      {donation.message && (
                        <p className="text-sm text-stone-600 italic">
                          "{donation.message}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <FileText className="text-amber-600" />
                Distribution Reports
              </h2>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {data.expenses.length === 0 ? (
                  <p className="text-center text-stone-500 py-8">No distributions yet</p>
                ) : (
                  data.expenses.map((expense, idx) => (
                    <div key={idx} className="p-4 bg-stone-50 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-semibold">{expense.title}</div>
                          <div className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                            <Calendar size={12} />
                            {new Date(expense.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-lg font-bold text-amber-600">
                          {expense.currency} {expense.amount.toLocaleString()}
                        </div>
                      </div>
                      
                      <p className="text-sm text-stone-600 mb-2">
                        {expense.description}
                      </p>
                      
                      {expense.beneficiaries && (
                        <p className="text-xs text-stone-500 mb-2">
                          <strong>Beneficiaries:</strong> {expense.beneficiaries}
                        </p>
                      )}
                      
                      {expense.receipts && expense.receipts.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-stone-700 mb-2">
                            Proof of Distribution:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {expense.receipts.map((receipt, rIdx) => (
                              <a
                                key={rIdx}
                                href={receipt}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative group"
                              >
                                <img
                                  src={receipt}
                                  alt={`Receipt ${rIdx + 1}`}
                                  className="w-full h-24 object-cover rounded-lg group-hover:opacity-75 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Download className="w-6 h-6 text-white drop-shadow-lg" />
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center mt-12">
            <button
              onClick={() => navigate(`/blog/${data.blogPost.slug}`)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all"
            >
              <ArrowLeft size={20} />
              Back to Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-stone-900 text-white py-12 px-4 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-4">
                Kent Sevillejo
              </h3>
              <p className="text-stone-400 text-sm">
                Building technology solutions and helping communities through transparent donation drives.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/')}
                  className="block text-stone-400 hover:text-amber-400 transition-colors text-sm"
                >
                  Home
                </button>
                <button
                  onClick={() => navigate('/blog')}
                  className="block text-stone-400 hover:text-amber-400 transition-colors text-sm"
                >
                  Blog
                </button>
                <button
                  onClick={() => navigate('/#contact')}
                  className="block text-stone-400 hover:text-amber-400 transition-colors text-sm"
                >
                  Contact
                </button>
              </div>
            </div>

            {/* Transparency */}
            <div>
              <h4 className="font-bold mb-4">Transparency</h4>
              <p className="text-stone-400 text-sm">
                Every donation is tracked and reported. Thank you for trusting us with your generosity.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-stone-800 pt-8 text-center">
            <p className="text-stone-400 text-sm">
              © {new Date().getFullYear()} Kent Sevillejo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TransparencyPage;