/**
 * LitAuthDemoTab.tsx
 * 
 * Tab wrapper for the LitAuthDemo component.
 * Demonstrates the unified authentication experience using useLitServiceSetup hook and AuthModal.
 */

import React from 'react';
import { LitAuthDemo } from '../components/LitAuthDemo';

const LitAuthDemoTab: React.FC = () => {
  return (
    <div className="tab-content">
      <LitAuthDemo />
    </div>
  );
};

export default LitAuthDemoTab; 