import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

const EDITOR_OPTIONS = {
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
  cursorStyle: 'line',
  fontFamily: 'Monaco, Menlo, "Courier New", monospace',
  formatOnPaste: true,
  bracketPairColorization: { enabled: true },
  padding: { top: 12, bottom: 12 },
  insertSpaces: true,
  detectIndentation: true,
};

export default function CodeEditor({
  value,
  onChange,
  language = 'python',
  theme = 'vs-dark',
  height = '100%',
  readOnly = false,
  onSave,
  onRun,
  onSubmit,
}) {
  const editorRef = useRef(null);
  const onSaveRef = useRef(onSave);
  const onRunRef = useRef(onRun);
  const onSubmitRef = useRef(onSubmit);

  const tabSize = language === 'python' ? 4 : 2;

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    editorRef.current?.updateOptions({ tabSize });
  }, [tabSize]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const syncMinimap = () => {
      editorRef.current?.updateOptions({ minimap: { enabled: !mq.matches } });
    };
    syncMinimap();
    mq.addEventListener('change', syncMinimap);
    return () => mq.removeEventListener('change', syncMinimap);
  }, []);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    const minimapEnabled = !window.matchMedia('(max-width: 768px)').matches;
    editor.updateOptions({ ...EDITOR_OPTIONS, readOnly, tabSize, minimap: { enabled: minimapEnabled } });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSaveRef.current?.();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunRef.current?.();
    });

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
      () => {
        onSubmitRef.current?.();
      }
    );
  };

  const handleEditorChange = (newValue) => {
    onChange?.(newValue || '');
  };

  return (
    <div
      className="w-full h-full border border-white/10 rounded-lg overflow-hidden bg-[#1e1e1e]"
      aria-label={`${language} code editor`}
    >
      <Editor
        height={height}
        language={language}
        theme={theme}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        loading={
          <div className="grid h-full min-h-[200px] place-items-center text-sm text-white/60">
            Loading editor…
          </div>
        }
        options={{ ...EDITOR_OPTIONS, readOnly, tabSize }}
      />
    </div>
  );
}
