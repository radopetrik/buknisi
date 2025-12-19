import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { logout } from "../auth/actions";

import { ReactNode } from "react";

export default function Header({ user, searchBar }: { user: User | null, searchBar?: ReactNode }) {
  const isHome = !searchBar;

  return (
    <header>
      <div className="header-inner">
        <Link className="logo" href="/">
          <img src="/logo_buknisi.png" alt="Bukni Si" />
        </Link>
        {searchBar ? (
          <div style={{ flex: 1, margin: '0 20px', display: 'flex', justifyContent: 'center' }}>
            {searchBar}
          </div>
        ) : null}
        <nav>
          {isHome && (
            <>
              <Link href="/cities">Preskúmať salóny</Link>
              <Link href="/stiahnut-app">Stiahnuť appku</Link>
              <Link href="/pre-firmy">Pre firmy</Link>
            </>
          )}
          {user ? (
            <>
               {isHome && <span>{user.email}</span>}
               <Link href="/profile" className="btn-ghost-sm" style={{marginRight: '8px'}}>
                  Profil
               </Link>
               <form action={logout}>
                 <button className="btn-ghost-sm" type="submit" style={{cursor: 'pointer'}}>
                   Odhlásiť sa
                 </button>
               </form>
            </>
          ) : (
            <>
              <Link className="btn-ghost-sm" href="/login">
                Prihlásiť sa
              </Link>
              {isHome && (
                <Link className="btn-primary-sm" href="/login?mode=register">
                  Registrácia
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
