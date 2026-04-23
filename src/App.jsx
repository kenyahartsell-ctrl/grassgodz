import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useState } from 'react';
import CustomerPortal from '@/pages/CustomerPortal';
import ProviderPortal from '@/pages/ProviderPortal';
import AdminPortal from '@/pages/AdminPortal';
import RoleSwitcher from '@/components/RoleSwitcher';
import { Toaster as Sonner } from 'sonner';
import { MOCK_REVIEWS } from '@/lib/mockData';

// Public pages
import HomePage from '@/pages/HomePage';
import ProsLandingPage from '@/pages/ProsLandingPage';
import HowItWorksPage from '@/pages/HowItWorksPage';
import PricingPage from '@/pages/PricingPage';
import CustomerSignupPage from '@/pages/CustomerSignupPage';
import ProviderSignupPage from '@/pages/ProviderSignupPage';
import NotAvailablePage from '@/pages/NotAvailablePage';
import ProviderPendingPage from '@/pages/ProviderPendingPage';
import ProviderSuspendedPage from '@/pages/ProviderSuspendedPage';

function MarketplaceApp() {
  const [role, setRole] = useState('customer');
  const [reviews, setReviews] = useState(MOCK_REVIEWS);

  const handleNewReview = (review) => {
    setReviews(prev => [{ ...review, id: `r_${Date.now()}`, created_at: new Date().toISOString() }, ...prev]);
  };

  return (
    <div className="relative">
      <RoleSwitcher currentRole={role} onRoleChange={setRole} />
      {role === 'customer' && <CustomerPortal reviews={reviews} onReviewSubmit={handleNewReview} />}
      {role === 'provider' && <ProviderPortal reviews={reviews} />}
      {role === 'admin' && <AdminPortal reviews={reviews} />}
    </div>
  );
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
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Protected app routes */}
      <Route path="/app" element={<MarketplaceApp />} />
      <Route path="/customer/*" element={<MarketplaceApp />} />
      <Route path="/provider/pending" element={<ProviderPendingPage />} />
      <Route path="/provider/suspended" element={<ProviderSuspendedPage />} />
      <Route path="/provider/*" element={<MarketplaceApp />} />
      <Route path="/admin/*" element={<MarketplaceApp />} />

      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/pros" element={<ProsLandingPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/signup/customer" element={<CustomerSignupPage />} />
      <Route path="/signup/provider" element={<ProviderSignupPage />} />
      <Route path="/not-available" element={<NotAvailablePage />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
          <Sonner richColors position="top-center" />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;