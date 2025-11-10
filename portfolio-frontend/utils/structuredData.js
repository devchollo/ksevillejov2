export const generateBlogPostSchema = (post, author = 'Kent Sevillejo') => {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.featuredImage || "https://www.ksevillejo.com/og-default.jpg",
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt,
    "author": {
      "@type": "Person",
      "name": author,
      "url": "https://www.ksevillejo.com",
      "jobTitle": "Full-Stack Software Developer",
      "sameAs": [
        "https://github.com/ksevillejo",
        "https://linkedin.com/in/ksevillejo"
      ]
    },
    "publisher": {
      "@type": "Person",
      "name": author,
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.ksevillejo.com/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.ksevillejo.com/blog/${post.slug}`
    },
    "keywords": [
      post.category,
      post.isDonationDrive ? "donation drive" : null,
      post.isDonationDrive ? "charity" : null,
      "Kent Sevillejo",
      "Philippines",
      "Cebu"
    ].filter(Boolean).join(", "),
    "articleSection": post.category,
    "wordCount": post.content?.split(' ').length || 0
  };
};

export const generateDonationSchema = (post, donationStats) => {
  if (!post.isDonationDrive) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "DonateAction",
    "agent": {
      "@type": "Person",
      "name": "Kent Sevillejo",
      "url": "https://www.ksevillejo.com"
    },
    "recipient": {
      "@type": "Organization",
      "name": post.title,
      "description": post.excerpt
    },
    "purpose": post.excerpt,
    "amount": {
      "@type": "MonetaryAmount",
      "currency": post.donationCurrency,
      "minValue": 1,
      "maxValue": post.donationGoal
    },
    "potentialAction": {
      "@type": "DonateAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `https://www.ksevillejo.com/blog/${post.slug}#donation-form`,
        "actionPlatform": [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform"
        ]
      }
    }
  };
};

export const generateFAQSchema = (faqs) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

export const generateBreadcrumbSchema = (items) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};

export const generatePersonSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Kent Sevillejo",
    "url": "https://www.ksevillejo.com",
    "image": "https://www.ksevillejo.com/profile-photo.jpg",
    "sameAs": [
      "https://github.com/ksevillejo",
      "https://linkedin.com/in/ksevillejo"
    ],
    "jobTitle": "Full-Stack Software Developer",
    "worksFor": {
      "@type": "Organization",
      "name": "Independent Developer"
    },
    "alumniOf": {
      "@type": "EducationalOrganization",
      "name": "Professional Academy of the Philippines"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Naga",
      "addressRegion": "Cebu",
      "addressCountry": "PH"
    },
    "knowsAbout": [
      "Web Development",
      "JavaScript",
      "React",
      "Node.js",
      "MongoDB",
      "Full-Stack Development",
      "Donation Management Systems",
      "Transparency Technology"
    ],
    "description": "Full-stack developer building impactful web applications and leading transparent donation drives to help communities in need."
  };
};

export const generateWebsiteSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Kent Sevillejo Portfolio",
    "url": "https://www.ksevillejo.com",
    "description": "Full-stack developer portfolio showcasing web applications, donation drives, and community impact projects.",
    "author": {
      "@type": "Person",
      "name": "Kent Sevillejo"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.ksevillejo.com/blog?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };
};

export const generateOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kent Sevillejo Portfolio",
    "url": "https://www.ksevillejo.com",
    "logo": "https://www.ksevillejo.com/logo.png",
    "description": "Technology solutions and transparent donation drives helping communities in the Philippines.",
    "founder": {
      "@type": "Person",
      "name": "Kent Sevillejo"
    },
    "location": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Liloan",
        "addressRegion": "Cebu",
        "addressCountry": "Philippines"
      }
    },
    "sameAs": [
      "https://github.com/ksevillejo",
      "https://linkedin.com/in/ksevillejo"
    ]
  };
};