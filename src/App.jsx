import { Toaster } from "@/components/ui/toaster"
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from '@/lib/LanguageContext';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Toaster as Sonner } from 'sonner';

import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

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
import CustomerSignInPage from '@/pages/CustomerSignInPage';
import WashingtonDCPage from '@/pages/city/WashingtonDCPage';
import SitemapPage from '@/pages/SitemapPage';
import RobotsPage from '@/pages/RobotsPage';
import LlmsPage from '@/pages/LlmsPage';
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
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth routes — public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public / marketing routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/pros" element={<ProsLandingPage />} />
      <Route path="/become-provider" element={<BecomeProviderPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/book" element={<BookingPage />} />
      <Route path="/signup/customer" element={<CustomerSignupPage />} />
      <Route path="/signin/customer" element={<CustomerSignInPage />} />
      <Route path="/signup" element={<CustomerSignupPage />} />
      <Route path="/signup/provider" element={<ProviderSignupPage />} />
      <Route path="/not-available" element={<NotAvailablePage />} />
      <Route path="/jobs/:jobId" element={<JobDetailPage />} />
      <Route path="/provider-links" element={<ProviderLinksPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />

      {/* City SEO landing pages */}
      <Route path="/lawn-care/washington-dc" element={<WashingtonDCPage />} />
      <Route path="/lawn-care/arlington-va" element={<ArlingtonVAPage />} />
      <Route path="/lawn-care/alexandria-va" element={<AlexandriaVAPage />} />
      <Route path="/lawn-care/silver-spring-md" element={<SilverSpringMDPage />} />
      <Route path="/lawn-care/bethesda-md" element={<BethesdaMDPage />} />

      {/* SEO / crawler files */}
      <Route path="/sitemap.xml" element={<SitemapPage />} />
      <Route path="/robots.txt" element={<RobotsPage />} />
      <Route path="/llms.txt" element={<LlmsPage />} />

      {/* Protected app routes — redirect to /login if unauthenticated */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/redirect" element={<SmartRedirect />} />
        <Route path="/customer/*" element={<CustomerApp />} />
        <Route path="/provider/pending" element={<ProviderPendingPage />} />
        <Route path="/provider/suspended" element={<ProviderSuspendedPage />} />
        <Route path="/provider/onboarding" element={<ProviderOnboardingPage />} />
        <Route path="/provider/financials" element={<ProviderFinancialsPage />} />
        <Route path="/pros/schedule" element={<ProSchedulePage />} />
        <Route path="/quotes" element={<MyQuotesPage />} />
        <Route path="/provider" element={<ProviderApp />} />
        <Route path="/provider/*" element={<ProviderApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
      <LanguageProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
          <Sonner richColors position="top-center" />
        </Router>
        <Toaster />
      </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
    </HelmetProvider>
  );
}

export default App;