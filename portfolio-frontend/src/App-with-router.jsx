import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Portfolio from './App';
import BlogList from './components/BlogList';
import BlogPost from './components/BlogPost';
import TransparencyPage from './components/TransparencyPage';

function AppWithRouter() {
  return (
    <Router>
      <Routes>
        {/* Main Portfolio Page */}
        <Route path="/" element={<Portfolio />} />
        
        {/* Blog Routes */}
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        
        {/* Transparency Routes */}
        <Route path="/transparency/:slug" element={<TransparencyPage />} />
        
        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

// 404 Not Found Component
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-stone-900 mb-4">404</h1>
        <p className="text-xl text-stone-600 mb-8">Page not found</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all font-semibold"
        >
          ← Back to Home
        </a>
      </div>
    </div>
  );
}

export default AppWithRouter;