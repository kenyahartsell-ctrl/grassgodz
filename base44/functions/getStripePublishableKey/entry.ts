Deno.serve(async (req) => {
  try {
    const key = Deno.env.get('VITE_STRIPE_PUBLISHABLE_KEY');
    if (!key) return Response.json({ error: 'Stripe publishable key not configured' }, { status: 500 });
    return Response.json({ publishable_key: key });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});