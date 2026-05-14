import CityPageLayout from '@/components/city/CityPageLayout';

const city = {
  name: 'Alexandria',
  state: 'VA',
  slug: 'alexandria-va',
  metaTitle: 'Lawn Care Alexandria VA | Local Pros, Instant Quotes - Grassgodz',
  metaDescription: 'Book insured lawn care pros in Alexandria, Virginia. Get competing quotes for mowing, hedges, leaf removal & more. Pay after the job is done.',
  h1: 'Lawn Care in Alexandria, VA - Vetted Pros, Fair Prices',
  intro: 'Alexandria homeowners receive competing quotes from local, insured lawn care professionals. Schedule in minutes and pay only when satisfied.',
  bodyParagraphs: [
    'Alexandria, Virginia blends historic charm with active suburban neighborhoods — from the brick-lined streets of Old Town to the newer developments in Kingstowne and the tree-filled lots of Del Ray. Each area has its own lawn care demands, and Grassgodz connects you with local pros who know exactly how to handle them.',
    'Grassgodz\'s competitive marketplace means Alexandria homeowners don\'t have to overpay for routine lawn maintenance. By posting one request, you receive quotes from multiple local professionals who are competing for your business — keeping costs transparent and service quality high.',
    'Whether you need a one-time mow before a home sale, regular biweekly maintenance, or a full seasonal cleanup, our Alexandria-area providers are vetted, insured, and rated by real customers after every job. No surprises, no cash payments at the door.',
  ],
  neighborhoods: [
    'Old Town', 'Del Ray', 'Arlandria', 'Seminary Hill', 'Kingstowne',
    'Landmark', 'West End', 'Rosemont', 'Beverley Hills', 'Hollin Hills',
    'Huntington', 'Cameron Station', 'North Ridge', 'Clover College Park', 'Braddock Road',
  ],
  faqs: [
    {
      q: 'How do I find a reliable lawn care pro in Alexandria, VA?',
      a: 'Grassgodz vets every provider through identity verification and background checks before they can accept jobs in Alexandria. You can also read verified reviews from other Alexandria homeowners before booking.',
    },
    {
      q: 'Does Grassgodz serve Old Town Alexandria?',
      a: 'Yes. We serve all Alexandria neighborhoods including Old Town, Del Ray, Kingstowne, and West End. Many of our providers specialize in the compact lots and historic landscaping requirements common in Old Town.',
    },
    {
      q: 'What is the average cost of lawn mowing in Alexandria, VA?',
      a: 'Lawn mowing in Alexandria typically starts around $45 for small lots and ranges up to $100+ for larger properties. Grassgodz shows real competing quotes so you\'re never guessing.',
    },
  ],
  jsonLd: {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        name: 'Grassgodz - Lawn Care Alexandria VA',
        description: 'Lawn care marketplace connecting Alexandria VA homeowners with vetted local pros.',
        url: 'https://grassgodz.com/lawn-care/alexandria-va',
        areaServed: { '@type': 'City', name: 'Alexandria', addressRegion: 'VA' },
        serviceType: ['Lawn Mowing', 'Leaf Removal', 'Hedge Trimming', 'Fertilization', 'Aeration', 'Snow Removal'],
        aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '87' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'How do I find a reliable lawn care pro in Alexandria, VA?', acceptedAnswer: { '@type': 'Answer', text: 'Every Grassgodz provider is vetted through background checks. Read verified reviews before booking.' } },
          { '@type': 'Question', name: 'Does Grassgodz serve Old Town Alexandria?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. We serve all Alexandria neighborhoods including Old Town, Del Ray, Kingstowne, and West End.' } },
          { '@type': 'Question', name: 'What is the average cost of lawn mowing in Alexandria, VA?', acceptedAnswer: { '@type': 'Answer', text: 'Typically $45 for small lots up to $100+ for larger properties. Get real competing quotes via Grassgodz.' } },
        ],
      },
    ],
  },
};

export default function AlexandriaVAPage() {
  return <CityPageLayout city={city} />;
}