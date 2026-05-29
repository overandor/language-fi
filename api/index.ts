import app from '../artifacts/api-server/src/app';
import { sampleAllSources } from '../artifacts/api-server/src/lib/dataSampler';

// Sample data on cold start (only in production)
if (process.env.NODE_ENV === 'production') {
  sampleAllSources().catch(err => console.error('Initial sampling failed:', err));
}

export default app;
