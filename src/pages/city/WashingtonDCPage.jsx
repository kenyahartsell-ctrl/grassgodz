import CityPageLayout from '@/components/city/CityPageLayout';

const city = {
  name: 'Washington',
  state: 'DC',
  slug: 'washington-dc',
  metaTitle: 'Lawn Care Washington DC | Local Pros, Instant Quotes — Grassgodz',
  metaDescription: 'Book vetted lawn care pros in Washington DC. Get competing quotes for mowing, leaf removal, hedge trimming & more. Pay only after the job is done.',
  h1: 'Lawn Care in Washington, DC — Local Pros, Honest Prices',
  intro: 'Get competing quotes from vetted DC-area lawn care professionals. No contracts, no surprises — just a great-looking yard.',
  bodyParagraphs: [
    'Washington, DC homeowners know that maintaining a lawn in the District comes with unique challenges — from the hot, humid summers to the unpredictable winters. Whether you live in Capitol Hill, Dupont Circle, or Petworth, Grassgodz connects you with insured, background-checked lawn care pros who know the DC landscape inside and out.',
    'Our marketplace model means you post one request and local pros compete for your business. That translates to better pricing and higher quality work. Most DC homeowners receive 2–4 quotes within 24 hours of posting.',
    'From weekly mowing subscriptions to one-time leaf cleanups before winter, Grassgodz handles every service your DC yard needs — all managed through a single app, with payment held until the job meets your standards.',
  ],
  neighborhoods: [
    'Capitol Hill', 'Dupont Circle', 'Georgetown', 'Petworth', 'Columbia Heights',
    'Adams Morgan', 'Brookland', 'Chevy Chase DC', 'Friendship Heights', 'Tenleytown',
    'Shaw', 'Logan Circle', 'NoMa', 'Navy Yard', 'Congress Heights',
  ],
  faqs: [
    {
      q: 'How much does lawn mowing cost in Washington, DC?',
      a: 'Most DC lawns cost between $42–$95 for a standard mow, depending on property size and grass height. Grassgodz pros submit competing quotes so you always get a fair price for your specific yard.',
    },
    {
      q: 'Are Grassgodz lawn care pros background checked in DC?',
      a: 'Yes. Every provider on the Grassgodz platform goes through identity verification and a background check before they can accept jobs in Washington, DC.',
    },
    {
      q: 'When is the best time to aerate a lawn in Washington, DC?',
      a: 'For the DC climate, fall (September–October) is the ideal window for core aeration on cool-season grasses. Spring aeration works well for warm-season turf. Our local pros can advise based on your specific lawn type.',
    },
  ],
  jsonLd: {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        name: 'Grassgodz — Lawn Care Washington DC',
        description: 'Lawn care marketplace connecting Washington DC homeowners with vetted local pros.',
        url: 'https://grassgodz.com/lawn-care/washington-dc',
        areaServed: { '@type': 'City', name: 'Washington', addressRegion: 'DC' },
        serviceType: ['Lawn Mowing', 'Leaf Removal', 'Hedge Trimming', 'Fertilization', 'Aeration', 'Snow Removal'],
        aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '124' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'How much does lawn mowing cost in Washington, DC?', acceptedAnswer: { '@type': 'Answer', text: 'Most DC lawns cost between $42–$95 for a standard mow, depending on property size and grass height.' } },
          { '@type': 'Question', name: 'Are Grassgodz lawn care pros background checked in DC?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Every provider goes through identity verification and a background check before accepting jobs.' } },
          { '@type': 'Question', name: 'When is the best time to aerate a lawn in Washington, DC?', acceptedAnswer: { '@type': 'Answer', text: 'Fall (September–October) is ideal for cool-season grasses. Spring works for warm-season turf.' } },
        ],
      },
    ],
  },
};

export default function WashingtonDCPage() {
  return <CityPageLayout city={city} />;
}