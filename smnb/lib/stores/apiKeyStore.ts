// ANTHROPIC API KEY STORE
// /Users/matthewsimon/Projects/SMNB/smnb/lib/stores/apiKeyStore.ts

/**
 * Anthropic API Key Configuration Store
 * 
 * Zustand store for managing Anthropic Claude API keys
 * with secure localStorage persistence and validation state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ApiKeyConfig {
  key: string;
  isValid?: boolean;
  lastValidated?: Date;
}

interface ApiKeyState {
  // Anthropic API Key
  anthropicKey: ApiKeyConfig | null;
  
  // Toggle for using user-provided API key vs environment variable
  useUserApiKey: boolean;
  
  // UI State
  isValidating: boolean;
  validationError: string | null;
  
  // Actions
  setApiKey: (key: string) => void;
  removeApiKey: () => void;
  validateApiKey: (key: string) => Promise<boolean>;
  clearValidationError: () => void;
  hasValidKey: () => boolean;
  getValidApiKey: () => string | null;
  clearKey: () => void;
  
  // Toggle actions
  setUseUserApiKey: (enabled: boolean) => void;
  isUserApiKeyEnabled: () => boolean;
}

// Anthropic configuration
export const ANTHROPIC_CONFIG = {
  displayName: 'Anthropic (Claude)',
  keyPrefix: 'sk-ant-',
  testEndpoint: '/api/claude'
};

// Utility to mask API keys for display
export const maskApiKey = (key: string): string => {
  if (!key || key.length < 8) return key;
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
};

// Utility to validate Anthropic key format
export const validateKeyFormat = (key: string): boolean => {
  return key.startsWith(ANTHROPIC_CONFIG.keyPrefix) && key.length > ANTHROPIC_CONFIG.keyPrefix.length + 10;
};

export const useApiKeyStore = create<ApiKeyState>()(
  persist(
    (set, get) => ({
      // Initial state
      anthropicKey: null,
      useUserApiKey: false, // Default to using environment variable
      isValidating: false,
      validationError: null,

      // Set Anthropic API key
      setApiKey: (key: string) => {
        const trimmedKey = key.trim();
        
        if (!trimmedKey) {
          get().removeApiKey();
          return;
        }

        // Basic format validation
        if (!validateKeyFormat(trimmedKey)) {
          set({
            validationError: `Invalid ${ANTHROPIC_CONFIG.displayName} API key format`
          });
          return;
        }

        // Clear any previous validation errors
        set({ validationError: null });

        const keyConfig: ApiKeyConfig = {
          key: trimmedKey,
          isValid: undefined, // Will be set after validation
          lastValidated: undefined
        };

        set({ anthropicKey: keyConfig });

        console.log(`🔑 Anthropic API Key set: ${maskApiKey(trimmedKey)}`);
      },

      // Remove Anthropic API key
      removeApiKey: () => {
        set({
          anthropicKey: null,
          validationError: null
        });

        console.log(`🗑️ Anthropic API Key removed`);
      },

      // Validate API key with actual API call
      validateApiKey: async (key: string): Promise<boolean> => {
        if (!validateKeyFormat(key)) {
          set({
            validationError: `Invalid ${ANTHROPIC_CONFIG.displayName} API key format`
          });
          return false;
        }

        set({ isValidating: true });

        try {
          const response = await fetch(ANTHROPIC_CONFIG.testEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'test',
              apiKey: key // Send key for validation
            })
          });

          const result = await response.json();
          const isValid = response.ok && result.success;

          // Update key config with validation result
          const existingKey = get().anthropicKey;
          if (existingKey && existingKey.key === key) {
            set({
              anthropicKey: {
                ...existingKey,
                isValid,
                lastValidated: new Date()
              },
              validationError: isValid ? null : result.error || 'API key validation failed',
              isValidating: false
            });
          } else {
            set({ isValidating: false });
          }

          if (isValid) {
            console.log(`✅ Anthropic API Key validated successfully`);
          } else {
            console.error(`❌ Anthropic API Key validation failed:`, result.error);
          }

          return isValid;

        } catch (error) {
          console.error(`❌ Anthropic API Key validation error:`, error);
          
          set({
            validationError: 'Network error during validation',
            isValidating: false
          });

          return false;
        }
      },

      // Clear validation error
      clearValidationError: () => {
        set({ validationError: null });
      },

      // Check if we have a valid key
      hasValidKey: (): boolean => {
        const keyConfig = get().anthropicKey;
        return keyConfig !== null && keyConfig.isValid === true;
      },

      // Get valid API key
      getValidApiKey: (): string | null => {
        const keyConfig = get().anthropicKey;
        return keyConfig && keyConfig.isValid === true ? keyConfig.key : null;
      },

      // Clear API key (for reset/logout)
      clearKey: () => {
        set({
          anthropicKey: null,
          validationError: null
        });
        console.log('🗑️ Anthropic API key cleared');
      },

      // Toggle actions
      setUseUserApiKey: (enabled: boolean) => {
        set({ useUserApiKey: enabled });
        console.log(`🔀 API Key source: ${enabled ? 'User-provided' : 'Environment variable'}`);
      },

      isUserApiKeyEnabled: (): boolean => {
        return get().useUserApiKey;
      }
    }),
    {
      name: 'smnb-anthropic-key',
      version: 1,
      // Only persist the key and toggle, not validation state
      partialize: (state) => ({
        anthropicKey: state.anthropicKey,
        useUserApiKey: state.useUserApiKey
      }),
      // Don't expose raw keys in dev tools
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('🔑 Anthropic API key rehydrated from localStorage');
        }
      }
    }
  )
);