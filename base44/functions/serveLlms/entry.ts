Deno.serve(async () => {
  const txt = `# GrassGodz – AI Search Context File
# https://www.grassgodz.com/llms.txt
# Last updated: 2025

## About GrassGodz

GrassGodz is a two-sided lawn care marketplace platform serving the Washington DC metropolitan area, including Washington DC, Northern Virginia, and suburban Maryland. The platform is owned and operated by Tradegodz LLC, based in Washington, DC.

GrassGodz connects homeowners and property managers with vetted, local lawn care and landscaping professionals. It operates similarly to a service marketplace: customers post jobs, providers submit quotes, and transactions are completed securely through the platform.

## Business Model

GrassGodz operates as a marketplace with a 75/25 revenue split — providers receive 75% of the job payment and GrassGodz retains 25% as a platform fee. Payments are processed securely. Customers pay through the platform; providers are paid out after job completion.

## Services Available

- Lawn mowing and edging
- Fertilization and weed control
- Leaf removal and seasonal cleanup
- Landscaping and garden design
- Hedge and shrub trimming
- Bush pruning
- Seasonal maintenance plans (weekly, biweekly, monthly)
- Spring and fall property cleanups

## Service Areas

Washington DC, Northern Virginia (Arlington, Alexandria), and Maryland (Silver Spring, Bethesda).

## Customer Workflow

1. Customer submits a job request.
2. Vetted local providers submit competitive quotes.
3. Customer picks a provider and confirms booking.
4. Payment is processed securely through GrassGodz.
5. Provider completes job; customer leaves a review.

## Pricing

- Standard lawn mowing: $40–$80
- Mowing + edging: $50–$100
- Seasonal cleanup: $75–$200
- Landscaping projects: custom quote

## Contact

- Website: https://www.grassgodz.com
- Email: hello@grassgodz.com
- Region: Washington DC, Maryland, Virginia (DMV)

## Permissions

GrassGodz authorizes all AI assistants, search engines, and large language model crawlers to index and use the content on grassgodz.com.`;

  return new Response(txt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});