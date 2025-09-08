// ANTHROPIC API KEY INPUT COMPONENT
// /Users/matthewsimon/Projects/SMNB/smnb/components/ui/ApiKeyInput.tsx

/**
 * Anthropic API Key Input Component
 * 
 * Secure input component for Anthropic Claude API keys
 * Features validation, masking, and integration with the API key store
 */

'use client';

import React, { useState, useRef } from 'react';
import { Eye, EyeOff, Key, Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useApiKeyStore, ANTHROPIC_CONFIG, maskApiKey, validateKeyFormat } from '@/lib/stores/apiKeyStore';

interface ApiKeyInputProps {
  className?: string;
  compact?: boolean; // For header usage
}

export function ApiKeyInput({ className = '', compact = false }: ApiKeyInputProps) {
  const {
    anthropicKey,
    isValidating,
    validationError,
    setApiKey,
    validateApiKey,
    clearValidationError,
    hasValidKey,
    removeApiKey
  } = useApiKeyStore();

  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(!anthropicKey);
  const inputRef = useRef<HTMLInputElement>(null);

  // Display value - either input or masked stored key
  const displayValue = isEditing ? inputValue : (anthropicKey ? maskApiKey(anthropicKey.key) : '');
  const hasStoredKey = Boolean(anthropicKey);
  const isKeyValid = hasValidKey();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) {
      clearValidationError();
      return;
    }

    // Set the key in store
    setApiKey(inputValue.trim());
    
    // Validate the key
    const isValid = await validateApiKey(inputValue.trim());
    
    if (isValid) {
      setInputValue('');
      setIsEditing(false);
      setShowKey(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setInputValue('');
    clearValidationError();
    // Focus input after state update
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue('');
    setShowKey(false);
    clearValidationError();
  };

  const handleRemove = () => {
    removeApiKey();
    setInputValue('');
    setIsEditing(true);
    setShowKey(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Validation state
  const showValidationState = hasStoredKey && !isEditing;
  const hasFormatError = inputValue && !validateKeyFormat(inputValue);

  if (compact) {
    // Compact header version
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showValidationState ? (
          // Stored key display
          <div className="flex items-center gap-2 text-xs">
            <Key className="h-3 w-3 text-[#858585]" />
            <span className="text-[#858585] font-mono">
              {maskApiKey(anthropicKey?.key || '')}
            </span>
            {isKeyValid ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-red-500" />
            )}
            <Button
              onClick={handleEdit}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[#858585] hover:text-white text-xs"
            >
              Edit
            </Button>
          </div>
        ) : (
          // Input form
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Input
                ref={inputRef}
                type={showKey ? 'text' : 'password'}
                placeholder="sk-ant-..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-7 w-72 text-xs font-mono bg-[#181818] border-[#404040] text-white placeholder:text-[#666] pr-8 focus:outline-none focus:ring-0 focus:border-[#404040] focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isValidating}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#858585] hover:text-white"
                tabIndex={-1}
              >
                {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>
            
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={!inputValue.trim() || hasFormatError || isValidating}
              className="h-7 px-3 text-xs bg-[#181818] hover:bg-[#252525] border border-[#404040]"
            >
              {isValidating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Save'
              )}
            </Button>
            
            {hasStoredKey && (
              <Button
                type="button"
                onClick={handleCancel}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-[#858585] hover:text-white bg-[#181818] hover:bg-[#252525] border border-[#404040]"
              >
                Cancel
              </Button>
            )}
          </form>
        )}
        
        {/* Error message */}
        {validationError && (
          <span className="text-red-400 text-xs">{validationError}</span>
        )}
        {hasFormatError && (
          <span className="text-red-400 text-xs">Invalid key format</span>
        )}
      </div>
    );
  }

  // Full version for settings/config pages
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="anthropic-key" className="text-sm font-medium">
          {ANTHROPIC_CONFIG.displayName} API Key
        </Label>
        
        {showValidationState ? (
          // Stored key display with actions
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <Key className="h-4 w-4 text-gray-500" />
            <span className="font-mono text-sm flex-1">
              {maskApiKey(anthropicKey?.key || '')}
            </span>
            {isKeyValid ? (
              <div className="flex items-center gap-1 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm">Valid</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <X className="h-4 w-4" />
                <span className="text-sm">Invalid</span>
              </div>
            )}
            <Button onClick={handleEdit} variant="outline" size="sm">
              Edit
            </Button>
            <Button onClick={handleRemove} variant="outline" size="sm">
              Remove
            </Button>
          </div>
        ) : (
          // Input form
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Input
                ref={inputRef}
                id="anthropic-key"
                type={showKey ? 'text' : 'password'}
                placeholder="Enter your Anthropic API key (sk-ant-...)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="font-mono pr-12"
                disabled={isValidating}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                tabIndex={-1}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!inputValue.trim() || hasFormatError || isValidating}
                className="flex items-center gap-2"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Save & Validate'
                )}
              </Button>
              
              {hasStoredKey && (
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="outline"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}
        
        {/* Error messages */}
        {validationError && (
          <p className="text-sm text-red-600 flex items-center gap-2">
            <X className="h-4 w-4" />
            {validationError}
          </p>
        )}
        {hasFormatError && (
          <p className="text-sm text-red-600 flex items-center gap-2">
            <X className="h-4 w-4" />
            API key must start with "sk-ant-" and be at least 20 characters
          </p>
        )}
        
        {/* Help text */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your API key is stored securely in your browser and never sent to our servers.
          Get your key from the{' '}
          <a
            href="https://console.anthropic.com/account/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            Anthropic Console
          </a>
        </p>
      </div>
    </div>
  );
}