import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DollarSign, TrendingDown, Users, Calendar, FileText, Download } from 'lucide-react';

const TransparencyPage = () => {
  const { slug } = useParams();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
          <a
            href={`/blog/${data.blogPost.slug}`}
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold"
          >
            ← Back to Campaign
          </a>
        </div>
      </div>
    </div>
  );
};

export default TransparencyPage;