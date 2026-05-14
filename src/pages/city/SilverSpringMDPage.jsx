import CityPageLayout from '@/components/city/CityPageLayout';

const city = {
  name: 'Silver Spring',
  state: 'MD',
  slug: 'silver-spring-md',
  metaTitle: 'Lawn Care Silver Spring MD | Local Pros, Instant Quotes — Grassgodz',
  metaDescription: 'Find trusted lawn care pros in Silver Spring, Maryland. Get competing quotes for mowing, leaf removal, aeration & more. Pay after completion.',
  h1: 'Lawn Care in Silver Spring, MD — Local Pros You Can Trust',
  intro: 'Silver Spring homeowners get real competing quotes from insured, background-checked lawn care pros. No contracts — just a yard you\'ll love.',
  bodyParagraphs: [
    'Silver Spring, Maryland is one of the most diverse and densely populated communities in the DC metro area, with a wide range of property types — from the historic colonials of Woodside Park to the newer single-family homes in Four Corners and the townhomes near downtown Silver Spring. Grassgodz connects homeowners across all these neighborhoods with reliable, vetted local lawn care professionals.',
    'Maryland\'s mix of clay and loam soils, combined with hot summers and heavy fall leaf coverage from mature trees, makes lawn maintenance both essential and challenging in Silver Spring. Our local pros understand these conditions and bring the right equipment and expertise to every job.',
    'With Grassgodz, you post once and receive multiple quotes within 24 hours. Our platform handles scheduling, payment, and post-job reviews — so you spend less time managing yard work and more time enjoying your property.',
  ],
  neighborhoods: [
    'Woodside Park', 'Four Corners', 'Burnt Mills', 'Sligo Creek', 'Wheaton',
    'Kemp Mill', 'Long Branch', 'Takoma Park', 'Colesville', 'White Oak',
    'Montgomery Hills', 'North Hills', 'Layhill', 'Rossmoor', 'Leisure World',
  ],
  faqs: [
    {
      q: 'How much does lawn mowing cost in Silver Spring, MD?',
      a: 'Most Silver Spring lawns run $45–$95 per mow depending on size and condition. Because Grassgodz is a competitive marketplace, you see real quotes from local pros and choose the best value.',
    },
    {
      q: 'Do Grassgodz pros service the Takoma Park and Wheaton areas near Silver Spring?',
      a: 'Yes. Our Silver Spring providers cover surrounding areas including Takoma Park, Wheaton, Kemp Mill, and Colesville. We serve the full central Montgomery County corridor.',
    },
    {
      q: 'What\'s the best time to dethatch a lawn in Silver Spring, MD?',
      a: 'Late summer to early fall (August–September) is the ideal window for dethatching cool-season lawns in the Silver Spring area. This gives the grass time to recover before winter dormancy.',
    },
  ],
  jsonLd: {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        name: 'Grassgodz — Lawn Care Silver Spring MD',
        description: 'Lawn care marketplace connecting Silver Spring MD homeowners with vetted local pros.',
        url: 'https://grassgodz.com/lawn-care/silver-spring-md',
        areaServed: { '@type': 'City', name: 'Silver Spring', addressRegion: 'MD' },
        serviceType: ['Lawn Mowing', 'Leaf Removal', 'Hedge Trimming', 'Fertilization', 'Aeration', 'Snow Removal'],
        aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '76' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'How much does lawn mowing cost in Silver Spring, MD?', acceptedAnswer: { '@type': 'Answer', text: 'Most Silver Spring lawns run $45–$95 per mow depending on size and condition.' } },
          { '@type': 'Question', name: 'Do Grassgodz pros service the Takoma Park and Wheaton areas?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Our providers cover Takoma Park, Wheaton, Kemp Mill, Colesville and the full central Montgomery County corridor.' } },
          { '@type': 'Question', name: "What's the best time to dethatch a lawn in Silver Spring, MD?", acceptedAnswer: { '@type': 'Answer', text: 'Late summer to early fall (August–September) is ideal for cool-season lawns in the Silver Spring area.' } },
        ],
      },
    ],
  },
};

export default function SilverSpringMDPage() {
  return <CityPageLayout city={city} />;
}