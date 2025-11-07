import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DollarSign, TrendingDown, Users, Calendar, FileText, Download, ExternalLink, Image as ImageIcon } from 'lucide-react';

const TransparencyPage = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    fetchTransparencyData();
  }, [slug]);

  const fetchTransparencyData = async () => {
    try {
      const response = await fetch(`https://ksevillejov2.onrender.com/api/transparency/${slug}`);
      const result = await response.json();
      
      console.log('📊 Transparency data:', result);
      
      if (result.success) {
        setData(result);
        
        // Log receipts for debugging
        result.expenses.forEach((expense, idx) => {
          console.log(`Expense ${idx + 1}:`, expense.title);
          console.log('Receipts:', expense.receipts);
        });
      }
    } catch (error) {
      console.error('Failed to fetch transparency data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (expenseIdx, receiptIdx, url) => {
    console.error(`❌ Failed to load image: ${url}`);
    setImageErrors(prev => ({
      ...prev,
      [`${expenseIdx}-${receiptIdx}`]: true
    }));
  };

  const handleImageLoad = (expenseIdx, receiptIdx, url) => {
    console.log(`✅ Image loaded successfully: ${url}`);
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
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-stone-900 mb-4">Data Not Found</h1>
          <a href="/blog" className="text-amber-600 hover:text-amber-700">← Back to Blog</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-20 px-4">
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
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {data.donations.length === 0 ? (
                <p className="text-center text-stone-500 py-8">No donations yet</p>
              ) : (
                data.donations.map((donation, idx) => (
                  <div key={idx} className="p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors">
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
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {data.expenses.length === 0 ? (
                <p className="text-center text-stone-500 py-8">No distributions yet</p>
              ) : (
                data.expenses.map((expense, expenseIdx) => (
                  <div key={expenseIdx} className="p-4 bg-stone-50 rounded-xl">
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
                    
                    {/* Receipts Display */}
                    {expense.receipts && Array.isArray(expense.receipts) && expense.receipts.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1">
                          <ImageIcon size={14} />
                          Proof of Distribution ({expense.receipts.length}):
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {expense.receipts.map((receipt, receiptIdx) => {
                            const errorKey = `${expenseIdx}-${receiptIdx}`;
                            const hasError = imageErrors[errorKey];

                            return (
                              <div key={receiptIdx} className="relative group">
                                {hasError ? (
                                  // Fallback for failed images
                                  <a
                                    href={receipt}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center justify-center w-full h-24 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors"
                                  >
                                    <ImageIcon className="w-6 h-6 text-stone-500 mb-1" />
                                    <span className="text-xs text-stone-600">View Image</span>
                                    <ExternalLink className="w-3 h-3 text-stone-500 mt-1" />
                                  </a>
                                ) : (
                                  // Normal image display
                                  <a
                                    href={receipt}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block relative"
                                  >
                                    <img
                                      src={receipt}
                                      alt={`Receipt ${receiptIdx + 1} for ${expense.title}`}
                                      className="w-full h-24 object-cover rounded-lg group-hover:opacity-75 transition-opacity"
                                      onError={() => handleImageError(expenseIdx, receiptIdx, receipt)}
                                      onLoad={() => handleImageLoad(expenseIdx, receiptIdx, receipt)}
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30 rounded-lg">
                                      <Download className="w-6 h-6 text-white drop-shadow-lg" />
                                    </div>
                                    <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                                      {receiptIdx + 1}/{expense.receipts.length}
                                    </div>
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800 flex items-center gap-1">
                          <ImageIcon size={12} />
                          No receipts uploaded yet
                        </p>
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
          <a
            href={`/blog/${data.blogPost.slug}`}
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold text-lg"
          >
            ← Back to Campaign
          </a>
        </div>
      </div>
    </div>
  );
};

export default TransparencyPage;