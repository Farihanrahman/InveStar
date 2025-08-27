import React from 'react';
import { Globe, Mail, Phone, MapPin, Twitter, Linkedin, Github, Facebook, Instagram } from 'lucide-react';

const footerLinks = {
  company: [
    { name: 'About Us', href: '#about' },
    { name: 'Our Team', href: '#team' },
    { name: 'Careers', href: '#careers' },
    { name: 'Press', href: '#press' },
    { name: 'Blog', href: '#blog' }
  ],
  services: [
    { name: 'Digital Wallet', href: '#wallet' },
    { name: 'Money Transfer', href: '#transfer' },
    { name: 'FX Rates', href: '#fx-rates' },
    { name: 'API Access', href: '#api' },
    { name: 'Enterprise', href: '#enterprise' }
  ],
  support: [
    { name: 'Help Center', href: '#help' },
    { name: 'Documentation', href: '#docs' },
    { name: 'Contact Support', href: '#contact' },
    { name: 'Status Page', href: '#status' },
    { name: 'Community', href: '#community' }
  ],
  legal: [
    { name: 'Privacy Policy', href: '#privacy' },
    { name: 'Terms of Service', href: '#terms' },
    { name: 'Cookie Policy', href: '#cookies' },
    { name: 'GDPR', href: '#gdpr' },
    { name: 'Compliance', href: '#compliance' }
  ]
};

const socialLinks = [
  { name: 'Twitter', href: 'https://twitter.com/investar', icon: Twitter },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/investar', icon: Linkedin },
  { name: 'GitHub', href: 'https://github.com/investar', icon: Github },
  { name: 'Facebook', href: 'https://facebook.com/investar', icon: Facebook },
  { name: 'Instagram', href: 'https://instagram.com/investar', icon: Instagram }
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">InveStar</span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Transforming global finance with Stellar blockchain technology. 
              Send money worldwide with competitive rates and bank-level security.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-400">
                <Mail className="w-4 h-4" />
                <span>support@investarbd.com</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <Phone className="w-4 h-4" />
                <span>+1-800-INVESTAR</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>Dhaka, Bangladesh</span>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} InveStar. All rights reserved.
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center space-x-6 mt-8 pt-8 border-t border-gray-800">
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>PCI DSS Level 1</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Stellar Foundation Partner</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}