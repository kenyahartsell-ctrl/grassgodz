import { Helmet } from 'react-helmet-async';

const DEFAULT_OG_IMAGE = 'https://media.base44.com/images/public/69e949497e5928c679297ebf/7b6c1fcab_generated_image.png';
const SITE_URL = 'https://grassgodz.com';

export default function PageMeta({ title, description, ogImage, path = '' }) {
  const fullUrl = `${SITE_URL}${path}`;
  const image = ogImage || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />

      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
    </Helmet>
  );
}