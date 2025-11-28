'use client';

import { useState, useEffect } from "react";
import "./page.css";

type Todo = {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  status: string;
  createdAt: string;
};

type FilterType = "all" | "active" | "completed";

export default function HomePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("low");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  // Fetch todos from backend
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/todos');
      if (!response.ok) throw new Error('Failed to fetch todos');
      const data = await response.json();
      setTodos(data.todos);
      setError("");
    } catch (err) {
      setError("Failed to load todos. Please try again.");
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
      const response = await fetch('/api/todos', {
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
      const response = await fetch(`/api/todos/${id}/toggle`, {
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
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete todo');
      await fetchTodos();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter todos based on selected filter
  const getFilteredTodos = () => {
    switch (filter) {
      case "active":
        return todos.filter(todo => !todo.completed);
      case "completed":
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  };

  const filteredTodos = getFilteredTodos();
  const activeCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="macos-layout">
      <aside className="macos-sidebar">
        <div className="sidebar-title">SmartTodo</div>
        <div className="sidebar-section">
          <div 
            className={`sidebar-item ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Tasks
            <span className="count-badge">{todos.length}</span>
          </div>
          <div 
            className={`sidebar-item ${filter === "active" ? "active" : ""}`}
            onClick={() => setFilter("active")}
          >
            Active
            <span className="count-badge">{activeCount}</span>
          </div>
          <div 
            className={`sidebar-item ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Finished
            <span className="count-badge">{completedCount}</span>
          </div>
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

        {filter !== "completed" && (
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
        )}

        <div className="content-card">
          <h1 className="section-title">
            {filter === "all" && `All Tasks (${filteredTodos.length})`}
            {filter === "active" && `Active Tasks (${filteredTodos.length})`}
            {filter === "completed" && `Finished Tasks (${filteredTodos.length})`}
          </h1>

          {loading && <div>Loading...</div>}

          {filteredTodos.length === 0 && !loading && (
            <div className="empty-state">
              {filter === "completed" 
                ? "No completed tasks yet. Keep working! 💪" 
                : filter === "active"
                ? "No active tasks. You're all caught up! 🎉"
                : "No tasks yet. Create your first task above! ✨"}
            </div>
          )}

          <div className="todo-list">
            {filteredTodos.map((todo) => (
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
                  {todo.completed && (
                    <span className="badge badge-completed">FINISHED</span>
                  )}
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
