'use client'

import { usePathname } from 'next/navigation';
import Navigation from '@/components/navbar';

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  if (isLandingPage) {
    return <>{children}</>;
  }

  return <Navigation>{children}</Navigation>;
}