import CityPageLayout from '@/components/city/CityPageLayout';

const city = {
  name: 'Arlington',
  state: 'VA',
  slug: 'arlington-va',
  metaTitle: 'Lawn Care Arlington VA | Local Pros, Instant Quotes - Grassgodz',
  metaDescription: 'Find vetted lawn care pros in Arlington, Virginia. Compare quotes for mowing, aeration, leaf removal & more. Pay only after the job is complete.',
  h1: 'Lawn Care in Arlington, VA - Trusted Local Pros',
  intro: 'Arlington homeowners get competing quotes from insured lawn care pros. Fast scheduling, fair pricing, and payment held until you\'re satisfied.',
  bodyParagraphs: [
    'Arlington, Virginia is one of the most densely residential counties in the country, with everything from compact townhome yards in Clarendon to larger suburban lots in Westover and Bluemont. Grassgodz connects Arlington homeowners with vetted local lawn care professionals who understand Northern Virginia\'s clay-heavy soils and humid subtropical climate.',
    'Unlike hiring a single lawn company, our marketplace puts you in control. Post your request once and receive competing quotes from multiple local pros — often within hours. That competition keeps prices fair and quality high across Arlington\'s diverse neighborhoods.',
    'Our pros handle everything from regular weekly mowing to seasonal services like fall aeration and overseeding, which are especially valuable for Arlington\'s cool-season fescue lawns. All providers are insured, background-checked, and rated after every job.',
  ],
  neighborhoods: [
    'Clarendon', 'Ballston', 'Rosslyn', 'Pentagon City', 'Crystal City',
    'Westover', 'Bluemont', 'Lyon Village', 'Cherrydale', 'Aurora Highlands',
    'Douglas Park', 'Shirlington', 'Forest Hills', 'Nauck', 'Foxcroft Heights',
  ],
  faqs: [
    {
      q: 'How much does lawn care cost in Arlington, VA?',
      a: 'Standard lawn mowing in Arlington typically ranges from $45–$100 depending on lot size. Grassgodz shows you real quotes from local pros so you can compare before committing.',
    },
    {
      q: 'Do Arlington lawn care pros handle HOA-compliant work?',
      a: 'Yes. Many Grassgodz providers in Arlington are familiar with local HOA standards and can work within specific height, edging, and aesthetic requirements common in Arlington communities.',
    },
    {
      q: 'What lawn services are most popular in Arlington in the fall?',
      a: 'Core aeration and overseeding are by far the most requested fall services in Arlington. The cooler temperatures make it the perfect time to thicken up fescue lawns before winter.',
    },
  ],
  jsonLd: {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        name: 'Grassgodz - Lawn Care Arlington VA',
        description: 'Lawn care marketplace connecting Arlington VA homeowners with vetted local pros.',
        url: 'https://grassgodz.com/lawn-care/arlington-va',
        areaServed: { '@type': 'City', name: 'Arlington', addressRegion: 'VA' },
        serviceType: ['Lawn Mowing', 'Leaf Removal', 'Hedge Trimming', 'Fertilization', 'Aeration', 'Snow Removal'],
        aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '98' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'How much does lawn care cost in Arlington, VA?', acceptedAnswer: { '@type': 'Answer', text: 'Standard lawn mowing in Arlington typically ranges from $45–$100 depending on lot size.' } },
          { '@type': 'Question', name: 'Do Arlington lawn care pros handle HOA-compliant work?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Many providers are familiar with HOA standards and can work within specific requirements.' } },
          { '@type': 'Question', name: 'What lawn services are most popular in Arlington in the fall?', acceptedAnswer: { '@type': 'Answer', text: 'Core aeration and overseeding are most requested. Cooler fall temps are ideal for fescue lawns.' } },
        ],
      },
    ],
  },
};

export default function ArlingtonVAPage() {
  return <CityPageLayout city={city} />;
}