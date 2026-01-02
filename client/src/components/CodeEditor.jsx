import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditor({ value, onChange, language = 'python', theme = 'vs-dark', height = '100%' }) {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly: false,
      cursorStyle: 'line',
      fontFamily: 'Monaco, Menlo, "Courier New", monospace',
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Auto-save is handled by parent component
    });
  };

  const handleEditorChange = (newValue) => {
    if (onChange) {
      onChange(newValue || '');
    }
  };

  return (
    <div className="w-full h-full border border-white/10 rounded-lg overflow-hidden">
      <Editor
        height={height}
        language={language}
        theme={theme}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          automaticLayout: true,
          fontSize: 14,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          tabSize: 2,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly: false,
          cursorStyle: 'line',
          fontFamily: 'Monaco, Menlo, "Courier New", monospace',
        }}
      />
    </div>
  );
}



