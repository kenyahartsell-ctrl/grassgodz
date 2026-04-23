import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Toaster as Sonner } from 'sonner';

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
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Post-login smart redirect — determines portal based on role/profile */}
      <Route path="/redirect" element={<SmartRedirect />} />

      {/* Role-specific portals */}
      <Route path="/customer/*" element={<CustomerApp />} />
      <Route path="/provider/pending" element={<ProviderPendingPage />} />
      <Route path="/provider/suspended" element={<ProviderSuspendedPage />} />
      <Route path="/provider/*" element={<ProviderApp />} />
      <Route path="/admin/*" element={<AdminApp />} />

      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/pros" element={<ProsLandingPage />} />
      <Route path="/become-provider" element={<BecomeProviderPage />} />
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