import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://media.base44.com/images/public/69e949497e5928c679297ebf/b2338f6dd_logo_transparent.png';

export default function PublicNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={LOGO_URL} alt="Grassgodz" className="h-10 w-10 object-contain" />
          <span className="font-display font-bold text-xl text-foreground">Grassgodz</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it Works</Link>
          <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/become-provider" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">For Pros</Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => base44.auth.redirectToLogin(window.location.origin + '/redirect')}
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Sign In
          </button>
          <Link
            to="/signup/customer"
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-4 flex flex-col gap-3">
          <Link to="/how-it-works" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-foreground py-2">How it Works</Link>
          <Link to="/pricing" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-foreground py-2">Pricing</Link>
          <Link to="/become-provider" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-foreground py-2">For Pros</Link>
          <hr className="border-border" />
          <button onClick={() => { setMenuOpen(false); base44.auth.redirectToLogin(window.location.origin + '/redirect'); }} className="text-sm font-medium text-foreground py-2 text-left">Sign In</button>
          <Link
            to="/signup/customer"
            onClick={() => setMenuOpen(false)}
            className="w-full text-center bg-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}