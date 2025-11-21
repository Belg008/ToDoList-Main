import React, { useState } from "react";
import "./Page.macos.css";

type Todo = {
  id: number;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
};

export default function Page() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("low");
  const [todos, setTodos] = useState<Todo[]>([]);

  const addTodo = () => {
    if (!title.trim()) return; // ikke legg til tomme titler

    const newTodo: Todo = {
      id: Date.now(),
      title,
      description,
      priority,
    };

    setTodos([...todos, newTodo]);
    setTitle("");
    setDescription("");
    setPriority("low");
  };

  return (
    <div className="macos-layout">
      {/* SIDEBAR */}
      <aside className="macos-sidebar">
        <div className="sidebar-title">SmartTodo</div>
        <div className="sidebar-section">
          <div className="sidebar-item active">All Tasks</div>
          <div className="sidebar-item">In Progress</div>
          <div className="sidebar-item">Completed</div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="macos-content">
        {/* FORM PANEL */}
        <div className="content-card">
          <h1 className="section-title">Create new task</h1>

          <input
            className="macos-input"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="macos-textarea"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <select
            className="macos-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <button className="macos-button" onClick={addTodo}>
            Add Todo
          </button>
        </div>

        {/* TODO LIST PANEL */}
        <div className="content-card">
          <h1 className="section-title">Tasks</h1>

          <div className="todo-list">
            {todos.map((todo) => (
              <div key={todo.id} className="todo-card">
                <div className="todo-title">{todo.title}</div>
                <div className="todo-description">{todo.description}</div>
                <div className="badges-row">
                  <span className={`badge badge-${todo.priority}`}>
                    {todo.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
