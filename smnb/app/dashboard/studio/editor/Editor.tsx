// EDITOR
// /Users/matthewsimon/Projects/SMNB/smnb/app/dashboard/studio/editor/Editor.tsx

/**
 * Editor Component
 * 
 * Advanced editor using Tiptap with agent-controlled content generation.
 * Features cascading text display with real-time streaming and automatic saving.
 */

'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
// import { useTiptapSync } from '@convex-dev/prosemirror-sync/tiptap';
import { useEditorAgentStore } from '@/lib/stores/host/editorAgentStore';
// import { api } from '@/convex/_generated/api';

interface EditorProps {
  className?: string;
}

export default function Editor({ className = '' }: EditorProps) {
  const {
    initializeEditorAgent,
    isActive,
    currentContent,
    isStreaming,
    streamingText,
    stats,
    cleanup
  } = useEditorAgentStore();

  // Debug logging
  useEffect(() => {
    console.log('📝 Editor State Update:', {
      isActive,
      isStreaming,
      hasCurrentContent: !!currentContent,
      currentContentId: currentContent?.id,
      streamingTextLength: streamingText?.length || 0,
      stats
    });
  }, [isActive, isStreaming, currentContent, streamingText, stats]);

  // Initialize editor agent on mount
  useEffect(() => {
    initializeEditorAgent();
    
    return () => {
      cleanup();
    };
  }, [initializeEditorAgent, cleanup]);

  // Set up Tiptap sync with Convex (temporarily disabled)
  // const sync = useTiptapSync(api.prosemirror, documentId);

  // Configure Tiptap extensions
  const extensions = useMemo(() => [
    StarterKit.configure({
      history: {}, // Re-enable history with default options
    }),
    Typography,
    Placeholder.configure({
      placeholder: 'Editor is ready for agent-generated content...',
      emptyEditorClass: 'is-editor-empty',
    }),
  ], []);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions,
    content: { type: 'doc', content: [] },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none p-4 focus:outline-none min-h-[400px] text-sm leading-relaxed',
        'data-placeholder': 'Editor is ready for agent-generated content...',
      },
      handleKeyDown: () => {
        // Prevent all user input - agent controlled only
        return true;
      },
      handlePaste: () => {
        // Prevent pasting
        return true;
      },
    },
    editable: false, // Make editor read-only (agent-controlled)
    immediatelyRender: false,
  });

  // Initialize editor with welcome content
  const handleInitializeEditor = useCallback(() => {
    if (editor && editor.isEmpty) {
      editor.commands.setContent({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Welcome to the AI Editor. Content will appear here as the agent processes live feed data.',
              }
            ]
          }
        ]
      });
    }
  }, [editor]);

  // Handle content updates - streaming and completed
  useEffect(() => {
    if (!editor) return;

    // If streaming, only update the streaming display (don't update editor content)
    if (isStreaming && streamingText) {
      // The streaming content will be shown in the blue background section
      // Don't update the editor content during streaming
      return;
    }

    // If we have completed content, show it in the editor
    if (currentContent && currentContent.isComplete && currentContent.content) {
      console.log(`📝 Displaying completed content in editor: ${currentContent.id}`);
      
      // Convert content to editor format with proper paragraph structure
      const paragraphs = currentContent.content.split('\n\n').map(paragraph => ({
        type: 'paragraph',
        content: [{ type: 'text', text: paragraph.trim() }]
      })).filter(p => p.content[0].text); // Remove empty paragraphs

      const content = {
        type: 'doc',
        content: paragraphs.length > 0 ? paragraphs : [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: currentContent.content }]
          }
        ]
      };

      // Clear editor first, then set new content
      editor.commands.clearContent();
      setTimeout(() => {
        editor.commands.setContent(content, false);
        
        // Scroll to top for completed content
        setTimeout(() => {
          if (editor.view.dom.parentElement) {
            editor.view.dom.parentElement.scrollTop = 0;
          }
        }, 10);
      }, 10);
    } else if (!currentContent && !isStreaming) {
      // Show welcome message if no current content and not streaming
      handleInitializeEditor();
    }
  }, [editor, isStreaming, currentContent, streamingText, handleInitializeEditor]);

  // Initialize editor content on mount
  useEffect(() => {
    if (editor) {
      handleInitializeEditor();
    }
  }, [editor, handleInitializeEditor]);

  return (
    <div className={`flex-1 bg-card border border-border rounded-lg shadow-sm flex flex-col min-h-0 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">✍️</span>
          <h3 className="font-semibold text-foreground">AI Editor</h3>
          {currentContent && (
            <span className="text-xs text-muted-foreground">
              {currentContent.title}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {/* Status indicator */}
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              isStreaming ? 'bg-blue-500 animate-pulse' : 
              isActive ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            <span>
              {isStreaming ? 'Generating...' : isActive ? 'Ready' : 'Standby'}
            </span>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-2">
            <span>{stats.totalWords} words</span>
            <span>•</span>
            <span>{stats.sessionsCompleted} sessions</span>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {!editor ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Loading editor...</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Current streaming content */}
            {isStreaming && streamingText && (
              <div className="border-b border-border bg-blue-50 dark:bg-blue-950/30">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Live Generation
                    </span>
                    {currentContent && (
                      <span className="text-xs text-muted-foreground">
                        {currentContent.wordCount} words
                      </span>
                    )}
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                    {streamingText.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-2 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                    <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Tiptap Editor - Always visible, shows completed content or welcome message */}
            <div className="flex-1">
              <EditorContent editor={editor} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
