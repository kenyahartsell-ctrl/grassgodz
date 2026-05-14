import { Toaster } from "@/components/ui/toaster"
import { HelmetProvider } from 'react-helmet-async';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Toaster as Sonner } from 'sonner';

import JobDetailPage from '@/pages/JobDetailPage';
import ProSchedulePage from '@/pages/ProSchedulePage';
import MyQuotesPage from '@/pages/MyQuotesPage';

// Portals
import CustomerPortal from '@/pages/CustomerPortal';
import ProviderPortal from '@/pages/ProviderPortal';
import AdminPortal from '@/pages/AdminPortal';
import SmartRedirect from '@/pages/SmartRedirect';

// Public pages
import HomePage from '@/pages/HomePage';
import ProsLandingPage from '@/pages/ProsLandingPage';
import HowItWorksPage from '@/pages/HowItWorksPage';
import PricingPage from '@/pages/PricingPage';
import CustomerSignupPage from '@/pages/CustomerSignupPage';
import ProviderSignupPage from '@/pages/ProviderSignupPage';
import BecomeProviderPage from '@/pages/BecomeProviderPage';
import NotAvailablePage from '@/pages/NotAvailablePage';
import ProviderPendingPage from '@/pages/ProviderPendingPage';
import ProviderSuspendedPage from '@/pages/ProviderSuspendedPage';
import BookingPage from '@/pages/BookingPage';
import ProviderLinksPage from '@/pages/ProviderLinksPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import ProviderOnboardingPage from '@/pages/ProviderOnboardingPage';
import ProviderFinancialsPage from '@/pages/ProviderFinancialsPage';
import WashingtonDCPage from '@/pages/city/WashingtonDCPage';
import ArlingtonVAPage from '@/pages/city/ArlingtonVAPage';
import AlexandriaVAPage from '@/pages/city/AlexandriaVAPage';
import SilverSpringMDPage from '@/pages/city/SilverSpringMDPage';
import BethesdaMDPage from '@/pages/city/BethesdaMDPage';

function CustomerApp() {
  return <CustomerPortal />;
}

function ProviderApp() {
  return <ProviderPortal />;
}

function AdminApp() {
  return <AdminPortal />;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Allow public routes to render without redirecting to login
      const publicPaths = ['/', '/pros', '/how-it-works', '/pricing', '/book', '/signup', '/signup/customer', '/signup/provider', '/become-provider', '/not-available', '/privacy', '/provider-links'];
      const currentPath = window.location.pathname;
      const isPublicPath = publicPaths.includes(currentPath) || currentPath.startsWith('/jobs/');
      if (!isPublicPath) {
        navigateToLogin();
        return null;
      }
    }
  }

  return (
    <Routes>
      {/* Post-login smart redirect — determines portal based on role/profile */}
      <Route path="/redirect" element={<SmartRedirect />} />

      {/* Role-specific portals */}
      <Route path="/customer/*" element={<CustomerApp />} />
      <Route path="/provider/pending" element={<ProviderPendingPage />} />
      <Route path="/pros/schedule" element={<ProSchedulePage />} />
      <Route path="/quotes" element={<MyQuotesPage />} />
      <Route path="/provider/suspended" element={<ProviderSuspendedPage />} />
      <Route path="/provider/*" element={<ProviderApp />} />
      <Route path="/admin/*" element={<AdminApp />} />

      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/pros" element={<ProsLandingPage />} />
      <Route path="/become-provider" element={<BecomeProviderPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/book" element={<BookingPage />} />
      <Route path="/signup/customer" element={<CustomerSignupPage />} />
      <Route path="/signup" element={<CustomerSignupPage />} />
      <Route path="/signup/provider" element={<ProviderSignupPage />} />
      <Route path="/not-available" element={<NotAvailablePage />} />
      <Route path="/jobs/:jobId" element={<JobDetailPage />} />
      <Route path="/provider-links" element={<ProviderLinksPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/provider/financials" element={<ProviderFinancialsPage />} />
      <Route path="/provider/onboarding" element={<ProviderOnboardingPage />} />

      {/* City SEO landing pages */}
      <Route path="/lawn-care/washington-dc" element={<WashingtonDCPage />} />
      <Route path="/lawn-care/arlington-va" element={<ArlingtonVAPage />} />
      <Route path="/lawn-care/alexandria-va" element={<AlexandriaVAPage />} />
      <Route path="/lawn-care/silver-spring-md" element={<SilverSpringMDPage />} />
      <Route path="/lawn-care/bethesda-md" element={<BethesdaMDPage />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
          <Sonner richColors position="top-center" />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
    </HelmetProvider>
  );
}

export default App;