import React, { useRef, useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, coy } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeEditor = ({ content, language, onChange, readOnly, theme }) => {
  const textareaRef = useRef(null);
  const preRef = useRef(null);
  const lineNumbersRef = useRef(null);
  
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    setLineCount((content || '').split('\n').length);
  }, [content]);

  const handleScroll = (e) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop;
      preRef.current.scrollLeft = e.target.scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100%', 
      width: '100%', 
      backgroundColor: 'var(--bg-secondary)',
      fontSize: '14px',
      lineHeight: '1.5',
      fontFamily: '"JetBrains Mono", monospace'
    }}>
      {/* Line Numbers */}
      <div 
        ref={lineNumbersRef}
        style={{
          width: '48px',
          flexShrink: 0,
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          borderRight: '1px solid var(--border-color)',
          textAlign: 'right',
          padding: '20px 8px 20px 0',
          overflow: 'hidden',
          userSelect: 'none',
          opacity: 0.5
        }}
      >
        {Array.from({ length: lineCount }).map((_, i) => (
          <div key={i} style={{ height: '1.5em' }}>{i + 1}</div>
        ))}
      </div>

      {/* Editor Area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {/* Syntax Highlight Layer */}
        <div 
          ref={preRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            padding: '20px',
            margin: 0,
            overflow: 'hidden',
            whiteSpace: 'pre' // Disable wrapping
          }}
        >
          <SyntaxHighlighter
            language={language}
            style={theme === 'dark' ? vscDarkPlus : coy}
            showLineNumbers={false}
            wrapLines={false}
            customStyle={{
              margin: 0,
              padding: 0,
              background: 'transparent',
              fontSize: 'inherit',
              lineHeight: 'inherit',
              fontFamily: 'inherit'
            }}
            codeTagProps={{
              style: { fontFamily: 'inherit' }
            }}
          >
            {content || ' '} 
          </SyntaxHighlighter>
        </div>

        {/* Input Layer */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          readOnly={readOnly}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            padding: '20px',
            margin: 0,
            border: 'none',
            background: 'transparent',
            color: 'transparent',
            caretColor: 'var(--text-primary)',
            fontSize: 'inherit',
            lineHeight: 'inherit',
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            whiteSpace: 'pre', // Disable wrapping to match highlighter
            overflow: 'auto',
            zIndex: 1
          }}
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
        />
      </div>
    </div>
  );
};

export default CodeEditor;
