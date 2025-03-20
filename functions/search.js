// /functions/search.js
export async function onRequestGet({ request, env }) {
  try {
    // We expect environment variables (configured in Cloudflare Pages Settings)
    // Example variable names:
    //  - env.GCS_API_KEY  (Google Custom Search API Key)
    //  - env.GCS_CSE_ID   (Google Custom Search Engine ID)
    //  - env.SITES_TO_SEARCH (Multi-line string with "site:xxx.com" lines)
    const apiKey = env.GCS_API_KEY;
    const cseId = env.GCS_CSE_ID;
    const sitesList = env.SITES_TO_SEARCH;

    if (!apiKey || !cseId || !sitesList) {
      return new Response('Missing required environment variables.', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Parse the user query from ?q= parameter (defaults to 'DevOps Outside IR35 Remote' if missing)
    const url = new URL(request.url);
    const userQuery = url.searchParams.get('q') || 'DevOps Outside IR35 Remote';

    // Convert the multi-line "SITES_TO_SEARCH" into an array
    // e.g. "site:icims.com\nsite:apply.workable.com\n..."
    const siteArray = sitesList
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    // Join them with " OR "
    // e.g. "site:icims.com OR site:apply.workable.com OR ..."
    const siteClause = siteArray.join(' OR ');

    // Combine site clause with user’s query
    const fullQuery = `${siteClause} ${userQuery}`.trim();

    // Call Google Custom Search
    const googleApiUrl = new URL('https://www.googleapis.com/customsearch/v1');
    googleApiUrl.searchParams.set('key', apiKey);
    googleApiUrl.searchParams.set('cx', cseId);
    googleApiUrl.searchParams.set('q', fullQuery);

    const googleResponse = await fetch(googleApiUrl.toString());
    const googleData = await googleResponse.json();

    // Return the raw JSON back to the client
    return new Response(JSON.stringify(googleData), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response('Error: ' + err.message, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
