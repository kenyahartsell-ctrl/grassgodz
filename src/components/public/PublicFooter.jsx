import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69e949497e5928c679297ebf/b2338f6dd_logo_transparent.png';

export default function PublicFooter() {
  return (
    <footer className="bg-foreground text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src={LOGO_URL} alt="Grassgodz" className="h-9 w-9 object-contain" />
              <span className="font-display font-bold text-lg">Grassgodz</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">Connecting homeowners with top-rated local lawn care pros.</p>
            <div className="flex items-center gap-3 mt-4">
              {/* Social icons — URLs to be filled in after launch */}
              <a href="#" className="text-white/40 hover:text-white transition-colors"><Instagram size={18} /></a>
              <a href="#" className="text-white/40 hover:text-white transition-colors"><Twitter size={18} /></a>
              <a href="#" className="text-white/40 hover:text-white transition-colors"><Facebook size={18} /></a>
            </div>
          </div>

          {/* Customers */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Customers</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How it Works</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Pros */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Pros</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/pros" className="hover:text-white transition-colors">Become a Pro</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Pro Login</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Pro Resources</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Weather Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cancellation Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center text-sm text-white/40">
          © {new Date().getFullYear()} Grassgodz. All rights reserved.
        </div>
      </div>
    </footer>
  );
}