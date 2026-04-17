import { Link } from "react-router-dom";
import { Facebook, Youtube } from "lucide-react";
import investarLogo from "@/assets/investar-logo.png";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-3">
              <img src={investarLogo} alt="InveStar Logo" className="h-12 w-auto" />
            </Link>
            <p className="text-muted-foreground text-sm">
              AI-powered wealth-tech platform for smart investing and portfolio management.
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="https://www.facebook.com/profile.php?id=100093283217125" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://www.youtube.com/@InveStarAI/shorts" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a 
                href="https://www.tiktok.com/@investarbd" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="TikTok"
              >
                <TikTokIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Markets
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link to="/virtual-trading" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Virtual Trading
                </Link>
              </li>
              <li>
                <Link to="/investar-ai" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  AI Coach
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Privacy & Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Contact</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:hello@investarbd.com" 
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  hello@investarbd.com
                </a>
              </li>
              <li className="text-muted-foreground text-sm">
                Hero City, 55 E 3rd Ave<br />
                San Mateo, CA 94401<br />
                USA
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © {currentYear} InveStar. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Investment involves risk. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
