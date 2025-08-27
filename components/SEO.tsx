import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
  type?: string;
}

export default function SEO({ 
  title = "InveStar - Global Money Transfer with Stellar Blockchain | Send Money Worldwide",
  description = "Transform global finance with InveStar. Send money to 200+ countries using Stellar blockchain technology. Competitive rates, real-time FX, and secure transactions.",
  keywords = "money transfer, stellar blockchain, global remittance, cryptocurrency wallet, international payments, digital wallet, cross-border payments",
  ogImage = "/og-image.jpg",
  canonical = "https://www.investarbd.com",
  type = "website"
}: SEOProps) {
  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="InveStar" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonical} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
      
      {/* Additional Meta Tags */}
      <meta name="author" content="InveStar Team" />
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FinancialService",
            "name": "InveStar",
            "description": "Global money transfer service using Stellar blockchain technology",
            "url": "https://www.investarbd.com",
            "logo": "https://www.investarbd.com/logo.png",
            "sameAs": [
              "https://twitter.com/investar",
              "https://linkedin.com/company/investar",
              "https://github.com/investar"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+1-800-INVESTAR",
              "contactType": "customer service",
              "email": "support@investarbd.com"
            },
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "BD",
              "addressLocality": "Dhaka",
              "addressRegion": "Dhaka"
            },
            "serviceType": "Money Transfer",
            "areaServed": {
              "@type": "Country",
              "name": "Worldwide"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Money Transfer Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "International Money Transfer",
                    "description": "Send money to 200+ countries worldwide"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Stellar Wallet",
                    "description": "Secure digital wallet for cryptocurrency and fiat"
                  }
                }
              ]
            }
          })
        }}
      />
    </Head>
  );
}