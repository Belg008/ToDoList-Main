import React, { useState, useEffect } from "react";
import "./Page.macos.css";

type Todo = {
  id: number;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
};

export default function Page() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("low");
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("todos");
    if (saved) setTodos(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (!title.trim()) return;
    const newTodo: Todo = {
      id: Date.now(),
      title,
      description,
      priority,
      completed: false,
    };
    setTodos([newTodo, ...todos]);
    setTitle("");
    setDescription("");
    setPriority("low");
  };

  const toggleComplete = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
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
        <div className="content-card fade-in">
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
            onChange={(e) =>
              setPriority(e.target.value as "low" | "medium" | "high")
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <button className="macos-button" onClick={addTodo}>
            Add Todo
          </button>
        </div>

        <div className="content-card">
          <h1 className="section-title">Tasks</h1>

          <div className="todo-list">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={`todo-card ${todo.completed ? "completed" : ""}`}
              >
                <div
                  className="todo-title"
                  onClick={() => toggleComplete(todo.id)}
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
