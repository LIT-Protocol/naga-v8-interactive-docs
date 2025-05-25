/**
 * LitAuthProviderDemoTab.tsx
 * 
 * Demonstrates the LitAuthProvider modal pattern - shows a compact authentication modal
 * that can be closed with ESC and allows users to access the main app once authenticated.
 */

import React from 'react';
import { LitAuthProvider } from '../contexts/LitAuthProvider';
import { ProtectedApp } from '../components/ProtectedApp';
import { DisplayCode } from '../components/DisplayCode';
import GreyBoarderWhiteBgContainer from '../components/layout/GreyboardWhiteBgContainer';

const LitAuthProviderDemoTab: React.FC = () => {
  const usageCode = `import { LitAuthProvider, useLitAuth } from './contexts/LitAuthProvider';

function App() {
  return (
    <LitAuthProvider
      appName="my-awesome-app"
      networkName="naga-dev"
      autoSetup={true}
    >
      <MyApp />
    </LitAuthProvider>
  );
}

function MyApp() {
  const { user, logout, services, showAuthModal } = useLitAuth();
  
  if (!user) {
    return (
      <div>
        <h1>Welcome! Please authenticate to continue.</h1>
        <button onClick={showAuthModal}>Login</button>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Welcome {user.method} user!</h1>
      <p>PKP: {user.pkpInfo.pubkey}</p>
      <button onClick={logout}>Logout</button>
      {/* Your app content here */}
    </div>
  );
}`;

  const authMethodsCode = `// All implemented authentication methods
const authMethods = [
  // OAuth Methods (Direct)
  { id: 'google', name: 'Google', available: true },
  { id: 'discord', name: 'Discord', available: true }, 
  
  // Web3 Methods
  { id: 'eoa', name: 'Web3 Wallet', available: true },
  
  // WebAuthn/Passkey
  { id: 'webauthn', name: 'WebAuthn', available: true },
  
  // Stytch OTP Methods (Multi-step)
  { id: 'stytch-email', name: 'Email OTP', available: true },
  { id: 'stytch-sms', name: 'SMS OTP', available: true },
  { id: 'stytch-whatsapp', name: 'WhatsApp OTP', available: true },
  
  // Stytch 2FA
  { id: 'stytch-totp', name: 'Authenticator', available: true }
];

// The modal layout adapts to fit all methods:
// - Top 4 in a 2x2 grid (larger buttons)
// - Bottom 4 in a 4x1 grid (smaller buttons)`;

  return (
    <div className="tab-content">
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <h1>🚀 Lit Auth Provider - Modal Demo</h1>
        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#666', marginBottom: '30px' }}>
          This demonstrates the improved modal pattern for Lit Protocol authentication. 
          The authentication modal is compact, supports ESC key closing, and allows full app access once authenticated.
        </p>

        <GreyBoarderWhiteBgContainer>
          <h2>🆕 Key Improvements</h2>
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#065f46' }}>✨ Modal Pattern</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#047857' }}>
                No longer takes over the entire screen. Shows as a modal overlay that can be dismissed,
                allowing users to see their app content underneath.
              </p>
            </div>
            
            <div style={{
              padding: '20px',
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: '8px'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#92400e' }}>⌨️ ESC Key Support</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#a16207' }}>
                Press ESC to close the modal at any time. Click outside the modal 
                to dismiss it. Much more intuitive user experience.
              </p>
            </div>
            
            <div style={{
              padding: '20px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#0c4a6e' }}>📱 Compact Design</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#075985' }}>
                Optimized for adding more auth methods. Smaller buttons, tighter spacing,
                and cleaner layout accommodate future methods like Stytch, WebAuthn, etc.
              </p>
            </div>
          </div>
        </GreyBoarderWhiteBgContainer>

        <GreyBoarderWhiteBgContainer>
          <h2>Usage Example</h2>
          <DisplayCode
            code={usageCode}
            language="typescript"
            theme="dracula"
          />
        </GreyBoarderWhiteBgContainer>

        <GreyBoarderWhiteBgContainer>
          <h2>🔧 All Authentication Methods</h2>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            The compact modal now supports all major authentication methods with adaptive layouts and multi-step flows:
          </p>
          <DisplayCode
            code={authMethodsCode}
            language="typescript"
            theme="dracula"
          />
          
          <div style={{ marginTop: '20px', display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#3b82f6', fontSize: '16px' }}>🔵</span>
              <span><strong>Google OAuth</strong> - Direct authentication with popup</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#5865f2', fontSize: '16px' }}>🟣</span>
              <span><strong>Discord OAuth</strong> - Direct authentication with popup</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#f59e0b', fontSize: '16px' }}>🔗</span>
              <span><strong>Web3 Wallet</strong> - Private key or connected wallet</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#8b5cf6', fontSize: '16px' }}>🗝️</span>
              <span><strong>WebAuthn/Passkey</strong> - Register new or authenticate existing</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#ef4444', fontSize: '16px' }}>✉️</span>
              <span><strong>Email OTP</strong> - Send code → Verify → Create PKP</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10b981', fontSize: '16px' }}>📱</span>
              <span><strong>SMS OTP</strong> - Send code → Verify → Create PKP</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#06b6d4', fontSize: '16px' }}>💬</span>
              <span><strong>WhatsApp OTP</strong> - Send code → Verify → Create PKP</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#f97316', fontSize: '16px' }}>🔐</span>
              <span><strong>TOTP Authenticator</strong> - Use existing 2FA setup</span>
            </div>
          </div>
        </GreyBoarderWhiteBgContainer>

        <GreyBoarderWhiteBgContainer>
          <h2>Features</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#22c55e', fontSize: '20px' }}>✅</span>
              <div>
                <strong>Modal Authentication</strong>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  Shows as overlay modal instead of full-screen takeover
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#22c55e', fontSize: '20px' }}>✅</span>
              <div>
                <strong>ESC Key & Click Outside to Close</strong>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  Intuitive ways to dismiss the modal
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#22c55e', fontSize: '20px' }}>✅</span>
              <div>
                <strong>Auto-Close After Authentication</strong>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  Modal automatically closes once user successfully authenticates
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#22c55e', fontSize: '20px' }}>✅</span>
              <div>
                <strong>Compact & Extensible</strong>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  Optimized design ready for additional auth methods (Stytch, WebAuthn, etc.)
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#22c55e', fontSize: '20px' }}>✅</span>
              <div>
                <strong>Persistent Sessions</strong>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  Automatically saves and restores authentication state
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#22c55e', fontSize: '20px' }}>✅</span>
              <div>
                <strong>Programmatic Control</strong>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  Apps can trigger authentication modal via <code>showAuthModal()</code>
                </p>
              </div>
            </div>
          </div>
        </GreyBoarderWhiteBgContainer>

        <GreyBoarderWhiteBgContainer>
          <h2>🎯 Live Demo</h2>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Try the improved authentication experience! Notice how the modal appears over the content,
            can be closed with ESC, and automatically disappears after successful authentication.
          </p>
          
          <div style={{
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#ffffff'
          }}>
            <div style={{
              padding: '12px 20px',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              🖼️ Live Modal Authentication Demo
            </div>
            
            <div style={{ minHeight: '600px' }}>
              <LitAuthProvider
                appName="lit-auth-modal-demo"
                networkName="naga-dev"
                autoSetup={true}
                storageKey="lit-auth-modal-demo"
              >
                <ProtectedApp />
              </LitAuthProvider>
            </div>
          </div>
          
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fed7aa',
            borderRadius: '8px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#92400e' }}>💡 Try These Features</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#a16207' }}>
              <li>If not logged in, click "Connect to Lit Protocol" to open the modal</li>
              <li>Press ESC or click outside the modal to close it</li>
              <li>Choose an authentication method and complete the flow</li>
              <li>Notice how the modal closes automatically after authentication</li>
              <li>Use logout to return to the login state and test again</li>
            </ul>
          </div>
        </GreyBoarderWhiteBgContainer>
      </div>
    </div>
  );
};

export default LitAuthProviderDemoTab; 