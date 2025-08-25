import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, X } from "lucide-react";
import "./Sidebar.css";

const Sidebar = ({ fileSystem, onFileSelect, onToggle }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(["src"]));
  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (items, basePath = "") => {
    return Object.entries(items)
      .filter(([name, item]) => name !== "type") // Filter out the type property
      .map(([name, item]) => {
        const currentPath = basePath ? `${basePath}/${name}` : name;

        if (item.type === "folder") {
          const isExpanded = expandedFolders.has(currentPath);
          return (
            <div key={currentPath} className="file-tree-item">
              <div
                className="file-tree-node folder"
                onClick={() => toggleFolder(currentPath)}
              >
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                <span className="file-name">{name}</span>
              </div>
              {isExpanded && (
                <div className="file-tree-children">
                  {renderFileTree(item, currentPath)}
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div key={currentPath} className="file-tree-item">
              <div
                className="file-tree-node file"
                onClick={() =>
                  onFileSelect(currentPath, item.content, item.language)
                }
              >
                <span className="file-name">{name}</span>
              </div>
            </div>
          );
        }
      });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Explorer</h3>
        <button className="sidebar-close" onClick={onToggle}>
          <X size={16} />
        </button>
      </div>
      <div className="file-tree">{renderFileTree(fileSystem)}</div>
    </div>
  );
};

export default Sidebar;
