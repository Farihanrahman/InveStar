import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Newspaper, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NewsItem {
  title: string;
  url: string;
  source: string;
  thumbnail?: string;
}

const NewsTicker = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-news');
        
        if (error) throw error;
        
        if (data?.news) {
          setNews(data.news);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  useEffect(() => {
    if (news.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [news.length]);

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/10">
        <div className="p-4 flex items-center gap-3">
          <Newspaper className="w-5 h-5 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading latest news...</p>
        </div>
      </Card>
    );
  }

  if (news.length === 0) {
    return null;
  }

  const currentNews = news[currentIndex];

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-primary/20 overflow-hidden shadow-lg">
      <div className="p-4 md:p-6 flex items-center gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden bg-muted">
          {currentNews.thumbnail && !imageError[currentIndex] ? (
            <img 
              src={currentNews.thumbnail} 
              alt={currentNews.title}
              className="w-full h-full object-cover"
              onError={() => handleImageError(currentIndex)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Newspaper className="w-6 h-6 text-primary" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <a
            href={currentNews.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-primary transition-colors group"
          >
            <span className="text-sm md:text-base font-semibold line-clamp-2 leading-tight">
              {currentNews.title}
            </span>
            <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200" />
          </a>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
              {currentNews.source}
            </span>
          </div>
        </div>

        <div className="hidden sm:flex gap-1.5 flex-shrink-0">
          {news.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-primary w-6' : 'bg-muted hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to news ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};

export default NewsTicker;
