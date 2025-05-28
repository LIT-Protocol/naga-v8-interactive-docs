# ProtectedApp Module

This directory contains the refactored and organised components from the large `ProtectedApp.tsx` file. The goal is to break down the 4,700+ line monolithic component into smaller, maintainable pieces.

## 🏗️ **Architecture Overview**

```
src/components/protectedApp/
├── components/           # Reusable UI and feature components
│   ├── permissions/     # Permission management components
│   ├── pkp/            # PKP wallet related components  
│   ├── ui/             # Basic UI components (buttons, spinners, etc.)
│   └── wallet/         # Wallet operations components
├── contexts/           # React contexts for state management
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
└── utils/             # Utility functions and constants
```

## 🚀 **Key Improvements**

### 1. **PKP Permissions Context** 
- **Problem Solved**: Repeated `getPKPPermissionsManager` initialization
- **Solution**: Centralised context with caching mechanism
- **Location**: `contexts/PKPPermissionsContext.tsx`

### 2. **Reusable UI Components**
- `LoadingSpinner` - Consistent loading states
- `RemoveButton` - Standardised remove buttons with spinners
- `TransactionToastContainer` - Transaction notifications

### 3. **Type Safety & Organisation**
- All types centralised in `types/index.ts`
- Utility functions in `utils/index.ts`
- Chain configurations in `utils/chains.ts`

## 📦 **Usage Examples**

### Using the PKP Permissions Context
```tsx
import { PKPPermissionsProvider, usePKPPermissions } from './protectedApp';

// Wrap your component
<PKPPermissionsProvider selectedPkp={selectedPkp} setStatus={setStatus} addTransactionToast={addTransactionToast}>
  <YourComponent />
</PKPPermissionsProvider>

// Use the context
const { addPermittedAction, removePermittedAction, permissionsContext } = usePKPPermissions();
```

### Using UI Components
```tsx
import { LoadingSpinner, RemoveButton, TransactionToastContainer } from './protectedApp';

<RemoveButton 
  onRemove={() => removeItem(id)}
  isRemoving={removingItems.has(id)}
  itemId={id}
/>
```

### Using PKP Components
```tsx
import { PKPInfoCard } from './protectedApp';

<PKPInfoCard
  selectedPkp={selectedPkp}
  balance={balance}
  isLoadingBalance={isLoadingBalance}
  selectedChain={selectedChain}
  onShowPkpModal={() => setShowPkpModal(true)}
/>
```

## 🔄 **Migration Strategy**

1. **Phase 1** ✅: Extract utilities, types, and basic UI components
2. **Phase 2**: Extract permission management components
3. **Phase 3**: Extract wallet operation components  
4. **Phase 4**: Extract signing and encryption components
5. **Phase 5**: Create main ProtectedApp component that orchestrates everything

## 📋 **Benefits**

- **Maintainability**: Smaller, focused components
- **Reusability**: Components can be reused across the app
- **Performance**: Reduced re-renders through proper context usage
- **Type Safety**: Centralised type definitions
- **Testing**: Easier to unit test individual components
- **Code Organisation**: Clear separation of concerns

## 🚧 **Next Steps**

1. Continue extracting components from the main ProtectedApp.tsx
2. Create permission-specific components (AddActionForm, AddAddressForm, etc.)
3. Extract wallet operation components (SignMessage, SendTransaction, etc.)
4. Create custom hooks for complex logic
5. Add proper error boundaries and loading states 