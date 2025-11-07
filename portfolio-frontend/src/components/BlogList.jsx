import React, { useState, useEffect } from 'react';
import { Calendar, ArrowRight, Heart, Target } from 'lucide-react';

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      const url = filter === 'all' 
        ? 'https://ksevillejov2.onrender.com/api/blog/posts'
        : `https://ksevillejov2.onrender.com/api/blog/posts?category=${filter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-amber-100 text-amber-900 rounded-full text-sm font-semibold mb-4">
            Blog & Updates
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Stories of Compassion & Technology
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Read about our donation drives, transparency reports, and how technology helps us help each other
          </p>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {[
            { value: 'all', label: 'All Posts' },
            { value: 'donation-drive', label: 'Donation Drives' },
            { value: 'blog', label: 'Blog' },
            { value: 'update', label: 'Updates' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                filter === value
                  ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-600 text-lg">No posts found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <article
                key={post._id}
                className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:scale-105 group"
              >
                {/* Featured Image */}
                {post.featuredImage ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {post.isDonationDrive && (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-amber-600 text-white rounded-full text-sm font-semibold flex items-center gap-2">
                          <Heart size={14} />
                          Donation Drive
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                    <Target size={48} className="text-amber-600 opacity-50" />
                    {post.isDonationDrive && (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-amber-600 text-white rounded-full text-sm font-semibold flex items-center gap-2">
                          <Heart size={14} />
                          Donation Drive
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-stone-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="px-2 py-1 bg-stone-100 rounded-full text-xs">
                      {post.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-amber-600 transition-colors">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="text-stone-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* CTA */}
                  <a
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-amber-600 font-semibold hover:gap-3 transition-all"
                  >
                    <span>Read More</span>
                    <ArrowRight size={18} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;