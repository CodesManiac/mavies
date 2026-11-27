import type { NextApiRequest, NextApiResponse } from 'next';
import type { SearchCategory, SearchResponse } from '../../../typings';
import { fetchSearch, MAX_SEARCH_PAGE, TmdbUpstreamError } from '../../../lib/tmdb';

type ResponseBody = Partial<SearchResponse> & { error?: string };

const isSingleValue = (value: unknown): value is string => typeof value === 'string';

const isSupportedCategory = (value: unknown): value is SearchCategory =>
  value === 'all' || value === 'movie' || value === 'tv';

const isValidPage = (value: string): boolean => /^\d+$/.test(value);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { q, type, page } = req.query;

  if (!isSingleValue(q)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'A search query is required.' });
  }

  const query = q.trim();

  if (query.length < 2 || query.length > 100) {
    res.setHeader('Cache-Control', 'no-store');
    return res
      .status(400)
      .json({ error: 'Search queries must be between 2 and 100 characters.' });
  }

  const categoryValue: unknown = type === undefined ? 'all' : type;

  if (!isSupportedCategory(categoryValue)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'Unsupported search category.' });
  }

  const category = categoryValue;

  let pageNumber = 1;

  if (page !== undefined) {
    if (!isSingleValue(page) || !isValidPage(page)) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(400).json({ error: 'Invalid page number.' });
    }

    pageNumber = Number(page);

    if (
      !Number.isSafeInteger(pageNumber) ||
      pageNumber < 1 ||
      pageNumber > MAX_SEARCH_PAGE
    ) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(400).json({ error: 'Invalid page number.' });
    }
  }

  try {
    const results = await fetchSearch(query, category, pageNumber);

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=120, stale-while-revalidate=600'
    );
    return res.status(200).json(results);
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');

    if (error instanceof TmdbUpstreamError) {
      if (error.status === 429) {
        return res
          .status(429)
          .json({ error: 'Search is rate limited. Please try again shortly.' });
      }

      if (error.status === 504) {
        return res.status(504).json({ error: 'Search request timed out.' });
      }

      if (error.status === 503) {
        return res
          .status(503)
          .json({ error: 'Search service is temporarily unavailable.' });
      }
    }

    return res.status(502).json({ error: 'Search service unavailable.' });
  }
}
