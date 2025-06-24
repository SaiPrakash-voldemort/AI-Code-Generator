import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import './App.css';

function CopilotSidebar({ onSubmit, chatHistory }) {
  const [input, setInput] = useState('');

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Code copied to clipboard!');
    });
  };

  return (
    <div className="sidebar">
      <div className="chat-history">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'You' : 'Copilot'}:</strong>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const lang = className?.replace('language-', '') || '';
                  if (inline) {
                    return <code {...props} className={className}>{children}</code>;
                  }
                  return (
                    <div className="code-block">
                      <pre>
                        <code className={className}>{children}</code>
                      </pre>
                      <button className='m-2' onClick={() => handleCopy(children)}>Copy</button>
                    </div>
                  );
                },
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        ))}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your prompt..."
      />
      <button
        onClick={() => {
          onSubmit(input);
          setInput('');
        }}
      >
        Send
      </button>
    </div>
  );
}

function App() {
  const [socket, setSocket] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onopen = () => console.log('WebSocket connected');
    ws.onmessage = (event) => {
      const fullMessage = event.data;
      let index = 0;
      setEditorContent('');

      const interval = setInterval(() => {
        setEditorContent((prev) => prev + fullMessage[index]);
        index++;
        if (index >= fullMessage.length) {
          clearInterval(interval);
          setChatHistory((prev) => [...prev, { role: 'assistant', content: fullMessage }]);
        }
      }, 20);
    };
    ws.onerror = (err) => console.error('WebSocket error:', err);
    setSocket(ws);

    return () => ws.close();
  }, []);

  const sendPrompt = (msg) => {
    if (socket && socket.readyState === WebSocket.OPEN && msg.trim() !== '') {
      socket.send(msg);
      setChatHistory((prev) => [...prev, { role: 'user', content: msg }]);
    } else {
      console.error('WebSocket is not connected or message empty.');
    }
  };

  return (
    <div className="app">
      <CopilotSidebar onSubmit={sendPrompt} chatHistory={chatHistory} />
      <Editor className='m-8'
        height="90vh"
        width="60vw"
        defaultLanguage="javascript"
        value={editorContent}
        options={{
          readOnly: true,
          fontSize: 16,
          minimap: { enabled: false },
          theme: 'vs-dark',
          wordWrap: "on",
        }}
      />
    </div>
  );
}

export default App;
