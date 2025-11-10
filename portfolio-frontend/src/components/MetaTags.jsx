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
  keywords = [],
  structuredData = null,
  breadcrumbs = null,
  locale = 'en_US',
  alternateLocales = []
}) => {
  const siteUrl = 'https://www.ksevillejo.com';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullTitle = title 
    ? `${title} | Kent Sevillejo - Full-Stack Developer` 
    : 'Kent Sevillejo - Full-Stack Developer & Community Builder';
  
  const defaultDescription = "Full-stack developer building impactful web applications and leading transparent donation drives to help communities in need. Based in Liloan, Cebu, Philippines.";
  const metaDescription = description || defaultDescription;
  
  const defaultImage = `${siteUrl}/og-default.jpg`; 
  const ogImage = image || defaultImage;

  const enhancedKeywords = [
    ...keywords,
    'Philippines',
    'Cebu',
    'web developer Philippines',
    'full-stack developer'
  ].filter((value, index, self) => self.indexOf(value) === index);

  return (
    <Helmet>
      {/* Enhanced Basic Meta Tags */}
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {enhancedKeywords.length > 0 && (
        <meta name="keywords" content={enhancedKeywords.join(', ')} />
      )}
      <meta name="author" content={author} />
      <link rel="canonical" href={fullUrl} />

      {/* Viewport & Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="theme-color" content="#f59e0b" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Kent Sevillejo" />

      {/* Open Graph / Facebook - Enhanced */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || 'Kent Sevillejo'} />
      <meta property="og:site_name" content="Kent Sevillejo" />
      <meta property="og:locale" content={locale} />
      {alternateLocales.map(altLocale => (
        <meta key={altLocale} property="og:locale:alternate" content={altLocale} />
      ))}
      
      {/* Article-specific Open Graph tags */}
      {type === 'article' && (
        <>
          {publishedTime && (
            <meta property="article:published_time" content={publishedTime} />
          )}
          {modifiedTime && (
            <meta property="article:modified_time" content={modifiedTime} />
          )}
          <meta property="article:author" content={author} />
          <meta property="article:section" content={keywords[0] || 'Blog'} />
          {keywords.map(keyword => (
            <meta key={keyword} property="article:tag" content={keyword} />
          ))}
        </>
      )}

      {/* Twitter Card - Enhanced */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={title || 'Kent Sevillejo'} />
      <meta name="twitter:creator" content="@ksevillejo" />
      <meta name="twitter:site" content="@ksevillejo" />

      {/* SEO & Crawling Directives */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="google" content="notranslate" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Allow AI crawlers for GEO */}
      <meta name="googlebot-news" content="index, follow" />
      
      {/* Verification tags (add your actual codes) */}
      {/* <meta name="google-site-verification" content="your-verification-code" /> */}
      {/* <meta name="msvalidate.01" content="your-bing-verification-code" /> */}

      {/* Geographic Targeting - Philippines/Cebu */}
      <meta name="geo.region" content="PH-CEB" />
      <meta name="geo.placename" content="Naga, Cebu" />
      <meta name="geo.position" content="10.242724;123.7507943" />
      <meta name="ICBM" content="10.242724, 123.7507943" />

      {/* Structured Data - Schema.org */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {/* Breadcrumb Structured Data */}
      {breadcrumbs && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbs)}
        </script>
      )}

      {/* Performance - Preconnect to External Resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.paypal.com" />
      <link rel="dns-prefetch" href="https://www.paypal.com" />
      <link rel="dns-prefetch" href="https://f005.backblazeb2.com" />
      <link rel="dns-prefetch" href="https://ksevillejov2.onrender.com" />

      {/* Favicon and App Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Alternate hreflang for multilingual (if you add other languages) */}
      <link rel="alternate" hrefLang="en" href={fullUrl} />
    
    </Helmet>
  );
};

export default MetaTags;