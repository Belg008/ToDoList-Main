import React, { useState, useEffect } from "react";
import "./Page.macos.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

type Todo = {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  status: string;
  createdAt: string;
};

export default function Page() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("low");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch todos from backend
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/todos`);
      if (!response.ok) throw new Error('Failed to fetch todos');
      const data = await response.json();
      setTodos(data.todos);
      setError("");
    } catch (err) {
      setError("Failed to load todos. Check if backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const addTodo = async () => {
    if (!title.trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priority,
          completed: false,
          status: "todo"
        })
      });

      if (!response.ok) throw new Error('Failed to create todo');
      
      await fetchTodos(); // Refresh list
      setTitle("");
      setDescription("");
      setPriority("low");
      setError("");
    } catch (err) {
      setError("Failed to add todo");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/todos/${id}/toggle`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to toggle todo');
      await fetchTodos();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete todo');
      await fetchTodos();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="macos-layout">
      <aside className="macos-sidebar">
        <div className="sidebar-title">SmartTodo</div>
        <div className="sidebar-section">
          <div className="sidebar-item active">All Tasks</div>
          <div className="sidebar-item">In Progress</div>
          <div className="sidebar-item">Completed</div>
        </div>
      </aside>

      <main className="macos-content">
        {error && (
          <div style={{ 
            background: '#fee', 
            border: '1px solid #fcc', 
            padding: '10px', 
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#c00'
          }}>
            {error}
          </div>
        )}

        <div className="content-card fade-in">
          <h1 className="section-title">Create new task</h1>

          <input
            className="macos-input"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />

          <textarea
            className="macos-textarea"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />

          <select
            className="macos-select"
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as "low" | "medium" | "high")
            }
            disabled={loading}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <button 
            className="macos-button" 
            onClick={addTodo}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Todo"}
          </button>
        </div>

        <div className="content-card">
          <h1 className="section-title">Tasks ({todos.length})</h1>

          {loading && <div>Loading...</div>}

          <div className="todo-list">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={`todo-card ${todo.completed ? "completed" : ""}`}
              >
                <div
                  className="todo-title"
                  onClick={() => toggleComplete(todo.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {todo.completed ? (
                    <span className="icon-check">✔︎</span>
                  ) : (
                    <span className="icon-empty">○</span>
                  )}{" "}
                  {todo.title}
                </div>
                <div className="todo-description">{todo.description}</div>
                <div className="badges-row">
                  <span className={`badge badge-${todo.priority}`}>
                    {todo.priority.toUpperCase()}
                  </span>
                  <button
                    className="delete-button"
                    onClick={() => deleteTodo(todo.id)}
                    style={{
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer'
                    }}
                  >
                    ✖
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
