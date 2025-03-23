export async function onRequestGet({ request, env }) {
  try {
    const apiKey = env.GCS_API_KEY;   // Your Google Custom Search API Key
    const cseId  = env.GCS_CSE_ID;    // Custom Search Engine ID (cx)
    const sites  = env.SITES_TO_SEARCH;

    // If environment variables aren’t set, bail out
    if (!apiKey || !cseId || !sites) {
      return new Response('Missing required environment variables.', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Parse query from ?q= param (default to "DevOps Outside IR35 Remote")
    const url = new URL(request.url);
    const userQuery = url.searchParams.get('q') || 'DevOps Outside IR35 Remote';

    // Parse a page number if you want pagination (default to 1)
    // for the free API, typically max results per page is 10.
    // If no pagination, you can remove the next four lines.
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize + 1;

    // Convert multi-line SITES_TO_SEARCH into an array
    // e.g. "site:icims.com\nsite:apply.workable.com\n..."
    const siteList = sites.split('\n').map(line => line.trim()).filter(Boolean);

    // e.g. "site:icims.com OR site:apply.workable.com OR ..."
    const siteClause = siteList.join(' OR ');

    // Combine siteClause + userQuery
    const finalQuery = `${siteClause} ${userQuery}`.trim();

    // Build the request to Google Custom Search
    const googleApiUrl = new URL('https://www.googleapis.com/customsearch/v1');
    googleApiUrl.searchParams.set('key', apiKey);
    googleApiUrl.searchParams.set('cx', cseId);
    googleApiUrl.searchParams.set('q', finalQuery);
    googleApiUrl.searchParams.set('start', startIndex); // 1-based index
    googleApiUrl.searchParams.set('num', 10);           // up to 10 results

    // Fetch from Google
    const response = await fetch(googleApiUrl.toString());
    const data = await response.json();

    // Return JSON
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response('Error: ' + err.message, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
