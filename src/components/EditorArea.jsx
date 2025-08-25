import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { X, Menu } from "lucide-react";
import "./EditorArea.css";

const EditorArea = ({
  activeFile,
  openFiles,
  onFileSelect,
  onFileClose,
  onContentChange,
  onSaveFile,
  sidebarCollapsed,
  onSidebarToggle,
}) => {
  const [editorContent, setEditorContent] = useState("");
  const [saveStatus, setSaveStatus] = useState(null);
  const editorRef = useRef(null);
  const activeFileRef = useRef(null);
  const editorContentRef = useRef("");

  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  useEffect(() => {
    editorContentRef.current = editorContent;
  }, [editorContent]);

  useEffect(() => {
    console.log(
      "EditorArea: openFiles changed:",
      openFiles.map((f) => f.path)
    );
  }, [openFiles]);

  useEffect(() => {
    if (activeFile) {
      console.log(
        "Loading file content for:",
        activeFile.path,
        "Content length:",
        activeFile.content?.length
      );
      setEditorContent(activeFile.content || "");
    } else {
      setEditorContent("");
    }
  }, [activeFile]);

  const handleEditorChange = (value) => {
    if (value !== undefined) {
      setEditorContent(value);
      if (activeFile) {
        onContentChange(activeFile.path, value);
      }
    }
  };

  const getLanguageFromPath = (path) => {
    const ext = path.split(".").pop();
    switch (ext) {
      case "js":
      case "jsx":
        return "javascript";
      case "ts":
      case "tsx":
        return "typescript";
      case "css":
        return "css";
      case "html":
        return "html";
      case "json":
        return "json";
      case "md":
        return "markdown";
      case "py":
        return "python";
      default:
        return "plaintext";
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    monaco.editor.defineTheme("vs-dark-custom", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#cccccc",
        "editorLineNumber.foreground": "#858585",
        "editorCursor.foreground": "#aeafad",
        "editor.selectionBackground": "#264f78",
        "editor.inactiveSelectionBackground": "#3a3d41",
      },
    });
    monaco.editor.setTheme("vs-dark-custom");

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const currentActiveFile = activeFileRef.current;
      const currentEditorContent = editorContentRef.current;

      if (
        currentActiveFile &&
        onSaveFile &&
        currentEditorContent !== undefined
      ) {
        console.log(
          "Saving file:",
          currentActiveFile.path,
          "with content length:",
          currentEditorContent.length
        );
        setSaveStatus("saving");

        try {
          onSaveFile(currentActiveFile.path, currentEditorContent);
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus(null), 2000);
        } catch (error) {
          console.error("Save error:", error);
          setSaveStatus("error");
          setTimeout(() => setSaveStatus(null), 3000);
        }
      }
    });
  };

  return (
    <div className="editor-area">
      <div className="tab-bar">
        <div className="tab-bar-left">
          {sidebarCollapsed && (
            <button className="sidebar-toggle" onClick={onSidebarToggle}>
              <Menu size={16} />
            </button>
          )}
          <div className="tabs">
            {openFiles.map((file) => (
              <div
                key={file.path}
                className={`tab ${
                  activeFile && activeFile.path === file.path ? "active" : ""
                }`}
                onClick={() => onFileSelect(file)}
              >
                <span className="tab-name">
                  {file.path.split("/").pop()}
                  {file.modified && (
                    <span className="modified-indicator">●</span>
                  )}
                </span>
                <button
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileClose(file.path);
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="editor-content">
        {activeFile ? (
          <Editor
            height="100%"
            language={getLanguageFromPath(activeFile.path)}
            value={editorContent}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: "on",
              lineNumbers: "on",
              renderWhitespace: "selection",
              bracketPairColorization: { enabled: true },
            }}
          />
        ) : (
          <div className="welcome-screen">
            <div className="welcome-content">
              <p>Select a file from the explorer to start editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorArea;