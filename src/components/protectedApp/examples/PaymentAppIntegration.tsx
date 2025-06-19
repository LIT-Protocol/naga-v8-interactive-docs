/**
 * PaymentAppIntegration Example
 * 
 * Shows how to integrate the PaymentAppComplete into different contexts
 */

import React from 'react';
import PaymentAppComplete from './PaymentAppComplete';

// Example 1: Standalone Payment App
export const StandalonePaymentApp = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <PaymentAppComplete />
    </div>
  );
};

// Example 2: Embedded Payment Widget
export const EmbeddedPaymentWidget = () => {
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Integrated Payment System
      </h2>
      <PaymentAppComplete />
    </div>
  );
};

// Example 3: Conditional Payment App
export const ConditionalPaymentApp = ({ showPayments = true }) => {
  if (!showPayments) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Payment Features Coming Soon</h2>
        <p>This application will include secure PKP payments.</p>
      </div>
    );
  }

  return <PaymentAppComplete />;
};

// Example 4: Custom Branded Payment App
export const CustomBrandedPaymentApp = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '20px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '10px'
          }}>
            Your Brand Payment System
          </h1>
          <p style={{ color: '#666', fontSize: '18px' }}>
            Powered by Lit Protocol's Secure PKP Technology
          </p>
        </div>
        
        <PaymentAppComplete />
      </div>
    </div>
  );
};

export default {
  StandalonePaymentApp,
  EmbeddedPaymentWidget,
  ConditionalPaymentApp,
  CustomBrandedPaymentApp
};