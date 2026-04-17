const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface StockDetails {
  symbol: string;
  name: string;
  sector?: string;
  about?: string;
  incorporationYear?: string;
  listingYear?: string;
  website?: string;
  email?: string;
  address?: string;
  companySecretary?: string;
  marketCap?: string;
  freeFloatMarketCap?: string;
  peRatio?: string;
  trailingPE?: string;
  eps?: string;
  nav?: string;
  totalShares?: string;
  authorizedCapital?: string;
  paidUpCapital?: string;
  faceValue?: string;
  marketCategory?: string;
  creditRating?: string;
  lastDividendDate?: string;
  agmDate?: string;
  high52w?: string;
  low52w?: string;
  dayHigh?: string;
  dayLow?: string;
  volume?: string;
  dayValue?: string;
  dayTrades?: string;
  openPrice?: string;
  closePrice?: string;
  ycp?: string;
  rsi?: string;
  beta?: string;
  reserveSurplus?: string;
  operationalStatus?: string;
  dividendHistory?: Array<{ year: string; cash: string; stock: string; eps: string; nav: string }>;
  cashDividends?: string;
  stockDividends?: string;
  financialPerformance?: Array<{ year: string; eps: string; nav: string; dividendPayout: string }>;
  technicalIndicators?: Array<{ name: string; value: string; interpretation?: string }>;
  shareholding?: Array<{ category: string; percentage: string }>;
  shareholdingDate?: string;
  subsidiaries?: string[];
  boardOfDirectors?: Array<{ designation: string; name: string }>;
  events?: Array<{ date: string; event: string }>;
  source?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, marketType } = await req.json();

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let details: StockDetails;

    if (marketType === 'dse') {
      details = await fetchDseDetails(symbol, apiKey);
    } else {
      details = await fetchUsDetails(symbol, apiKey);
    }

    return new Response(
      JSON.stringify({ success: true, details }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in stock-details:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch details' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchDseDetails(symbol: string, apiKey: string): Promise<StockDetails> {
  // Primary source: dsebd.org (official DSE website)
  const dseUrl = `https://www.dsebd.org/displayCompany.php?name=${symbol}`;
  console.log(`Scraping DSE details for ${symbol} from ${dseUrl}`);

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: dseUrl,
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 3000,
    }),
  });

  const data = await response.json();
  const markdown = data?.data?.markdown || data?.markdown || '';

  if (!markdown || markdown.length < 100) {
    console.warn('DSE page returned insufficient data, trying LankaBD fallback');
    return fetchLankaBdFallback(symbol, apiKey);
  }

  return parseDseBdMarkdown(symbol, markdown, dseUrl);
}

function parseDseBdMarkdown(symbol: string, md: string, sourceUrl: string): StockDetails {
  const details: StockDetails = { symbol, name: symbol, source: sourceUrl };

  // Company Name
  const nameMatch = md.match(/Company Name:\s*_(.+?)_/i);
  if (nameMatch) details.name = nameMatch[1].trim();

  // LTP, Day's Range, 52W Range
  const ltpMatch = md.match(/Last Trading Price\s*\|\s*([\d,.]+)/i);
  const dayRangeMatch = md.match(/Day's Range\s*\|\s*([\d,.]+)\s*-\s*([\d,.]+)/i);
  const weekRangeMatch = md.match(/52 Weeks['']?\s*Moving Range\s*\|\s*([\d,.]+)\s*-\s*([\d,.]+)/i);
  
  if (dayRangeMatch) {
    details.dayLow = `৳${dayRangeMatch[1]}`;
    details.dayHigh = `৳${dayRangeMatch[2]}`;
  }
  if (weekRangeMatch) {
    details.low52w = `৳${weekRangeMatch[1]}`;
    details.high52w = `৳${weekRangeMatch[2]}`;
  }

  // Change
  const changeMatch = md.match(/Change\*?\s*\|[\s\S]*?\|\s*([\d,.]+)\s*\|\s*([\d,.]+)%/i);

  // YCP
  const ycpMatch = md.match(/Yesterday['']?s Closing Price\s*\|\s*([\d,.]+)/i);
  if (ycpMatch) details.ycp = `৳${ycpMatch[1]}`;

  // Opening Price
  const openMatch = md.match(/Opening Price\s*\|\s*([\d,.]+)/i);
  if (openMatch) details.openPrice = `৳${openMatch[1]}`;

  // Day's Trade, Volume, Value
  const tradesMatch = md.match(/Day['']?s Trade \(Nos\.\)\s*\|\s*([\d,]+)/i);
  if (tradesMatch) details.dayTrades = tradesMatch[1];

  const volMatch = md.match(/Day['']?s Volume \(Nos\.\)\s*\|\s*([\d,]+)/i);
  if (volMatch) details.volume = volMatch[1];

  const valMatch = md.match(/Day['']?s Value \(mn\)\s*\|\s*([\d,.]+)/i);
  if (valMatch) details.dayValue = `৳${valMatch[1]} mn`;

  // Market Capitalization
  const mcapMatch = md.match(/Market Capitalization \(mn\)\s*\|\s*([\d,.]+)/i);
  if (mcapMatch) details.marketCap = `৳${mcapMatch[1]} mn`;

  // Free Float Market Cap
  const ffmcMatch = md.match(/Free Float Market Cap\.?\s*\(mn\)\s*\|\s*([\d,.]+)/i);
  if (ffmcMatch) details.freeFloatMarketCap = `৳${ffmcMatch[1]} mn`;

  // Basic Information
  const authCapMatch = md.match(/Authorized Capital \(mn\)\s*\|\s*([\d,.]+)/i);
  if (authCapMatch) details.authorizedCapital = `৳${authCapMatch[1]} mn`;

  const paidCapMatch = md.match(/Paid-up Capital \(mn\)\s*\|\s*([\d,.]+)/i);
  if (paidCapMatch) details.paidUpCapital = `৳${paidCapMatch[1]} mn`;

  const faceValMatch = md.match(/Face\/par Value\s*\|\s*([\d.]+)/i);
  if (faceValMatch) details.faceValue = `৳${faceValMatch[1]}`;

  const totalSharesMatch = md.match(/Total No\. of Outstanding Securities\s*\|\s*([\d,]+)/i);
  if (totalSharesMatch) details.totalShares = totalSharesMatch[1];

  const sectorMatch = md.match(/Sector\s*\|\s*(\w[\w\s&]+?)(?:\s*\||\s*$)/im);
  if (sectorMatch) details.sector = sectorMatch[1].trim();

  // Market Category
  const catMatch = md.match(/Market Category\s*\|\s*(\w)/i);
  if (catMatch) details.marketCategory = catMatch[1];

  // Listing Year
  const listMatch = md.match(/Listing Year\s*\|\s*(\d{4})/i);
  if (listMatch) details.listingYear = listMatch[1];

  // AGM
  const agmMatch = md.match(/Last AGM held on:\s*_(.+?)_/i);
  if (agmMatch) details.agmDate = agmMatch[1].trim();

  // Cash Dividends
  const cashDivMatch = md.match(/Cash Dividend\s*\|\s*(.+?)(?:\n|$)/i);
  if (cashDivMatch) details.cashDividends = cashDivMatch[1].trim();

  // Stock Dividends
  const stockDivMatch = md.match(/Bonus Issue \(Stock Dividend\)\s*\|\s*(.+?)(?:\n|$)/i);
  if (stockDivMatch) details.stockDividends = stockDivMatch[1].trim();

  // Reserve & Surplus
  const reserveMatch = md.match(/Reserve & Surplus.*?\(mn\)\s*\|\s*([\d,.]+)/i);
  if (reserveMatch) details.reserveSurplus = `৳${reserveMatch[1]} mn`;

  // P/E Ratio (Un-audited)
  const peSection = md.match(/P\/E\) Ratio based on latest Un-audited([\s\S]*?)(?:P\/E\) Ratio Based on latest Audited|$)/i);
  if (peSection) {
    const peNums = peSection[1].match(/(?:Current P\/E Ratio using Basic EPS[\s\S]*?)\|\s*([\d.]+)\s*\|?\s*$/m);
    // Get the last P/E value in the row
    const allPE = [...peSection[1].matchAll(/([\d]+\.[\d]+)/g)].map(m => parseFloat(m[1]));
    if (allPE.length > 0) details.peRatio = allPE[allPE.length - 1].toFixed(2);
  }

  // Trailing P/E
  const trailingMatch = md.match(/Trailing P\/E Ratio[\s\S]*?\|\s*([\d.]+)\s*\|?\s*$/m);
  if (trailingMatch) details.trailingPE = trailingMatch[1];

  // EPS from interim
  const epsMatch = md.match(/Basic\s*\|\s*([\d.]+)/i);
  if (epsMatch) details.eps = `৳${epsMatch[1]}`;

  // NAV - look for it specifically
  const navMatch = md.match(/NAV.*?\|\s*([\d.]+)/i);

  // Financial Performance (audited)
  const finPerf: StockDetails['financialPerformance'] = [];
  const finRegex = /(\d{4})\s*\|[^|]*\|[^|]*\|[^|]*\|\s*([\d.]+)\s*\|[^|]*\|[^|]*\|\s*([\d.]+)/g;
  let fMatch;
  while ((fMatch = finRegex.exec(md)) !== null) {
    finPerf.push({ year: fMatch[1], eps: fMatch[2], nav: fMatch[3], dividendPayout: '' });
  }
  if (finPerf.length > 0) details.financialPerformance = finPerf;

  // Shareholding Pattern (latest)
  const shPatterns = [
    { cat: 'Sponsor/Director', regex: /Sponsor\/Director:\s*([\d.]+)/g },
    { cat: 'Government', regex: /Govt:\s*([\d.]+)/g },
    { cat: 'Institute', regex: /Institute:\s*([\d.]+)/g },
    { cat: 'Foreign', regex: /Foreign:\s*([\d.]+)/g },
    { cat: 'Public', regex: /Public:\s*([\d.]+)/g },
  ];
  // Get the LAST occurrence of each (most recent date)
  const shareholding: StockDetails['shareholding'] = [];
  for (const sp of shPatterns) {
    const allMatches = [...md.matchAll(sp.regex)];
    if (allMatches.length > 0) {
      const lastVal = allMatches[allMatches.length - 1][1];
      if (parseFloat(lastVal) > 0) {
        shareholding.push({ category: sp.cat, percentage: `${lastVal}%` });
      }
    }
  }
  if (shareholding.length > 0) details.shareholding = shareholding;

  // Shareholding date
  const shDateMatch = md.match(/Share Holding Percentage\s*\[as on (.+?)\]/gi);
  if (shDateMatch && shDateMatch.length > 0) {
    const lastDate = shDateMatch[shDateMatch.length - 1].match(/as on (.+?)\]/i);
    if (lastDate) details.shareholdingDate = lastDate[1];
  }

  // Operational Status
  const opsMatch = md.match(/Present Operational Status\s*\|\s*(\w+)/i);
  if (opsMatch) details.operationalStatus = opsMatch[1];

  // Latest Dividend Status
  const latestDivMatch = md.match(/Latest Dividend Status\s*\(%\)\s*\|\s*(.+?)(?:\n|$)/i);

  // Address
  const addrMatch = md.match(/Head Office\s*\|\s*(.+?)(?:\n|$)/i);
  if (addrMatch) details.address = addrMatch[1].trim();

  // Website
  const webMatch = md.match(/Web Address\s*\|\s*\[?(https?:\/\/[^\s\]|]+)/i);
  if (webMatch) details.website = webMatch[1];

  // Email
  const emailMatch = md.match(/E-mail\s*\|\s*\[?([^\s\]|]+@[^\s\]|]+)/i);
  if (emailMatch) details.email = emailMatch[1];

  // Company Secretary
  const secMatch = md.match(/Company Secretary Name\s*\|\s*(.+?)(?:\n|$)/i);
  if (secMatch) details.companySecretary = secMatch[1].trim();

  // Dividend history from cash dividend string
  if (details.cashDividends) {
    const divHistory: StockDetails['dividendHistory'] = [];
    const divParts = details.cashDividends.split(',').map(s => s.trim());
    for (const part of divParts) {
      const m = part.match(/([\d.]+)%\s*(\d{4})/);
      if (m) {
        // Find matching stock dividend
        let stockDiv = '—';
        if (details.stockDividends) {
          const stockMatch = details.stockDividends.match(new RegExp(`([\\d.]+)%\\s*${m[2]}`));
          if (stockMatch) stockDiv = `${stockMatch[1]}%`;
        }
        // Find matching EPS/NAV from financial performance
        const fp = details.financialPerformance?.find(f => f.year === m[2]);
        divHistory.push({
          year: m[2],
          cash: `${m[1]}%`,
          stock: stockDiv,
          eps: fp?.eps || '—',
          nav: fp?.nav || '—',
        });
      }
    }
    if (divHistory.length > 0) details.dividendHistory = divHistory;
  }

  return details;
}

// LankaBD fallback for supplementary data (technicals, etc.)
const DSE_COMPANY_MAP: Record<string, { cid: number; sn: string; cn: string }> = {
  BRACBANK: { cid: 15, sn: 'BRACBANK', cn: 'BRAC_Bank_PLC.' },
  BRAC: { cid: 15, sn: 'BRACBANK', cn: 'BRAC_Bank_PLC.' },
  SQURPHARMA: { cid: 66, sn: 'SQURPHARMA', cn: 'Square_Pharmaceuticals_PLC.' },
  GP: { cid: 93, sn: 'GP', cn: 'Grameenphone_Ltd.' },
  BATBC: { cid: 107, sn: 'BATBC', cn: 'British_American_Tobacco_Bangladesh_Company_Limited' },
  RENATA: { cid: 96, sn: 'RENATA', cn: 'Renata_PLC.' },
  BEXIMCO: { cid: 6, sn: 'BEXIMCO', cn: 'Beximco_Limited' },
  WALTONHIL: { cid: 289, sn: 'WALTONHIL', cn: 'Walton_Hi-Tech_Industries_PLC.' },
  ICB: { cid: 41, sn: 'ICB', cn: 'Investment_Corporation_of_Bangladesh' },
  LANKABAFIN: { cid: 44, sn: 'LANKABAFIN', cn: 'LankaBangla_Finance_PLC.' },
};

async function fetchLankaBdFallback(symbol: string, apiKey: string): Promise<StockDetails> {
  const company = DSE_COMPANY_MAP[symbol];
  const url = company
    ? `https://www.lankabd.com/Company/OverviewV2?cid=${company.cid}&sn=${company.sn}&cn=${company.cn}`
    : `https://www.lankabd.com/Company/OverviewV2?sn=${symbol}`;

  console.log(`Fallback: scraping LankaBD for ${symbol}`);
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true, waitFor: 3000 }),
  });
  const data = await response.json();
  const md = data?.data?.markdown || data?.markdown || '';
  return parseLankaBdBasic(symbol, md, url);
}

function parseLankaBdBasic(symbol: string, md: string, sourceUrl: string): StockDetails {
  const details: StockDetails = { symbol, name: symbol, source: sourceUrl };
  const nameMatch = md.match(/Name\s*:\s*(.+?)(?:\n|$)/i);
  if (nameMatch) details.name = nameMatch[1].trim();
  const sectorMatch = md.match(/Sector\s*:\s*(.+?)(?:\n|$)/i);
  if (sectorMatch) details.sector = sectorMatch[1].trim();
  const mcapMatch = md.match(/Market Capitalization.*?:\s*([\d,]+\.?\d*)/i);
  if (mcapMatch) details.marketCap = `৳${mcapMatch[1]} mn`;
  const peMatch = md.match(/P\/E\s*\((?:Interim|Audited)\).*?:\s*([\d.]+)/i);
  if (peMatch) details.peRatio = peMatch[1];
  const betaMatch = md.match(/Beta\s*[|:\s]*([\d.]+)/i);
  if (betaMatch) details.beta = betaMatch[1];
  const rsiMatch = md.match(/RSI\s*[|:\s]*([\d.]+)/i);
  if (rsiMatch) details.rsi = rsiMatch[1];
  // Technicals
  const techIndicators: StockDetails['technicalIndicators'] = [];
  const techPatterns = [
    { name: 'MFI', regex: /MFI\s*\|\s*([\d.-]+)\s*\|\s*(\w+)/i },
    { name: 'MACD', regex: /MACD\s*\|\s*([\d.-]+)\s*\|\s*(\w+)/i },
    { name: 'Stochastic', regex: /Stochastic Oscillator\s*\|\s*([\d.-]+)\s*\|\s*(\w+)/i },
    { name: 'William %R', regex: /William\s*%\s*R\s*\|\s*([\d.-]+)\s*\|\s*(\w+)/i },
  ];
  for (const tp of techPatterns) {
    const m = tp.regex.exec(md);
    if (m) techIndicators.push({ name: tp.name, value: m[1], interpretation: m[2] });
  }
  if (techIndicators.length > 0) details.technicalIndicators = techIndicators;
  return details;
}

async function fetchUsDetails(symbol: string, apiKey: string): Promise<StockDetails> {
  const url = `https://www.marketwatch.com/investing/stock/${symbol.toLowerCase()}`;
  console.log(`Scraping US details for ${symbol} from ${url}`);
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true, waitFor: 2000 }),
  });
  const data = await response.json();
  const md = data?.data?.markdown || data?.markdown || '';
  return parseMarketWatchMarkdown(symbol, md, url);
}

function parseMarketWatchMarkdown(symbol: string, md: string, sourceUrl: string): StockDetails {
  const details: StockDetails = { symbol, name: symbol, source: sourceUrl };
  const peMatch = md.match(/P\/E Ratio\s*[:\s]*([\d.]+)/i);
  if (peMatch) details.peRatio = peMatch[1];
  const epsMatch = md.match(/EPS\s*[:\s]*\$?([\d.]+)/i);
  if (epsMatch) details.eps = `$${epsMatch[1]}`;
  const mcapMatch = md.match(/Market Cap\s*[:\s]*\$?([\d.]+[BMTK]?)/i);
  if (mcapMatch) details.marketCap = `$${mcapMatch[1]}`;
  const betaMatch = md.match(/Beta\s*[:\s]*([\d.]+)/i);
  if (betaMatch) details.beta = betaMatch[1];
  const volMatch = md.match(/Volume\s*[:\s]*([\d,.]+[MK]?)/i);
  if (volMatch) details.volume = volMatch[1];
  const high52Match = md.match(/52.?Week High\s*[:\s]*\$?([\d,.]+)/i);
  const low52Match = md.match(/52.?Week Low\s*[:\s]*\$?([\d,.]+)/i);
  if (high52Match) details.high52w = `$${high52Match[1]}`;
  if (low52Match) details.low52w = `$${low52Match[1]}`;
  return details;
}
