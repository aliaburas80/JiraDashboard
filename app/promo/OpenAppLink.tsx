// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { getCachedUser, fetchCurrentUser, type CurrentUser } from '@/lib/currentUser';

interface Props {
  className?: string;
  children: ReactNode;
}

// A signed-in visitor clicking "Open the app" from the public marketing page
// must land on their dashboard, not be sent back through /login.
//
// /promo is statically prerendered (no per-request server auth check), so the
// server-rendered HTML always has href="/login" baked in. Seeding useState
// synchronously from getCachedUser() (the pattern UserMenu uses) would make
// the client's first hydration pass compute a different href than that SSR
// HTML — a hydration mismatch React does not reliably patch for attributes.
// Starting identical to SSR and correcting via a state update in an effect
// (a genuine post-mount re-render, not a hydration patch) avoids that.
export default function OpenAppLink({ className, children }: Props) {
  const [me, setMe] = useState<CurrentUser | null>(null);

  useEffect(() => {
    setMe(getCachedUser());
    fetchCurrentUser().then(setMe);
  }, []);

  return (
    <a className={className} href={me ? '/dashboard' : '/login'}>
      {children}
    </a>
  );
}
