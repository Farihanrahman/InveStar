import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching latest financial and tech news...');

    // News items with thumbnail images
    const newsItems = [
      {
        title: "Bitcoin reaches new all-time high as institutional adoption grows",
        url: "https://www.coindesk.com",
        source: "CoinDesk",
        thumbnail: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=120&h=80&fit=crop"
      },
      {
        title: "Tech stocks rally on strong earnings reports from major companies",
        url: "https://www.bloomberg.com",
        source: "Bloomberg",
        thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=120&h=80&fit=crop"
      },
      {
        title: "Federal Reserve signals potential interest rate changes",
        url: "https://www.reuters.com",
        source: "Reuters",
        thumbnail: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=120&h=80&fit=crop"
      },
      {
        title: "AI startups attract record venture capital funding",
        url: "https://techcrunch.com",
        source: "TechCrunch",
        thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=120&h=80&fit=crop"
      },
      {
        title: "Global markets show resilience amid economic uncertainty",
        url: "https://www.wsj.com",
        source: "WSJ",
        thumbnail: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=120&h=80&fit=crop"
      },
      {
        title: "Electric vehicle sector sees major investment surge",
        url: "https://www.cnbc.com",
        source: "CNBC",
        thumbnail: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=120&h=80&fit=crop"
      },
      {
        title: "Cryptocurrency regulations evolve across major economies",
        url: "https://www.ft.com",
        source: "Financial Times",
        thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=120&h=80&fit=crop"
      },
      {
        title: "Cloud computing giants announce infrastructure expansion",
        url: "https://www.theverge.com",
        source: "The Verge",
        thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120&h=80&fit=crop"
      }
    ];

    // Shuffle and return a selection of news items
    const shuffled = newsItems.sort(() => 0.5 - Math.random());
    const selectedNews = shuffled.slice(0, 6);

    console.log(`Returning ${selectedNews.length} news items with thumbnails`);

    return new Response(
      JSON.stringify({ news: selectedNews }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in fetch-news function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
