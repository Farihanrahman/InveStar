import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, Bitcoin, Newspaper, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

interface ForexData {
  pair: string;
  rate: number;
  change: number;
}

interface NewsItem {
  title: string;
  source: string;
  time: string;
  category: string;
  thumbnail?: string;
  url?: string;
}

// Source logos mapping
const sourceLogos: Record<string, string> = {
  'CoinDesk': 'https://www.coindesk.com/resizer/kxONsppS2fTZJE6EVMuJpjoGdlU=/144x32/downloads.coindesk.com/arc/failsafe/feeds/coindesk-logo-white.png',
  'Bloomberg': 'https://assets.bwbx.io/s3/javelin/public/hub/images/BW-Logo-Black-cc4578fe32.svg',
  'Reuters': 'https://www.reuters.com/pf/resources/images/reuters/logo-vertical-default.svg',
  'TechCrunch': 'https://techcrunch.com/wp-content/uploads/2018/04/tc-logo-2018-square-reverse.png',
  'WSJ': 'https://s.wsj.net/img/meta/wsj-social-share.png',
  'CNBC': 'https://sc.cnbcfm.com/applications/cnbc.com/staticcontent/img/cnbc-logo-og.png',
  'Financial Times': 'https://www.ft.com/__origami/service/image/v2/images/raw/ftlogo-v1%3Abrand-ft-logo-square-coloured?source=update-logos&format=svg',
  'The Verge': 'https://cdn.vox-cdn.com/uploads/chorus_asset/file/7395351/android-chrome-192x192.0.png',
};

// Category colors
const categoryColors: Record<string, { bg: string; text: string }> = {
  'Crypto': { bg: 'bg-orange-500/20', text: 'text-orange-500' },
  'Markets': { bg: 'bg-blue-500/20', text: 'text-blue-500' },
  'Economy': { bg: 'bg-green-500/20', text: 'text-green-500' },
  'Tech': { bg: 'bg-purple-500/20', text: 'text-purple-500' },
  'Stocks': { bg: 'bg-emerald-500/20', text: 'text-emerald-500' },
  'EV': { bg: 'bg-cyan-500/20', text: 'text-cyan-500' },
  'Regulation': { bg: 'bg-amber-500/20', text: 'text-amber-500' },
  'Cloud': { bg: 'bg-indigo-500/20', text: 'text-indigo-500' },
  'Forex': { bg: 'bg-teal-500/20', text: 'text-teal-500' },
  'Commodities': { bg: 'bg-yellow-500/20', text: 'text-yellow-500' },
};

// Source URLs for linking
const sourceUrls: Record<string, string> = {
  'CoinDesk': 'https://www.coindesk.com/markets',
  'Bloomberg': 'https://www.bloomberg.com/markets',
  'Reuters': 'https://www.reuters.com/business/finance',
  'TechCrunch': 'https://techcrunch.com/category/fintech',
  'WSJ': 'https://www.wsj.com/news/markets',
  'CNBC': 'https://www.cnbc.com/markets',
  'Financial Times': 'https://www.ft.com/markets',
  'The Verge': 'https://www.theverge.com/tech',
  'CryptoNews': 'https://cryptonews.com',
};

const MarketDataPanel = () => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [forexData, setForexData] = useState<ForexData[]>([]);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [crypto, forex, news] = await Promise.all([
          supabase.functions.invoke('fetch-market-data', { body: { type: 'crypto' } }),
          supabase.functions.invoke('fetch-market-data', { body: { type: 'forex' } }),
          supabase.functions.invoke('fetch-market-data', { body: { type: 'news' } }),
        ]);

        if (crypto.data?.data) setCryptoData(crypto.data.data);
        if (forex.data?.data) setForexData(forex.data.data);
        if (news.data?.data) setNewsData(news.data.data);
      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number | undefined, decimals = 2) => {
    if (price === undefined || price === null || isNaN(price)) {
      return 'N/A';
    }
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    });
  };

  const formatChange = (change: number | undefined) => {
    if (change === undefined || change === null || isNaN(change)) {
      return <span className="text-muted-foreground text-xs">N/A</span>;
    }
    const isPositive = change >= 0;
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(change).toFixed(2)}%
      </span>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading market data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Live Market Data</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="crypto" className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="crypto" className="flex-1">
              <Bitcoin className="w-4 h-4 mr-1" />
              Crypto
            </TabsTrigger>
            <TabsTrigger value="forex" className="flex-1">
              <DollarSign className="w-4 h-4 mr-1" />
              Forex
            </TabsTrigger>
            <TabsTrigger value="news" className="flex-1">
              <Newspaper className="w-4 h-4 mr-1" />
              News
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[400px]">
            <TabsContent value="crypto" className="m-0 p-4 space-y-3">
              {cryptoData.map((crypto) => (
                <div key={crypto.symbol} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">{crypto.name}</p>
                    <p className="text-xs text-muted-foreground">{crypto.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${formatPrice(crypto.price)}</p>
                    {formatChange(crypto.change)}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="forex" className="m-0 p-4 space-y-3">
              {forexData.map((fx) => (
                <div key={fx.pair} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">{fx.pair}</p>
                    <p className="text-xs text-muted-foreground">Exchange Rate</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(fx.rate, 4)}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="news" className="m-0 p-3 space-y-2">
              {newsData.map((news, index) => {
                const colors = categoryColors[news.category] || { bg: 'bg-primary/10', text: 'text-primary' };
                const logoUrl = sourceLogos[news.source];
                const newsUrl = news.url || sourceUrls[news.source] || '#';
                
                return (
                  <a 
                    key={index}
                    href={newsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/60 hover:from-muted/50 hover:to-muted/80 transition-all duration-300 hover:shadow-lg hover:border-primary/30 cursor-pointer"
                  >
                    <div className="flex gap-3 p-3">
                      {/* Thumbnail/Logo Section */}
                      <div className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-border/30">
                        {logoUrl ? (
                          <img 
                            src={logoUrl} 
                            alt={news.source}
                            className="w-10 h-10 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`${logoUrl ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                          <Newspaper className="w-6 h-6 text-primary/60" />
                        </div>
                      </div>
                      
                      {/* Content Section */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <p className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {news.title}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                            {news.category}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">{news.source}</span>
                          <span className="text-xs text-muted-foreground/60">•</span>
                          <span className="text-xs text-muted-foreground/60">{news.time}</span>
                        </div>
                      </div>
                      
                      {/* External link indicator */}
                      <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    {/* Hover accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                );
              })}
              
              {newsData.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Newspaper className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">No news available</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MarketDataPanel;
