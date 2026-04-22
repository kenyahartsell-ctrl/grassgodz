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
      <Route path="/" element={<MarketplaceApp />} />
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