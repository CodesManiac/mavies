import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchDetails, TmdbUpstreamError } from '../../../lib/tmdb';

type ResponseBody = {
  genres?: { id: number; name: string }[];
  trailerKey?: string;
  error?: string;
};

const isSupportedMediaType = (value: unknown): value is 'movie' | 'tv' =>
  value === 'movie' || value === 'tv';

const isValidId = (value: unknown): value is string =>
  typeof value === 'string' && /^\d+$/.test(value);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { mediaType, id } = req.query;

  if (!isSupportedMediaType(mediaType)) {
    return res.status(400).json({ error: 'Unsupported media type.' });
  }

  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid identifier.' });
  }

  const numericId = Number(id);

  if (
    !Number.isSafeInteger(numericId) ||
    numericId <= 0 ||
    numericId > 2_147_483_647
  ) {
    return res.status(400).json({ error: 'Invalid identifier.' });
  }

  try {
    const details = await fetchDetails(mediaType, numericId);
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=600, stale-while-revalidate=3600'
    );
    return res.status(200).json(details);
  } catch (error) {
    if (error instanceof TmdbUpstreamError && error.status === 429) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(429).json({ error: 'Upstream rate limit reached.' });
    }

    if (error instanceof TmdbUpstreamError && error.status === 504) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(504).json({ error: 'Upstream request timed out.' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'Upstream metadata unavailable.' });
  }
}
