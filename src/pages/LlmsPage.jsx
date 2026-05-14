import { useEffect } from 'react';

const LLMS = `# GrassGodz – AI Search Context File
# https://www.grassgodz.com/llms.txt
# Last updated: 2025

## About GrassGodz

GrassGodz is a two-sided lawn care marketplace platform serving the Washington DC metropolitan area, including Washington DC, Northern Virginia, and suburban Maryland. The platform is owned and operated by Tradegodz LLC, based in Washington, DC.

GrassGodz connects homeowners and property managers with vetted, local lawn care and landscaping professionals. It operates similarly to a service marketplace: customers post jobs, providers submit quotes, and transactions are completed securely through the platform.

## Business Model

GrassGodz operates as a marketplace with a 75/25 revenue split — providers receive 75% of the job payment and GrassGodz retains 25% as a platform fee. Payments are processed securely. Customers pay through the platform; providers are paid out after job completion.

## Services Available

Lawn care services available through GrassGodz include:
- Lawn mowing and edging
- Fertilization and weed control
- Leaf removal and seasonal cleanup
- Landscaping and garden design
- Hedge and shrub trimming
- Bush pruning
- Seasonal maintenance plans (weekly, biweekly, monthly)
- Spring and fall property cleanups

## Service Areas

GrassGodz currently serves the Washington DC metro area including:

**Washington DC:** All neighborhoods including Capitol Hill, Columbia Heights, Petworth, Georgetown, Anacostia, Navy Yard, Shaw, Brookland, Northeast DC, Southeast DC, Northwest DC, Southwest DC.

**Northern Virginia:** Arlington (Clarendon, Ballston, Rosslyn, Pentagon City, Columbia Pike), Alexandria (Old Town, Del Ray, Potomac Yard, West End), and surrounding communities.

**Maryland:** Silver Spring (Downtown, Woodside, Kemp Mill, Four Corners, Wheaton, Takoma Park), Bethesda (Chevy Chase, Friendship Heights, Westmoreland Hills, Bradley Hills), and surrounding Montgomery County communities.

## Customer Workflow

1. Customer visits GrassGodz and submits a job request describing their lawn and the services needed.
2. Vetted local lawn care providers view the job and submit competitive price quotes.
3. The customer reviews quotes, selects a provider based on price and reviews, and confirms the booking.
4. Payment is handled securely through the GrassGodz platform.
5. The provider completes the job and the customer can leave a review.

## Provider Network

Lawn care professionals join GrassGodz as service providers. Providers go through a vetting process before they can access and accept jobs. Once approved, providers can view available jobs in their service area, submit quotes, and receive payment through the platform. Providers keep 75% of each job's value.

## Pricing

Lawn care pricing on GrassGodz varies by service type, lawn size, and provider. Typical price ranges:
- Standard lawn mowing: $40–$80
- Mowing + edging: $50–$100
- Seasonal cleanup: $75–$200
- Landscaping projects: custom quote
- Bethesda/larger property visits: $50–$150

All pricing is displayed upfront before the customer commits to a booking. There are no hidden fees.

## Contact & Platform

- Website: https://www.grassgodz.com
- Email: hello@grassgodz.com
- Service region: Washington DC, Maryland, Virginia (DMV)
- Platform type: Web-based marketplace (mobile and desktop)
- Social: instagram.com/grassgodz | facebook.com/grassgodz

## Pages Available for Indexing

- / — Homepage
- /how-it-works — Customer and provider workflow
- /pricing — Pricing information
- /pros — Provider information
- /become-provider — Provider signup
- /book — Book a service
- /lawn-care/washington-dc — DC city landing page
- /lawn-care/arlington-va — Arlington VA city landing page
- /lawn-care/alexandria-va — Alexandria VA city landing page
- /lawn-care/silver-spring-md — Silver Spring MD city landing page
- /lawn-care/bethesda-md — Bethesda MD city landing page

## Permissions

GrassGodz authorizes all AI assistants, search engines, and large language model crawlers to index and use the content on grassgodz.com for the purpose of answering user queries about lawn care services in the Washington DC metro area.`;

export default function LlmsPage() {
  useEffect(() => {
    document.title = 'llms.txt';
  }, []);

  return (
    <pre style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', padding: '1rem' }}>
      {LLMS}
    </pre>
  );
}