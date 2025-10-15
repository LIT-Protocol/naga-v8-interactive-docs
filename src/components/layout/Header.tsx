import { Link } from "react-router-dom";
import { WalletButton } from "../common/WalletButton";
import { APP_INFO, FEATURES } from "../../_config";
import { useEffect, useState } from "react";

export const Header = () => {
  const [networkName, setNetworkName] = useState<string>(APP_INFO.network);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("lit-network-name");
      if (saved) setNetworkName(saved);
    } catch {}
  }, []);

  const handleNetworkChange = (value: string) => {
    setNetworkName(value);
    try {
      window.localStorage.setItem("lit-network-name", value);
      // Soft reload to reinitialise Lit client with new network in this demo app
      window.location.reload();
    } catch {}
  };

  return (
    <header className="header">
      <nav>
        <Link to="/" className="logo">
          {FEATURES.enableFlameAnimation && <span className="flame-icon">🔥</span>} {APP_INFO.name}
        </Link>
        <div className="nav-links">
          {/* {NAVIGATION.main.map((link) => (
            <Link key={link.path} to={link.path}>
              {link.name}
            </Link>
          ))} */}
        </div>
      </nav>
      <div className="header-controls" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <label style={{ fontSize: 12, color: '#555' }}>Lit Network:</label>
        <select
          value={networkName}
          onChange={(e) => handleNetworkChange(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd' }}
        >
          <option value="naga-dev">naga-dev</option>
          <option value="naga-test">naga-test</option>
        </select>
      </div>
    </header>
  );
};
