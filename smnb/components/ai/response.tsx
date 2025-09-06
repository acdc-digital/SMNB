// AI RESPONSE COMPONENT
// /Users/matthewsimon/Projects/SMNB/smnb/components/ai/response.tsx

/**
 * AI Response Component
 * 
 * Markdown renderer optimized for streaming AI responses.
 * Handles incomplete code blocks and formatting with intelligent parsing.
 */

'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ResponseProps {
  children: string | React.ReactNode;
  options?: any;
  allowedImagePrefixes?: string[];
  allowedLinkPrefixes?: string[];
  defaultOrigin?: string;
  parseIncompleteMarkdown?: boolean;
  className?: string;
}

// Auto-complete incomplete formatting during streaming
function completeIncompleteFormatting(content: string, parseIncomplete: boolean): string {
  if (!parseIncomplete || typeof content !== 'string') return content;

  let processedContent = content;

  // Count and auto-complete bold formatting
  const boldMatches = processedContent.match(/\*\*/g) || [];
  if (boldMatches.length % 2 === 1) {
    processedContent += '**';
  }

  // Count and auto-complete italic formatting
  const italicMatches = processedContent.match(/(?<!\*)\*(?!\*)/g) || [];
  if (italicMatches.length % 2 === 1) {
    processedContent += '*';
  }

  // Count and auto-complete strikethrough formatting
  const strikeMatches = processedContent.match(/~~/g) || [];
  if (strikeMatches.length % 2 === 1) {
    processedContent += '~~';
  }

  // Count and auto-complete inline code formatting
  const codeMatches = processedContent.match(/(?<!`)`(?!`)/g) || [];
  if (codeMatches.length % 2 === 1) {
    // Check if we're inside a code block (triple backticks)
    const codeBlockMatches = processedContent.match(/```/g) || [];
    if (codeBlockMatches.length % 2 === 0) {
      processedContent += '`';
    }
  }

  return processedContent;
}

// Hide incomplete links and images until complete
function hideIncompleteElements(content: string): string {
  // Hide incomplete links [text without closing ]
  content = content.replace(/\[([^\]]*?)$/g, '');
  
  // Hide incomplete images ![alt without closing ]
  content = content.replace(/!\[([^\]]*?)$/g, '');
  
  return content;
}

export function Response({
  children,
  options = {},
  allowedImagePrefixes = ['*'],
  allowedLinkPrefixes = ['*'],
  defaultOrigin,
  parseIncompleteMarkdown = true,
  className = '',
  ...props
}: ResponseProps) {
  // Convert children to string if it's not already
  const content = typeof children === 'string' ? children : String(children);

  // Process content for streaming optimizations
  let processedContent = content;
  
  if (parseIncompleteMarkdown) {
    processedContent = hideIncompleteElements(processedContent);
    processedContent = completeIncompleteFormatting(processedContent, true);
  }

  // Custom components for enhanced rendering
  const components = {
    // Enhanced code blocks with copy button
    code({ node, inline, className: codeClassName, children, ...codeProps }: any) {
      const match = /language-(\w+)/.exec(codeClassName || '');
      const language = match ? match[1] : '';

      if (!inline && language) {
        return (
          <div className="relative group">
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code className={codeClassName} {...codeProps}>
                {children}
              </code>
            </pre>
            <button
              onClick={() => navigator.clipboard?.writeText(String(children))}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded px-2 py-1 text-xs"
            >
              Copy
            </button>
          </div>
        );
      }

      return (
        <code className="bg-muted px-1 py-0.5 rounded text-sm" {...codeProps}>
          {children}
        </code>
      );
    },

    // Enhanced links with security
    a({ href, children, ...linkProps }: any) {
      // Check if link is allowed
      const isAllowed = allowedLinkPrefixes.includes('*') || 
        allowedLinkPrefixes.some(prefix => href?.startsWith(prefix));

      if (!isAllowed) {
        return <span>{children}</span>;
      }

      return (
        <a 
          href={href} 
          target={href?.startsWith('http') ? '_blank' : undefined}
          rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="text-primary underline hover:no-underline"
          {...linkProps}
        >
          {children}
        </a>
      );
    },

    // Enhanced images with security
    img({ src, alt, ...imgProps }: any) {
      // Check if image is allowed
      const isAllowed = allowedImagePrefixes.includes('*') || 
        allowedImagePrefixes.some(prefix => src?.startsWith(prefix));

      if (!isAllowed) {
        return <span className="text-muted-foreground">[Image: {alt}]</span>;
      }

      return (
        <img 
          src={src} 
          alt={alt} 
          className="max-w-full h-auto rounded-lg"
          {...imgProps} 
        />
      );
    },

    // Enhanced typography
    h1: ({ children, ...props }: any) => (
      <h1 className="text-2xl font-bold mb-4 text-foreground" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-xl font-semibold mb-3 text-foreground" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-lg font-medium mb-2 text-foreground" {...props}>
        {children}
      </h3>
    ),
    p: ({ children, ...props }: any) => (
      <p className="mb-3 text-foreground leading-relaxed" {...props}>
        {children}
      </p>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-primary pl-4 my-4 text-muted-foreground italic" {...props}>
        {children}
      </blockquote>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc pl-6 mb-3 text-foreground" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal pl-6 mb-3 text-foreground" {...props}>
        {children}
      </ol>
    ),
  };

  return (
    <div className={`prose prose-sm max-w-none ${className}`} {...props}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={components}
        {...options}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

export default Response;