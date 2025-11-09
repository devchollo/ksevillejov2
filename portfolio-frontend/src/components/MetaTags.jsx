// src/components/MetaTags.jsx
// First, install react-helmet-async: npm install react-helmet-async

import { Helmet } from 'react-helmet-async';

const MetaTags = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'article',
  author = 'Kent Sevillejo',
  publishedTime,
  modifiedTime,
  keywords = []
}) => {
  const siteUrl = 'https://www.ksevillejo.com';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullTitle = title ? `${title} | Kent Sevillejo` : 'Kent Sevillejo - Portfolio';
  const defaultImage = `${siteUrl}/og-default.jpg`; 
  const ogImage = image || defaultImage;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <meta name="author" content={author} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Kent Sevillejo Portfolio" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      <meta property="article:author" content={author} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content="@ksevillejo" /> {/* Update with your Twitter handle */}

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
    </Helmet>
  );
};

export default MetaTags;