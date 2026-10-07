import { useState } from 'react';
import { store, type PartnerAccount } from './store';
import { Login } from './pages/Login';
import { Home } from './pages/Home';

export function App() {
  const [account, setAccount] = useState<PartnerAccount | null>(() => store.current());

  if (!account) return <Login onLogin={setAccount} />;
  return (
    <Home
      partner={account}
      onLogout={() => {
        store.logout();
        setAccount(null);
      }}
    />
  );
}
