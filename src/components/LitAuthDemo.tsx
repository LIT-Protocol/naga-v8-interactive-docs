/**
 * LitAuthDemo.tsx
 * 
 * Demonstration component showing how to use the useLitServiceSetup hook
 * and AuthModal for a complete Lit Protocol authentication experience.
 */

import React, { useState } from 'react';
import { useLitServiceSetup } from '../hooks/useLitServiceSetup';
import { AuthModal } from './AuthModal';
import { DisplayCode } from './DisplayCode';
import GreyBoarderWhiteBgContainer from './layout/GreyboardWhiteBgContainer';

export const LitAuthDemo: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    authContext: any;
    pkpInfo: any;
    method: string;
  } | null>(null);

  // Use the Lit service setup hook
  const {
    services,
    isInitializing,
    error: setupError,
    setupServices,
    clearServices,
    isReady
  } = useLitServiceSetup({
    appName: 'lit-auth-demo',
    networkName: 'naga-dev'
  });

  const handleAuthSuccess = (authContext: any, pkpInfo: any, method: string) => {
    console.log('🎉 Authentication successful!', { authContext, pkpInfo, method });
    setAuthenticatedUser({ authContext, pkpInfo, method });
  };

  const handleLogout = () => {
    setAuthenticatedUser(null);
    // Optionally clear services
    // clearServices();
  };

  const setupCode = `import { useLitServiceSetup } from '../hooks/useLitServiceSetup';
import { AuthModal } from '../components/AuthModal';

const MyApp = () => {
  const {
    services,
    isInitializing,
    error,
    setupServices,
    isReady
  } = useLitServiceSetup({
    appName: 'my-app',
    networkName: 'naga-dev'
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const handleAuthSuccess = (authContext, pkpInfo, method) => {
    console.log('Authentication successful!', { authContext, pkpInfo, method });
  };

  return (
    <div>
      {!isReady ? (
        <button onClick={setupServices} disabled={isInitializing}>
          {isInitializing ? 'Setting up...' : 'Setup Lit Protocol'}
        </button>
      ) : (
        <button onClick={() => setIsAuthModalOpen(true)}>
          🔐 Authenticate with Lit Protocol
        </button>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        litClient={services?.litClient}
        authManager={services?.authManager}
      />
    </div>
  );
};`;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>🚀 Lit Protocol Authentication Demo</h1>
      <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#666' }}>
        This demo shows how to use the <code>useLitServiceSetup</code> hook and <code>AuthModal</code> 
        component for a streamlined Lit Protocol authentication experience.
      </p>

      {/* Service Setup Section */}
      <GreyBoarderWhiteBgContainer>
        <h2>Step 1: Setup Lit Protocol Services</h2>
        <p>
          The <code>useLitServiceSetup</code> hook handles the initialization of Lit Client 
          and Auth Manager with proper configuration.
        </p>

        <div style={{ marginBottom: '20px' }}>
          <div style={{
            padding: '15px',
            backgroundColor: isReady ? '#d4edda' : setupError ? '#f8d7da' : '#fff3cd',
            border: `1px solid ${isReady ? '#c3e6cb' : setupError ? '#f5c6cb' : '#ffeaa7'}`,
            borderRadius: '6px',
            marginBottom: '15px'
          }}>
            <strong>Service Status:</strong>
            <br />
            {setupError ? (
              <span style={{ color: '#721c24' }}>❌ Error: {setupError}</span>
            ) : isReady ? (
              <span style={{ color: '#155724' }}>✅ Services ready for authentication</span>
            ) : (
              <span style={{ color: '#856404' }}>⏳ Services not initialized</span>
            )}
          </div>

          {!isReady && (
            <button
              onClick={setupServices}
              disabled={isInitializing}
              style={{
                padding: '12px 24px',
                backgroundColor: isInitializing ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isInitializing ? 'not-allowed' : 'pointer'
              }}
            >
              {isInitializing ? '⏳ Initializing Services...' : '🚀 Setup Lit Protocol'}
            </button>
          )}
        </div>

        <DisplayCode
          code={setupCode}
          language="typescript"
          theme="dracula"
        />
      </GreyBoarderWhiteBgContainer>

      {/* Authentication Section */}
      <GreyBoarderWhiteBgContainer>
        <h2>Step 2: Authenticate and Get PKP</h2>
        <p>
          Once services are ready, use the <code>AuthModal</code> to provide a unified 
          authentication experience across all supported methods.
        </p>

        {authenticatedUser ? (
          <div style={{
            padding: '20px',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>
              🎉 Authentication Successful!
            </h3>
            <div style={{ marginBottom: '10px' }}>
              <strong>Method:</strong> {authenticatedUser.method}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>PKP Public Key:</strong>
              <br />
              <code style={{ 
                fontSize: '12px', 
                wordBreak: 'break-all',
                backgroundColor: '#fff',
                padding: '5px',
                borderRadius: '3px'
              }}>
                {authenticatedUser.pkpInfo?.pubkey}
              </code>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              disabled={!isReady}
              style={{
                padding: '15px 30px',
                backgroundColor: !isReady ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: !isReady ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: '0 auto'
              }}
            >
              🔐 Authenticate with Lit Protocol
              {!isReady && ' (Setup required first)'}
            </button>
          </div>
        )}

        {/* Available Authentication Methods */}
        <div style={{
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '6px',
          marginTop: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Available Authentication Methods:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li><strong>🔵 Google:</strong> OAuth via Lit Login Server</li>
            <li><strong>🟣 Discord:</strong> OAuth via Lit Login Server</li>
            <li><strong>🟠 EOA Auth:</strong> Ethereum wallet with auth flow</li>
            <li><strong>🟡 EOA Native:</strong> Direct EOA management</li>
            <li><strong>⚙️ Custom Auth:</strong> dApp-centric authentication (Coming Soon)</li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* Benefits Section */}
      <GreyBoarderWhiteBgContainer>
        <h2>Benefits of This Approach</h2>
        <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div style={{
            padding: '15px',
            backgroundColor: '#e7f3ff',
            border: '1px solid #b3d9ff',
            borderRadius: '6px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>🎯 Unified Experience</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Single modal interface for all authentication methods
            </p>
          </div>
          
          <div style={{
            padding: '15px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '6px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>⚡ Easy Integration</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Simple hook-based setup with automatic service management
            </p>
          </div>
          
          <div style={{
            padding: '15px',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '6px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>🔧 Configurable</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Customizable app names, networks, and storage options
            </p>
          </div>
        </div>
      </GreyBoarderWhiteBgContainer>

      {/* AuthModal Component */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        litClient={services?.litClient}
        authManager={services?.authManager}
      />
    </div>
  );
}; 