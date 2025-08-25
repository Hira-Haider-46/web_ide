import { useState, useEffect } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import Sidebar from "./Sidebar";
import EditorArea from "./EditorArea";
import Terminal from "./Terminal";
import Preview from "./Preview";
import "./IDE.css";

const IDE = () => {
  const [activeFile, setActiveFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [activeView, setActiveView] = useState("code");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);

  const getInitialFileSystem = () => {
    const saved = localStorage.getItem("web-ide-filesystem");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved filesystem:", e);
      }
    }

    return {
      src: {
        "App.jsx": {
          content: `import React from 'react'
import './App.css'

function App() {
  return (
    <div className="app">
      <h1>Hello World!</h1>
      <p>Welcome to the Web IDE</p>
    </div>
  )
}

export default App`,
          type: "file",
          language: "javascript",
        },
        "App.css": {
          content: `.app {
  text-align: center;
  padding: 20px;
}

h1 {
  color: #61dafb;
  margin-bottom: 20px;
}

p {
  font-size: 18px;
  color: #888;
}`,
          type: "file",
          language: "css",
        },
        components: {
          "Header.jsx": {
            content: `import React from 'react'

const Header = () => {
  return (
    <header>
      <h1>My App Header</h1>
    </header>
  )
}

export default Header`,
            type: "file",
            language: "javascript",
          },
          type: "folder",
        },
        type: "folder",
      },
      public: {
        "index.html": {
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web IDE</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
          type: "file",
          language: "html",
        },
        type: "folder",
      },
      "package.json": {
        content: `{
  "name": "web-ide-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`,
        type: "file",
        language: "json",
      },
      "README.md": {
        content: `# Web IDE Project

This is a sample project created in the Web IDE.

## Features

- File explorer
- Code editor with syntax highlighting
- Live preview
- Terminal

## Getting Started

1. Edit your files in the editor
2. Switch to preview to see your changes
3. Use the terminal for commands`,
        type: "file",
        language: "markdown",
      },
    };
  };

  const [fileSystem, setFileSystem] = useState(getInitialFileSystem);

  useEffect(() => {
    localStorage.setItem("web-ide-filesystem", JSON.stringify(fileSystem));
  }, [fileSystem]);

  const openFile = (path, content, language) => {
    console.log("Opening file:", path, "with content length:", content?.length);

    const existingFile = openFiles.find((file) => file.path === path);
    if (!existingFile) {
      const actualContent = getFileContentFromPath(path) || content;
      const newFile = {
        path,
        content: actualContent,
        language,
        modified: false,
      };
      setOpenFiles([...openFiles, newFile]);
      setActiveFile(newFile);
    } else {
      setActiveFile(existingFile);
    }
  };

  const getFileContentFromPath = (path) => {
    const pathParts = path.split("/").filter((part) => part.length > 0);
    let current = fileSystem;

    for (const part of pathParts) {
      if (current[part]) {
        current = current[part];
      } else {
        return null;
      }
    }

    return current.type === "file" ? current.content : null;
  };

  const closeFile = (path) => {
    const updatedFiles = openFiles.filter((file) => file.path !== path);
    setOpenFiles(updatedFiles);

    if (activeFile && activeFile.path === path) {
      setActiveFile(
        updatedFiles.length > 0 ? updatedFiles[updatedFiles.length - 1] : null
      );
    }
  };

  const updateFileContent = (path, newContent) => {
    const updatedFiles = openFiles.map((file) =>
      file.path === path
        ? { ...file, content: newContent, modified: true }
        : file
    );
    setOpenFiles(updatedFiles);

    if (activeFile && activeFile.path === path) {
      setActiveFile({ ...activeFile, content: newContent, modified: true });
    }
  };

  const saveFile = (path, content) => {
    console.log(
      "Save function called for path:",
      path,
      "content length:",
      content?.length
    );
    console.log(
      "Current openFiles at save time:",
      openFiles.map((f) => ({ path: f.path, modified: f.modified }))
    );

    const updateFileSystemRecursively = (fs, pathParts, newContent) => {
      const newFs = { ...fs };

      if (pathParts.length === 1) {
        const fileName = pathParts[0];
        if (newFs[fileName] && newFs[fileName].type === "file") {
          newFs[fileName] = {
            ...newFs[fileName],
            content: newContent,
          };
          console.log("Updated file in filesystem:", fileName);
        } else {
          console.log(
            "File not found in filesystem:",
            fileName,
            "Available files:",
            Object.keys(newFs)
          );
        }
        return newFs;
      } else {
        const [firstPart, ...remainingParts] = pathParts;
        if (newFs[firstPart] && newFs[firstPart].type === "folder") {
          newFs[firstPart] = {
            ...newFs[firstPart],
            ...updateFileSystemRecursively(
              newFs[firstPart],
              remainingParts,
              newContent
            ),
          };
        } else {
          console.log("Folder not found in filesystem:", firstPart);
        }
        return newFs;
      }
    };

    try {
      const pathParts = path.split("/").filter((part) => part.length > 0);
      console.log("Path parts:", pathParts);

      const updatedFileSystem = updateFileSystemRecursively(
        fileSystem,
        pathParts,
        content
      );
      setFileSystem(updatedFileSystem);

      console.log(
        "Before updating openFiles:",
        openFiles.map((f) => f.path)
      );

      setOpenFiles((currentOpenFiles) => {
        console.log(
          "In setOpenFiles callback, currentOpenFiles:",
          currentOpenFiles.map((f) => f.path)
        );
        const updatedFiles = currentOpenFiles.map((file) =>
          file.path === path ? { ...file, content, modified: false } : file
        );
        console.log(
          "Updated files in callback:",
          updatedFiles.map((f) => f.path)
        );
        return updatedFiles;
      });

      if (activeFile && activeFile.path === path) {
        setActiveFile({ ...activeFile, content, modified: false });
      }

      localStorage.setItem(
        "web-ide-filesystem",
        JSON.stringify(updatedFileSystem)
      );

      console.log("File saved successfully to:", path);
      console.log("Updated file system:", updatedFileSystem);
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };

  const renderContent = () => {
    if (activeView === "preview") {
      return <Preview openFiles={openFiles} />;
    }

    return (
      <EditorArea
        activeFile={activeFile}
        openFiles={openFiles}
        onFileSelect={setActiveFile}
        onFileClose={closeFile}
        onContentChange={updateFileContent}
        onSaveFile={saveFile}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={() => setSidebarCollapsed(false)}
      />
    );
  };

  return (
    <div className="ide">
      <div className="ide-header">
        <div className="ide-tabs">
          <button
            className={`tab ${activeView === "code" ? "active" : ""}`}
            onClick={() => setActiveView("code")}
          >
            Code
          </button>
          <button
            className={`tab ${activeView === "preview" ? "active" : ""}`}
            onClick={() => setActiveView("preview")}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="ide-main">
        <PanelGroup direction="horizontal">
          {!sidebarCollapsed && (
            <>
              <Panel defaultSize={20} minSize={15} maxSize={35}>
                <Sidebar
                  fileSystem={fileSystem}
                  onFileSelect={openFile}
                  onToggle={() => setSidebarCollapsed(true)}
                />
              </Panel>
              <PanelResizeHandle className="resize-handle" />
            </>
          )}

          <Panel minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={30}>
                {renderContent()}
              </Panel>

              {!terminalCollapsed && (
                <>
                  <PanelResizeHandle className="resize-handle" />
                  <Panel defaultSize={30} minSize={20} maxSize={50}>
                    <Terminal onToggle={() => setTerminalCollapsed(true)} />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {terminalCollapsed && (
        <div className="collapsed-terminal">
          <button
            className="terminal-toggle"
            onClick={() => setTerminalCollapsed(false)}
          >
            Terminal
          </button>
        </div>
      )}
    </div>
  );
};

export default IDE;