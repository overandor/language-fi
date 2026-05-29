import nodeFetch from "node-fetch";
import crypto from "crypto";

// Generate a key pair for signing samples
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

interface SampleResult {
  source: string;
  letterCounts: Record<string, number>;
  totalChars: number;
  sampledAt: Date;
  rawData: string[];
  sampleSize: number;
  urls: string[];
  contentHash: string;
  signature: string;
  samplerPublicKey: string;
  merkleRoot?: string;
  previousHash?: string;
  attestationHash?: string;
}

interface DataSourceConfig {
  id: number;
  name: string;
  url: string;
  type: "api" | "html";
  sampleSize: number;
  selector?: string;
}

export const DATA_SOURCES: DataSourceConfig[] = [
  { id: 1, name: "GitHub Code", url: "https://api.github.com/search/code?q=language:typescript+stars:>10&per_page=50", type: "api", sampleSize: 20 },
  { id: 2, name: "Wikipedia Pages", url: "https://en.wikipedia.org/api/rest_v1/page/random/summary", type: "api", sampleSize: 50 },
  { id: 3, name: "Hacker News", url: "https://hacker-news.firebaseio.com/v0/topstories.json", type: "api", sampleSize: 30 },
  { id: 4, name: "Reddit", url: "https://www.reddit.com/r/technology/hot.json?limit=50", type: "api", sampleSize: 50 },
  { id: 5, name: "Binance Token Names", url: "https://api.binance.com/api/v3/ticker/24hr", type: "api", sampleSize: 40 },
  { id: 6, name: "Coinbase Listings", url: "https://api.coinbase.com/v2/exchange-rates?currency=USD", type: "api", sampleSize: 30 },
  { id: 7, name: "NPM Packages", url: "https://registry.npmjs.org/-/v1/search", type: "api", sampleSize: 40 },
  { id: 8, name: "Kraken Listings", url: "https://api.kraken.com/0/public/AssetPairs", type: "api", sampleSize: 40 },
  { id: 9, name: "OKX Listings", url: "https://www.okx.com/api/v5/public/instruments?instType=SPOT", type: "api", sampleSize: 40 },
  { id: 10, name: "Stack Overflow", url: "https://api.stackexchange.com/2.3/questions?order=desc&sort=activity&site=stackoverflow&pagesize=30", type: "api", sampleSize: 30 },
  { id: 11, name: "GitHub Repos", url: "https://api.github.com/search/repositories?q=stars:>1000&language:javascript&per_page=30", type: "api", sampleSize: 30 },
  { id: 12, name: "Docker Hub", url: "https://hub.docker.com/v2/repositories/library/?page_size=30", type: "api", sampleSize: 30 },
  { id: 13, name: "PyPI Packages", url: "https://pypi.org/pypi/json", type: "api", sampleSize: 25 },
  { id: 14, name: "Medium Articles", url: "https://medium.com/tag/technology/latest", type: "html", sampleSize: 20 },
  { id: 15, name: "Dev.to Posts", url: "https://dev.to/latest", type: "html", sampleSize: 25 },
];

export const cache: Map<string, SampleResult> = new Map();
const CACHE_TTL = 60000; // 1 minute for real-time data
let previousHash: string = "0".repeat(64); // Genesis hash

function countLetters(text: string): Record<string, number> {
  const counts: Record<string, number> = {};
  const upperText = text.toUpperCase();
  
  for (const char of upperText) {
    if (/[A-Z]/.test(char)) {
      counts[char] = (counts[char] || 0) + 1;
    }
  }
  
  return counts;
}

function signSample(data: any): string {
  const dataString = JSON.stringify(data);
  const signature = crypto.sign('sha256', Buffer.from(dataString), privateKey);
  return signature.toString('base64');
}

function verifySignature(data: any, signature: string, pubKey: string): boolean {
  const dataString = JSON.stringify(data);
  const verify = crypto.verify('sha256', Buffer.from(dataString), {
    key: pubKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  }, Buffer.from(signature, 'base64'));
  return verify;
}

function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return "0".repeat(64);
  if (hashes.length === 1) return hashes[0];
  
  const nextLevel: string[] = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = hashes[i + 1] || left;
    const combined = left + right;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    nextLevel.push(hash);
  }
  
  return computeMerkleRoot(nextLevel);
}

function createAttestationHash(sample: SampleResult): string {
  const attestationData = {
    source: sample.source,
    letterCounts: sample.letterCounts,
    totalChars: sample.totalChars,
    sampledAt: sample.sampledAt.toISOString(),
    contentHash: sample.contentHash,
    samplerPublicKey: sample.samplerPublicKey,
  };
  return crypto.createHash('sha256').update(JSON.stringify(attestationData)).digest('hex');
}

async function sampleGitHub(): Promise<SampleResult> {
  const url = "https://api.github.com/search/repositories?q=stars:>1000&language:typescript&per_page=50";
  const response = await nodeFetch(url, {
    headers: { "User-Agent": "Language.fi-Oracle/1.0" },
  });
  const data = await response.json() as any;
  
  let combinedText = "";
  let rawData: string[] = [];
  let urls: string[] = [];
  
  if (data.items) {
    // Fetch README content from repositories
    const readmePromises = data.items.slice(0, 15).map(async (item: any) => {
      try {
        const readmeUrl = `https://raw.githubusercontent.com/${item.full_name}/${item.default_branch || 'main'}/README.md`;
        const readmeResponse = await nodeFetch(readmeUrl);
        const readme = await readmeResponse.text();
        return {
          code: readme.substring(0, 800), // Limit to 800 chars per README
          url: item.html_url,
        };
      } catch (error) {
        // Fallback to repository name and description
        return {
          code: `${item.name} ${item.description || ""}`,
          url: item.html_url,
        };
      }
    });
    
    const readmeResults = await Promise.all(readmePromises);
    rawData = readmeResults.map(r => r.code);
    urls = readmeResults.map(r => r.url);
    combinedText = rawData.join(" ");
  }
  
  const contentHash = crypto.createHash('sha256').update(combinedText).digest('hex');
  const currentHash = crypto.createHash('sha256').update(previousHash + contentHash).digest('hex');
  
  const sampleData = {
    source: "GitHub Code",
    letterCounts: countLetters(combinedText),
    totalChars: combinedText.length,
    sampledAt: new Date(),
    rawData: rawData.slice(0, 30),
    sampleSize: rawData.length,
    urls: urls.slice(0, 10),
    contentHash,
    samplerPublicKey: publicKey,
    previousHash,
  };
  
  const signature = signSample(sampleData);
  const attestationHash = createAttestationHash({ ...sampleData, signature });
  
  previousHash = currentHash;
  
  return {
    ...sampleData,
    signature,
    attestationHash,
  };
}

async function sampleWikipedia(): Promise<SampleResult> {
  const url = "https://en.wikipedia.org/api/rest_v1/page/random/summary";
  const response = await nodeFetch(url);
  const data = await response.json() as any;
  
  let text = (data.extract || "") + " " + (data.title || "");
  let rawData: string[] = [data.title || "", data.extract || ""];
  let urls: string[] = [data.content_urls?.desktop?.page || url];
  
  const contentHash = crypto.createHash('sha256').update(text).digest('hex');
  const currentHash = crypto.createHash('sha256').update(previousHash + contentHash).digest('hex');
  
  const sampleData = {
    source: "Wikipedia",
    letterCounts: countLetters(text),
    totalChars: text.length,
    sampledAt: new Date(),
    rawData: rawData,
    sampleSize: rawData.length,
    urls,
    contentHash,
    samplerPublicKey: publicKey,
    previousHash,
  };
  
  const signature = signSample(sampleData);
  const attestationHash = createAttestationHash({ ...sampleData, signature });
  
  previousHash = currentHash;
  
  return {
    ...sampleData,
    signature,
    attestationHash,
  };
}

async function sampleHackerNews(): Promise<SampleResult> {
  const url = "https://hacker-news.firebaseio.com/v0/topstories.json";
  const response = await nodeFetch(url);
  const ids = await response.json() as number[];
  
  const topIds = ids.slice(0, 30);
  const titles = await Promise.all(
    topIds.map(async (id) => {
      const itemResponse = await nodeFetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      const item = await itemResponse.json() as any;
      return item.title || "";
    })
  );
  
  let combinedText = titles.join(" ");
  let rawData = titles;
  let urls = topIds.map(id => `https://news.ycombinator.com/item?id=${id}`);
  
  const contentHash = crypto.createHash('sha256').update(combinedText).digest('hex');
  const currentHash = crypto.createHash('sha256').update(previousHash + contentHash).digest('hex');
  
  const sampleData = {
    source: "HackerNews",
    letterCounts: countLetters(combinedText),
    totalChars: combinedText.length,
    sampledAt: new Date(),
    rawData: rawData,
    sampleSize: rawData.length,
    urls: urls.slice(0, 10),
    contentHash,
    samplerPublicKey: publicKey,
    previousHash,
  };
  
  const signature = signSample(sampleData);
  const attestationHash = createAttestationHash({ ...sampleData, signature });
  
  previousHash = currentHash;
  
  return {
    ...sampleData,
    signature,
    attestationHash,
  };
}

async function sampleReddit(): Promise<SampleResult> {
  const url = "https://www.reddit.com/r/all/hot.json?limit=50";
  const response = await nodeFetch(url, {
    headers: { "User-Agent": "Language.fi-Oracle/1.0" },
  });
  
  const text = await response.text();
  const data = JSON.parse(text) as any;
  
  let combinedText = "";
  let rawData: string[] = [];
  let urls: string[] = [];
  
  if (data.data && data.data.children) {
    rawData = data.data.children
      .map((child: any) => child.data.title || "");
    urls = data.data.children
      .map((child: any) => `https://www.reddit.com${child.data.permalink}`);
    combinedText = rawData.join(" ");
  }
  
  const contentHash = crypto.createHash('sha256').update(combinedText).digest('hex');
  const currentHash = crypto.createHash('sha256').update(previousHash + contentHash).digest('hex');
  
  const sampleData = {
    source: "Reddit",
    letterCounts: countLetters(combinedText),
    totalChars: combinedText.length,
    sampledAt: new Date(),
    rawData: rawData,
    sampleSize: rawData.length,
    urls: urls.slice(0, 10),
    contentHash,
    samplerPublicKey: publicKey,
    previousHash,
  };
  
  const signature = signSample(sampleData);
  const attestationHash = createAttestationHash({ ...sampleData, signature });
  
  previousHash = currentHash;
  
  return {
    ...sampleData,
    signature,
    attestationHash,
  };
}

async function sampleBinance(): Promise<SampleResult> {
  const url = "https://api.binance.com/api/v3/ticker/24hr";
  const response = await nodeFetch(url);
  const data = await response.json() as any;
  
  const rawData = Array.isArray(data) ? data.slice(0, 50).map((item: any) => item.symbol || "") : ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];
  const combinedText = rawData.join(" ");
  const contentHash = crypto.createHash('sha256').update(combinedText).digest('hex');
  const currentHash = crypto.createHash('sha256').update(previousHash + contentHash).digest('hex');
  
  const sampleData = {
    source: "Binance Token Names",
    letterCounts: countLetters(combinedText),
    totalChars: combinedText.length,
    sampledAt: new Date(),
    rawData: rawData,
    sampleSize: rawData.length,
    urls: [url],
    contentHash,
    samplerPublicKey: publicKey,
    previousHash,
  };
  
  const signature = signSample(sampleData);
  const attestationHash = createAttestationHash({ ...sampleData, signature });
  
  previousHash = currentHash;
  
  return {
    ...sampleData,
    signature,
    attestationHash,
  };
}

async function sampleCoinbase(): Promise<SampleResult> {
  const url = "https://api.coinbase.com/v2/exchange-rates?currency=USD";
  const response = await nodeFetch(url);
  const data = await response.json() as any;
  
  const rawData = Object.keys(data.data?.rates || {}).slice(0, 30);
  const combinedText = rawData.join(" ");
  const contentHash = crypto.createHash('sha256').update(combinedText).digest('hex');
  const currentHash = crypto.createHash('sha256').update(previousHash + contentHash).digest('hex');
  
  const sampleData = {
    source: "Coinbase Listings",
    letterCounts: countLetters(combinedText),
    totalChars: combinedText.length,
    sampledAt: new Date(),
    rawData: rawData,
    sampleSize: rawData.length,
    urls: [url],
    contentHash,
    samplerPublicKey: publicKey,
    previousHash,
  };
  
  const signature = signSample(sampleData);
  const attestationHash = createAttestationHash({ ...sampleData, signature });
  
  previousHash = currentHash;
  
  return {
    ...sampleData,
    signature,
    attestationHash,
  };
}

async function sampleNPM(): Promise<SampleResult> {
  const url = "https://registry.npmjs.org/-/v1/search?text=react&size=50";
  const response = await nodeFetch(url);
  const data = await response.json() as any;
  
  const rawData = data.objects?.map((obj: any) => obj.package.name) || [];
  const combinedText = rawData.join(" ");
  const contentHash = crypto.createHash('sha256').update(combinedText).digest('hex');
  const currentHash = crypto.createHash('sha256').update(previousHash + contentHash).digest('hex');
  
  const sampleData = {
    source: "NPM Packages",
    letterCounts: countLetters(combinedText),
    totalChars: combinedText.length,
    sampledAt: new Date(),
    rawData: rawData,
    sampleSize: rawData.length,
    urls: [url],
    contentHash,
    samplerPublicKey: publicKey,
    previousHash,
  };
  
  const signature = signSample(sampleData);
  const attestationHash = createAttestationHash({ ...sampleData, signature });
  
  previousHash = currentHash;
  
  return {
    ...sampleData,
    signature,
    attestationHash,
  };
}

async function sampleKraken(): Promise<SampleResult> {
  const url = "https://api.kraken.com/0/public/AssetPairs";
  const response = await nodeFetch(url);
  const data = await response.json() as any;
  
  const rawData = Object.keys(data.result || {}).slice(0, 40);
  const combinedText = rawData.join(" ");
  const contentHash = crypto.createHash('sha256').update(combinedText).digest('hex');
  const currentHash = crypto.createHash('sha256').update(previousHash + contentHash).digest('hex');
  
  const sampleData = {
    source: "Kraken Listings",
    letterCounts: countLetters(combinedText),
    totalChars: combinedText.length,
    sampledAt: new Date(),
    rawData: rawData,
    sampleSize: rawData.length,
    urls: [url],
    contentHash,
    samplerPublicKey: publicKey,
    previousHash,
  };
  
  const signature = signSample(sampleData);
  const attestationHash = createAttestationHash({ ...sampleData, signature });
  
  previousHash = currentHash;
  
  return {
    ...sampleData,
    signature,
    attestationHash,
  };
}

async function sampleOKX(): Promise<SampleResult> {
  const url = "https://www.okx.com/api/v5/public/instruments?instType=SPOT";
  const response = await nodeFetch(url);
  const data = await response.json() as any;
  
  const rawData = data.data?.slice(0, 40).map((item: any) => item.instId) || [];
  const combinedText = rawData.join(" ");
  const contentHash = crypto.createHash('sha256').update(combinedText).digest('hex');
  const currentHash = crypto.createHash('sha256').update(previousHash + contentHash).digest('hex');
  
  const sampleData = {
    source: "OKX Listings",
    letterCounts: countLetters(combinedText),
    totalChars: combinedText.length,
    sampledAt: new Date(),
    rawData: rawData,
    sampleSize: rawData.length,
    urls: [url],
    contentHash,
    samplerPublicKey: publicKey,
    previousHash,
  };
  
  const signature = signSample(sampleData);
  const attestationHash = createAttestationHash({ ...sampleData, signature });
  
  previousHash = currentHash;
  
  return {
    ...sampleData,
    signature,
    attestationHash,
  };
}

async function sampleStackOverflow(): Promise<SampleResult> {
  const url = "https://api.stackexchange.com/2.3/questions?order=desc&sort=activity&site=stackoverflow&pagesize=30";
  const response = await nodeFetch(url);
  const data = await response.json() as any;
  
  const rawData = data.items?.slice(0, 30).map((item: any) => item.title || "") || [];
  const combinedText = rawData.join(" ");
  const contentHash = crypto.createHash('sha256').update(combinedText).digest('hex');
  const currentHash = crypto.createHash('sha256').update(previousHash + contentHash).digest('hex');
  
  const sampleData = {
    source: "Stack Overflow",
    letterCounts: countLetters(combinedText),
    totalChars: combinedText.length,
    sampledAt: new Date(),
    rawData: rawData,
    sampleSize: rawData.length,
    urls: rawData.map((_: string, i: number) => `https://stackoverflow.com/questions/${i}`),
    contentHash,
    samplerPublicKey: publicKey,
    previousHash,
  };
  
  const signature = signSample(sampleData);
  const attestationHash = createAttestationHash({ ...sampleData, signature });
  
  previousHash = currentHash;
  
  return {
    ...sampleData,
    signature,
    attestationHash,
  };
}

async function sampleGitHubRepos(): Promise<SampleResult> {
  const url = "https://api.github.com/search/repositories?q=stars:>1000&language:javascript&per_page=30";
  const response = await nodeFetch(url, {
    headers: { "User-Agent": "Language.fi-Oracle/1.0" },
  });
  const data = await response.json() as any;
  
  const rawData = data.items?.slice(0, 30).map((item: any) => `${item.name} ${item.description || ""}`) || [];
  const combinedText = rawData.join(" ");
  const contentHash = crypto.createHash('sha256').update(combinedText).digest('hex');
  const currentHash = crypto.createHash('sha256').update(previousHash + contentHash).digest('hex');
  
  const sampleData = {
    source: "GitHub Repos",
    letterCounts: countLetters(combinedText),
    totalChars: combinedText.length,
    sampledAt: new Date(),
    rawData: rawData,
    sampleSize: rawData.length,
    urls: data.items?.slice(0, 30).map((item: any) => item.html_url) || [],
    contentHash,
    samplerPublicKey: publicKey,
    previousHash,
  };
  
  const signature = signSample(sampleData);
  const attestationHash = createAttestationHash({ ...sampleData, signature });
  
  previousHash = currentHash;
  
  return {
    ...sampleData,
    signature,
    attestationHash,
  };
}

async function sampleDockerHub(): Promise<SampleResult> {
  const url = "https://hub.docker.com/v2/repositories/library/?page_size=30";
  const response = await nodeFetch(url);
  const data = await response.json() as any;
  
  const rawData = data.results?.slice(0, 30).map((item: any) => item.name || "") || [];
  const combinedText = rawData.join(" ");
  const contentHash = crypto.createHash('sha256').update(combinedText).digest('hex');
  const currentHash = crypto.createHash('sha256').update(previousHash + contentHash).digest('hex');
  
  const sampleData = {
    source: "Docker Hub",
    letterCounts: countLetters(combinedText),
    totalChars: combinedText.length,
    sampledAt: new Date(),
    rawData: rawData,
    sampleSize: rawData.length,
    urls: [url],
    contentHash,
    samplerPublicKey: publicKey,
    previousHash,
  };
  
  const signature = signSample(sampleData);
  const attestationHash = createAttestationHash({ ...sampleData, signature });
  
  previousHash = currentHash;
  
  return {
    ...sampleData,
    signature,
    attestationHash,
  };
}

async function samplePyPI(): Promise<SampleResult> {
  const url = "https://pypi.org/pypi/json";
  const response = await nodeFetch(url);
  
  let packages: string[] = [];
  
  try {
    const data = await response.json() as any;
    packages = Object.keys(data.urls || {}).slice(0, 25);
  } catch (error) {
    // Fallback if JSON parsing fails
    console.error("PyPI API error, using fallback:", error);
    packages = ["numpy", "pandas", "requests", "flask", "django", "tensorflow", "scikit-learn", "matplotlib", "pillow", "pytest"];
  }
  
  const combinedText = packages.join(" ");
  const contentHash = crypto.createHash('sha256').update(combinedText).digest('hex');
  const currentHash = crypto.createHash('sha256').update(previousHash + contentHash).digest('hex');
  
  const sampleData = {
    source: "PyPI Packages",
    letterCounts: countLetters(combinedText),
    totalChars: combinedText.length,
    sampledAt: new Date(),
    rawData: packages,
    sampleSize: packages.length,
    urls: [url],
    contentHash,
    samplerPublicKey: publicKey,
    previousHash,
  };
  
  const signature = signSample(sampleData);
  const attestationHash = createAttestationHash({ ...sampleData, signature });
  
  previousHash = currentHash;
  
  return {
    ...sampleData,
    signature,
    attestationHash,
  };
}

async function sampleMedium(): Promise<SampleResult> {
  const url = "https://medium.com/tag/technology/latest";
  const response = await nodeFetch(url);
  const text = await response.text();
  
  // Extract article titles from HTML - try multiple patterns
  const titleRegex1 = /<h2[^>]*>([^<]+)<\/h2>/g;
  const titleRegex2 = /<h3[^>]*>([^<]+)<\/h3>/g;
  const titleRegex3 = /<h1[^>]*>([^<]+)<\/h1>/g;
  
  const matches1 = Array.from(text.matchAll(titleRegex1));
  const matches2 = Array.from(text.matchAll(titleRegex2));
  const matches3 = Array.from(text.matchAll(titleRegex3));
  
  const allMatches = [...matches1, ...matches2, ...matches3];
  const rawData = allMatches.slice(0, 20).map(m => m[1].trim()).filter(t => t.length > 0);
  
  // Fallback if no titles found
  const finalRawData = rawData.length > 0 ? rawData : ["Technology", "Innovation", "Software Development", "AI", "Machine Learning"];
  const combinedText = finalRawData.join(" ");
  const contentHash = crypto.createHash('sha256').update(combinedText).digest('hex');
  const currentHash = crypto.createHash('sha256').update(previousHash + contentHash).digest('hex');
  
  const sampleData = {
    source: "Medium Articles",
    letterCounts: countLetters(combinedText),
    totalChars: combinedText.length,
    sampledAt: new Date(),
    rawData: finalRawData,
    sampleSize: finalRawData.length,
    urls: [url],
    contentHash,
    samplerPublicKey: publicKey,
    previousHash,
  };
  
  const signature = signSample(sampleData);
  const attestationHash = createAttestationHash({ ...sampleData, signature });
  
  previousHash = currentHash;
  
  return {
    ...sampleData,
    signature,
    attestationHash,
  };
}

async function sampleDevTo(): Promise<SampleResult> {
  const url = "https://dev.to/latest";
  const response = await nodeFetch(url);
  const text = await response.text();
  
  // Extract article titles from HTML - try multiple patterns
  const titleRegex1 = /<h2[^>]*>([^<]+)<\/h2>/g;
  const titleRegex2 = /<h3[^>]*>([^<]+)<\/h3>/g;
  const titleRegex3 = /<h1[^>]*>([^<]+)<\/h1>/g;
  
  const matches1 = Array.from(text.matchAll(titleRegex1));
  const matches2 = Array.from(text.matchAll(titleRegex2));
  const matches3 = Array.from(text.matchAll(titleRegex3));
  
  const allMatches = [...matches1, ...matches2, ...matches3];
  const rawData = allMatches.slice(0, 25).map(m => m[1].trim()).filter(t => t.length > 0);
  
  // Fallback if no titles found
  const finalRawData = rawData.length > 0 ? rawData : ["Web Development", "JavaScript", "React", "Node.js", "CSS"];
  const combinedText = finalRawData.join(" ");
  const contentHash = crypto.createHash('sha256').update(combinedText).digest('hex');
  const currentHash = crypto.createHash('sha256').update(previousHash + contentHash).digest('hex');
  
  const sampleData = {
    source: "Dev.to Posts",
    letterCounts: countLetters(combinedText),
    totalChars: combinedText.length,
    sampledAt: new Date(),
    rawData: finalRawData,
    sampleSize: finalRawData.length,
    urls: [url],
    contentHash,
    samplerPublicKey: publicKey,
    previousHash,
  };
  
  const signature = signSample(sampleData);
  const attestationHash = createAttestationHash({ ...sampleData, signature });
  
  previousHash = currentHash;
  
  return {
    ...sampleData,
    signature,
    attestationHash,
  };
}

export async function sampleAllSources(): Promise<SampleResult[]> {
  const results: SampleResult[] = [];
  
  const samplers = [
    sampleGitHub(),
    sampleWikipedia(),
    sampleHackerNews(),
    sampleReddit(),
    sampleBinance(),
    sampleCoinbase(),
    sampleNPM(),
    sampleKraken(),
    sampleOKX(),
    sampleStackOverflow(),
    sampleGitHubRepos(),
    sampleDockerHub(),
    samplePyPI(),
    sampleMedium(),
    sampleDevTo(),
  ];
  
  const sampled = await Promise.allSettled(samplers);
  
  for (const result of sampled) {
    if (result.status === "fulfilled") {
      results.push(result.value);
      cache.set(result.value.source, result.value);
    }
  }
  
  // Compute Merkle root for batch attestation
  const hashes = results.map(r => r.attestationHash || r.contentHash);
  const merkleRoot = computeMerkleRoot(hashes);
  
  // Add Merkle root to all samples
  results.forEach(r => r.merkleRoot = merkleRoot);
  
  return results;
}

export async function sampleSourceById(sourceId: number): Promise<SampleResult> {
  const sourceConfig = DATA_SOURCES.find(s => s.id === sourceId);
  if (!sourceConfig) {
    throw new Error(`Source with ID ${sourceId} not found`);
  }

  const cached = cache.get(sourceConfig.name);
  if (cached && Date.now() - cached.sampledAt.getTime() < CACHE_TTL) {
    return cached;
  }

  let result: SampleResult;
  switch (sourceConfig.name) {
    case "Binance Token Names":
      result = await sampleBinance();
      break;
    case "Coinbase Listings":
      result = await sampleCoinbase();
      break;
    case "NPM Packages":
      result = await sampleNPM();
      break;
    case "Kraken Listings":
      result = await sampleKraken();
      break;
    case "OKX Listings":
      result = await sampleOKX();
      break;
    case "GitHub Code":
      result = await sampleGitHub();
      break;
    case "Wikipedia Pages":
      result = await sampleWikipedia();
      break;
    case "Hacker News":
      result = await sampleHackerNews();
      break;
    case "Reddit":
      result = await sampleReddit();
      break;
    case "Stack Overflow":
      result = await sampleStackOverflow();
      break;
    case "GitHub Repos":
      result = await sampleGitHubRepos();
      break;
    case "Docker Hub":
      result = await sampleDockerHub();
      break;
    case "PyPI Packages":
      result = await samplePyPI();
      break;
    case "Medium Articles":
      result = await sampleMedium();
      break;
    case "Dev.to Posts":
      result = await sampleDevTo();
      break;
    default:
      throw new Error(`No sampler implemented for source: ${sourceConfig.name}`);
  }
  
  cache.set(sourceConfig.name, result);
  return result;
}

export async function getCachedOrSample(source: string): Promise<SampleResult> {
  const cached = cache.get(source);
  if (cached && Date.now() - cached.sampledAt.getTime() < CACHE_TTL) {
    return cached;
  }
  
  switch (source) {
    case "GitHub":
      return await sampleGitHub();
    case "Wikipedia":
      return await sampleWikipedia();
    case "HackerNews":
      return await sampleHackerNews();
    case "Reddit":
      return await sampleReddit();
    default:
      throw new Error(`No sampler implemented for source: ${source}`);
  }
}

export function getAggregatedLetterCounts(): Record<string, number> {
  const aggregated: Record<string, number> = {};
  
  for (const [source, result] of cache.entries()) {
    for (const [letter, count] of Object.entries(result.letterCounts)) {
      aggregated[letter] = (aggregated[letter] || 0) + count;
    }
  }
  
  return aggregated;
}

export function getSampleStats() {
  return {
    totalSources: cache.size,
    sources: Array.from(cache.keys()),
    lastSampled: cache.size > 0 ? Array.from(cache.values()).map(r => r.sampledAt).sort((a, b) => b.getTime() - a.getTime())[0] : null,
    samplerPublicKey: publicKey,
  };
}

export function verifySampleProvenance(sample: SampleResult): boolean {
  const sampleData = {
    source: sample.source,
    letterCounts: sample.letterCounts,
    totalChars: sample.totalChars,
    sampledAt: typeof sample.sampledAt === 'string' ? sample.sampledAt : sample.sampledAt.toISOString(),
    contentHash: sample.contentHash,
    samplerPublicKey: sample.samplerPublicKey,
  };
  
  return verifySignature(sampleData, sample.signature, sample.samplerPublicKey);
}

export function getSamplerPublicKey(): string {
  return publicKey;
}
