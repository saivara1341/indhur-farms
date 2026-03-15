import { Helmet } from "react-helmet-async";

interface MetaSEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const MetaSEO = ({ 
  title = "Indhur Farms | Pure & Natural Turmeric Direct from Farmer", 
  description = "Pure, chemical-free turmeric and farm products direct from our fields in Telangana to your home. No middlemen, just quality.", 
  image = "/og-image.jpg", 
  url = "https://indhurfarms.com", 
  type = "website" 
}: MetaSEOProps) => {
  const siteTitle = title.includes("Indhur Farms") ? title : `${title} | Indhur Farms`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
    </Helmet>
  );
};

export default MetaSEO;
