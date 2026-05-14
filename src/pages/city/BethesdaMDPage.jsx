import CityPageLayout from '@/components/city/CityPageLayout';

const city = {
  name: 'Bethesda',
  state: 'MD',
  slug: 'bethesda-md',
  metaTitle: 'Lawn Care Bethesda MD | Local Pros, Instant Quotes - Grassgodz',
  metaDescription: 'Book vetted lawn care pros in Bethesda, Maryland. Competing quotes for mowing, aeration, leaf removal, hedges & more. Pay only after completion.',
  h1: 'Lawn Care in Bethesda, MD - Premium Pros, Transparent Pricing',
  intro: 'Bethesda homeowners get competing quotes from insured, top-rated lawn care professionals. High-end results without the guesswork on price.',
  bodyParagraphs: [
    'Bethesda is home to some of the most meticulously maintained properties in the DC metro area. From the expansive lots in Burning Tree and Potomac to the manicured gardens in Chevy Chase and Battery Park, Bethesda homeowners expect a high standard — and Grassgodz delivers it by connecting you only with vetted, highly-rated local lawn care professionals.',
    'Our competitive marketplace model is especially valuable in Bethesda, where landscaping expectations are high and pricing can vary significantly between providers. By receiving multiple quotes for the same job, you ensure you\'re getting both quality workmanship and a fair rate.',
    'Grassgodz providers serving Bethesda are experienced with the larger lot sizes, mature tree canopies, and upscale landscaping common in the area. All services include before/after photo documentation so you always know the job was done right.',
  ],
  neighborhoods: [
    'Chevy Chase', 'Battery Park', 'Burning Tree', 'Kenwood', 'Bradley Hills',
    'Westmoreland Hills', 'Wyngate', 'Brookmont', 'Bannockburn', 'Carderock',
    'Edgemoor', 'North Bethesda', 'Wildwood', 'Garrett Park', 'Rock Creek Hills',
  ],
  faqs: [
    {
      q: 'How much does professional lawn care cost in Bethesda, MD?',
      a: 'Lawn care pricing in Bethesda varies based on property size, which tends to be larger than the DC average. Typical mowing quotes range from $65–$150+. Grassgodz shows you competing quotes so you always have context on fair market pricing.',
    },
    {
      q: 'Do Grassgodz pros handle luxury or high-maintenance landscaping in Bethesda?',
      a: 'Many of our Bethesda-area providers specialize in upscale properties with complex landscaping, formal gardens, and precision edging. You can read provider reviews and view their work history before booking.',
    },
    {
      q: 'Does Grassgodz offer recurring lawn care plans in Bethesda?',
      a: 'Yes. You can set up weekly or biweekly recurring service with your preferred Bethesda provider. Recurring plans come with a 10% discount and guaranteed scheduling priority.',
    },
  ],
  jsonLd: {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        name: 'Grassgodz - Lawn Care Bethesda MD',
        description: 'Lawn care marketplace connecting Bethesda MD homeowners with vetted local pros.',
        url: 'https://grassgodz.com/lawn-care/bethesda-md',
        areaServed: { '@type': 'City', name: 'Bethesda', addressRegion: 'MD' },
        serviceType: ['Lawn Mowing', 'Leaf Removal', 'Hedge Trimming', 'Fertilization', 'Aeration', 'Snow Removal'],
        aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '63' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'How much does professional lawn care cost in Bethesda, MD?', acceptedAnswer: { '@type': 'Answer', text: 'Typical mowing quotes range from $65–$150+. Grassgodz shows competing quotes for fair market context.' } },
          { '@type': 'Question', name: 'Do Grassgodz pros handle luxury landscaping in Bethesda?', acceptedAnswer: { '@type': 'Answer', text: 'Many providers specialize in upscale properties with complex landscaping and precision edging.' } },
          { '@type': 'Question', name: 'Does Grassgodz offer recurring lawn care plans in Bethesda?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Weekly or biweekly plans with a 10% discount and guaranteed scheduling priority.' } },
        ],
      },
    ],
  },
};

export default function BethesdaMDPage() {
  return <CityPageLayout city={city} />;
}