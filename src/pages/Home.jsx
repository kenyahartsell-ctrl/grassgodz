import React from 'react';
import { useRole } from '@/lib/RoleContext';
import CustomerPortal from './CustomerPortal';
import ProviderPortal from './ProviderPortal';
import AdminPortal from './AdminPortal';

export default function Home() {
  const { role } = useRole();

  if (role === 'provider') return <ProviderPortal />;
  if (role === 'admin') return <AdminPortal />;
  return <CustomerPortal />;
}