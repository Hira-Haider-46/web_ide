import { useState, useEffect, useRef } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { X, Minus } from "lucide-react";
import "xterm/css/xterm.css";
import "./Terminal.css";

const Terminal = ({ onToggle }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [currentDirectory, setCurrentDirectory] = useState("~");

  const commands = {
    help: () => [
      "Available commands:",
      "  help       - Show this help message",
      "  clear      - Clear the terminal",
      "  ls         - List files in current directory",
      "  pwd        - Show current directory",
      "  cd <dir>   - Change directory",
      "  cat <file> - Display file contents",
      "  echo <msg> - Display message",
      "  date       - Show current date and time",
      "  whoami     - Show current user",
      "  node -v    - Show Node.js version",
      "  npm -v     - Show npm version",
    ],
    clear: () => {
      if (xtermRef.current) {
        xtermRef.current.clear();
      }
      return [];
    },
    ls: () => [
      "src/",
      "public/",
      "package.json",
      "README.md",
      "vite.config.js",
      "eslint.config.js",
    ],
    pwd: () => [`/home/user/web-ide`],
    cd: (args) => {
      if (!args[0]) {
        setCurrentDirectory("~");
        return ["Changed to home directory"];
      }
      const dir = args[0];
      if (dir === "..") {
        setCurrentDirectory("~");
        return ["Changed to parent directory"];
      }
      if (["src", "public", "components"].includes(dir)) {
        setCurrentDirectory(`~/${dir}`);
        return [`Changed to directory: ${dir}`];
      }
      return [`cd: ${dir}: No such file or directory`];
    },
    cat: (args) => {
      if (!args[0]) {
        return ["cat: missing file operand"];
      }
      const fileName = args[0];
      const mockFiles = {
        "package.json": [
          "{",
          '  "name": "web-ide",',
          '  "version": "1.0.0",',
          '  "type": "module",',
          '  "dependencies": {',
          '    "react": "^18.2.0"',
          "  }",
          "}",
        ],
        "README.md": [
          "# Web IDE",
          "",
          "A modern web-based IDE built with React.",
          "",
          "## Features",
          "- File explorer",
          "- Code editor",
          "- Terminal",
          "- Live preview",
        ],
      };
      return (
        mockFiles[fileName] || [`cat: ${fileName}: No such file or directory`]
      );
    },
    echo: (args) => [args.join(" ")],
    date: () => [new Date().toString()],
    whoami: () => ["webide-user"],
    "node -v": () => ["v18.17.0"],
    "npm -v": () => ["9.8.1"],
  };

  useEffect(() => {
    if (terminalRef.current && !xtermRef.current) {
      const terminal = new XTerm({
        theme: {
          background: "#1e1e1e",
          foreground: "#cccccc",
          cursor: "#cccccc",
          cursorAccent: "#cccccc",
          selection: "#264f78",
          black: "#000000",
          red: "#cd3131",
          green: "#0dbc79",
          yellow: "#e5e510",
          blue: "#2472c8",
          magenta: "#bc3fbc",
          cyan: "#11a8cd",
          white: "#e5e5e5",
          brightBlack: "#666666",
          brightRed: "#f14c4c",
          brightGreen: "#23d18b",
          brightYellow: "#f5f543",
          brightBlue: "#3b8eea",
          brightMagenta: "#d670d6",
          brightCyan: "#29b8db",
          brightWhite: "#e5e5e5",
        },
        fontSize: 13,
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        cursorBlink: true,
        rows: 20,
        cols: 80,
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      fitAddonRef.current = fitAddon;

      terminal.open(terminalRef.current);
      fitAddon.fit();

      xtermRef.current = terminal;

      let currentLine = "";

      terminal.onData((data) => {
        switch (data) {
          case "\r":
            terminal.write("\r\n");
            if (currentLine.trim()) {
              executeCommand(currentLine.trim());
            }
            currentLine = "";
            terminal.write("$ ");
            break;
          case "\u007F":
            if (currentLine.length > 0) {
              currentLine = currentLine.slice(0, -1);
              terminal.write("\b \b");
            }
            break;
          default:
            if (data >= " ") {
              currentLine += data;
              terminal.write(data);
            }
            break;
        }
      });

      const executeCommand = (input) => {
        const [command, ...args] = input.split(" ");

        if (commands[input] || commands[command]) {
          const cmd = commands[input] || commands[command];
          const output = cmd(args);
          output.forEach((line) => {
            terminal.writeln(line);
          });
        } else {
          terminal.writeln(`Command not found: ${command}`);
        }
      };
    }

    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="terminal">
      <div className="terminal-header">
        <div className="terminal-title">
          <span>Terminal</span>
        </div>
        <div className="terminal-controls">
          <button className="terminal-control minimize" onClick={onToggle}>
            <Minus size={14} />
          </button>
          <button className="terminal-control close" onClick={onToggle}>
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="terminal-content" ref={terminalRef} />
    </div>
  );
};

export default Terminal;