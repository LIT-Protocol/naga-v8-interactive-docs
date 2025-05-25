/**
 * ProtectedApp.tsx
 * 
 * Example app component that demonstrates how to use the LitAuthProvider
 * and access authentication context for PKP signing operations.
 */

import React, { useState } from 'react';
import { useLitAuth } from '../contexts/LitAuthProvider';

export const ProtectedApp: React.FC = () => {
  const { user, logout, services, isAuthenticated, showAuthModal } = useLitAuth();
  const [message, setMessage] = useState('Hello from my authenticated PKP!');
  const [signature, setSignature] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const handleSign = async () => {
    if (!user || !services) return;

    try {
      setIsSigning(true);
      setSignature(null);

      const sig = await services.litClient.chain.ethereum.pkpSign({
        pubKey: user.pkpInfo.pubkey,
        toSign: message,
        authContext: user.authContext,
      });

      setSignature(sig.signature);
      console.log('✅ Message signed successfully:', sig);
    } catch (error) {
      console.error('❌ Signing failed:', error);
      alert(`Signing failed: ${error}`);
    } finally {
      setIsSigning(false);
    }
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '48px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '32px' }}>
            🔐 Authentication Required
          </h1>
          <p style={{ margin: '0 0 32px 0', color: '#6b7280', fontSize: '16px', lineHeight: '1.5' }}>
            Please authenticate with Lit Protocol to access your PKP wallet and signing capabilities.
          </p>
          <button
            onClick={showAuthModal}
            style={{
              padding: '16px 32px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            🚀 Connect to Lit Protocol
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '20px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#111827', fontSize: '28px' }}>
              🎉 Welcome to Your Lit-Powered App!
            </h1>
            <p style={{ margin: '8px 0 0 0', color: '#6b7280' }}>
              You're authenticated with <strong>{user?.method}</strong>
            </p>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>

        {/* PKP Info */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '32px'
        }}>
          <h2 style={{ margin: '0 0 16px 0', color: '#0c4a6e', fontSize: '20px' }}>
            🔑 Your PKP Information
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Public Key:
              </span>
              <br />
              <code style={{
                fontSize: '12px',
                backgroundColor: '#ffffff',
                padding: '8px',
                borderRadius: '4px',
                wordBreak: 'break-all',
                display: 'block',
                marginTop: '4px'
              }}>
                {user?.pkpInfo?.pubkey}
              </code>
            </div>
            {user?.pkpInfo?.tokenId && (
              <div>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Token ID:
                </span>
                <br />
                <code style={{
                  fontSize: '12px',
                  backgroundColor: '#ffffff',
                  padding: '8px',
                  borderRadius: '4px',
                  wordBreak: 'break-all',
                  display: 'block',
                  marginTop: '4px'
                }}>
                  {user.pkpInfo.tokenId}
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Signing Demo */}
        <div style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <h2 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '20px' }}>
            ✍️ Sign a Message with Your PKP
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
            Test your PKP by signing a custom message. This demonstrates the cryptographic 
            capabilities of your Lit-powered wallet.
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Message to sign:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
              placeholder="Enter your message here..."
            />
          </div>

          <button
            onClick={handleSign}
            disabled={isSigning || !message.trim()}
            style={{
              padding: '12px 24px',
              backgroundColor: isSigning || !message.trim() ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isSigning || !message.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isSigning && (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff40',
                borderTop: '2px solid #ffffff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            {isSigning ? 'Signing...' : '✍️ Sign Message'}
          </button>

          {signature && (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '6px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#065f46', fontSize: '16px' }}>
                ✅ Signature Generated Successfully!
              </h4>
              <div style={{ fontSize: '12px', color: '#047857' }}>
                <strong>Signature:</strong>
                <code style={{
                  display: 'block',
                  backgroundColor: '#ffffff',
                  padding: '8px',
                  borderRadius: '4px',
                  marginTop: '4px',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace'
                }}>
                  {signature}
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Features List */}
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fed7aa',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h2 style={{ margin: '0 0 16px 0', color: '#92400e', fontSize: '20px' }}>
            🚀 What You Can Do Now
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#065f46', fontSize: '16px' }}>✅</span>
              <span style={{ color: '#92400e' }}>Sign messages and transactions with your PKP</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#065f46', fontSize: '16px' }}>✅</span>
              <span style={{ color: '#92400e' }}>Execute Lit Actions with your authentication context</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#065f46', fontSize: '16px' }}>✅</span>
              <span style={{ color: '#92400e' }}>Build decentralized applications without seed phrases</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#065f46', fontSize: '16px' }}>✅</span>
              <span style={{ color: '#92400e' }}>Leverage programmable MPC wallet capabilities</span>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <details style={{ marginTop: '32px' }}>
          <summary style={{
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#6b7280',
            padding: '8px 0'
          }}>
            🔍 Debug Information (Click to expand)
          </summary>
          <div style={{
            marginTop: '12px',
            padding: '16px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify({
                authMethod: user?.method,
                pkpPublicKey: user?.pkpInfo?.pubkey,
                tokenId: user?.pkpInfo?.tokenId,
                authContextKeys: user?.authContext ? Object.keys(user.authContext) : [],
                servicesReady: !!services?.litClient && !!services?.authManager,
                timestamp: user?.timestamp ? new Date(user.timestamp).toISOString() : null
              }, null, 2)}
            </pre>
          </div>
        </details>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}; 