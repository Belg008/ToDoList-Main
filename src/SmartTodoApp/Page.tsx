import React, { useState, useEffect } from 'react';
import {
  Trash2, Plus, CheckCircle2, Circle, AlertCircle, Calendar,
  Clock, Users, Settings
} from 'lucide-react';
import './Page.css';

interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  dueDate?: string;
  assignee?: string;
  category?: string;
  tags?: string[];
  attachments?: string[];
  comments?: Comment[];
  estimatedHours?: number;
  actualHours?: number;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  subtasks?: Subtask[];
}

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

const Page: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('low');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState('');
  const [category, setCategory] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'review' | 'done'>('todo');
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('');
  const [showN8nSettings, setShowN8nSettings] = useState(false);
  const [n8nEvents, setN8nEvents] = useState({
    onCreate: true,
    onUpdate: true,
    onDelete: true,
    onStatusChange: true,
    onAssign: true,
    onComment: true,
  });
  const [newComment, setNewComment] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');

  useEffect(() => {
    const stored = localStorage.getItem('smartTodos');
    const webhook = localStorage.getItem('n8nWebhook');
    const events = localStorage.getItem('n8nEvents');
    
    if (stored) {
      try {
        setTodos(JSON.parse(stored));
      } catch {}
    }
    if (webhook) setN8nWebhookUrl(webhook);
    if (events) setN8nEvents(JSON.parse(events));
  }, []);

  useEffect(() => {
    localStorage.setItem('smartTodos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('n8nWebhook', n8nWebhookUrl);
    localStorage.setItem('n8nEvents', JSON.stringify(n8nEvents));
  }, [n8nWebhookUrl, n8nEvents]);

  const sendToN8N = async (event: string, data: any) => {
    if (!n8nWebhookUrl) return;
    if (!n8nEvents[event as keyof typeof n8nEvents]) return;

    try {
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString(),
          source: 'smart-todo-list',
        }),
      });
    } catch {}
  };

  const handleAddTodo = async () => {
    if (!input.trim()) {
      setError('Please enter a task title');
      return;
    }

    const newTodo: Todo = {
      id: Date.now().toString(),
      title: input,
      description,
      completed: false,
      priority,
      status,
      createdAt: new Date().toISOString(),
      dueDate: dueDate || undefined,
      assignee: assignee || undefined,
      category: category || undefined,
      estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
      subtasks: [],
      comments: [],
      tags: [],
    };

    setTodos([newTodo, ...todos]);
    await sendToN8N('onCreate', newTodo);

    setInput('');
    setDescription('');
    setPriority('low');
    setDueDate('');
    setAssignee('');
    setCategory('');
    setEstimatedHours('');
    setStatus('todo');
    setError(null);
  };

  const handleToggle = async (id: string) => {
    const updated = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updated);
    await sendToN8N('onUpdate', updated.find((t) => t.id === id)!);
  };

  const handleStatusChange = async (id: string, newStatus: Todo['status']) => {
    const updated = todos.map((todo) =>
      todo.id === id ? { ...todo, status: newStatus } : todo
    );
    setTodos(updated);
    await sendToN8N('onStatusChange', { id, status: newStatus });
  };

  const handleDelete = async (id: string) => {
    const todo = todos.find((t) => t.id === id)!;
    setTodos(todos.filter((t) => t.id !== id));
    await sendToN8N('onDelete', todo);
  };

  const handleAddComment = async (todoId: string) => {
    if (!newComment.trim()) return;

    const updated = todos.map((todo) =>
      todo.id === todoId
        ? {
            ...todo,
            comments: [
              ...(todo.comments || []),
              {
                id: Date.now().toString(),
                author: 'You',
                text: newComment,
                timestamp: new Date().toISOString(),
              },
            ],
          }
        : todo
    );

    setTodos(updated);
    await sendToN8N('onComment', updated.find((t) => t.id === todoId)!);
    setNewComment('');
  };

  const filteredTodos = todos
    .filter((todo) => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    })
    .filter((todo) =>
      todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    inProgress: todos.filter((t) => t.status === 'in-progress').length,
    highpriority: todos.filter((t) => t.priority === 'high' || t.priority === 'urgent').length,
  };

  const statusCounts = {
    todo: todos.filter((t) => t.status === 'todo').length,
    'in-progress': todos.filter((t) => t.status === 'in-progress').length,
    review: todos.filter((t) => t.status === 'review').length,
    done: todos.filter((t) => t.status === 'done').length,
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="app-title">Smart Todo Manager</h1>
            <p className="app-subtitle">Advanced Task Management with n8n Integration</p>
          </div>

          <button 
            onClick={() => setShowN8nSettings(!showN8nSettings)} 
            className="btn-settings"
          >
            <Settings size={24} />
          </button>
        </div>

        {showN8nSettings && (
          <div className="n8n-settings-panel">
            <h3>Webhook URL</h3>
            <input
              value={n8nWebhookUrl}
              onChange={(e) => setN8nWebhookUrl(e.target.value)}
              className="webhook-input"
              placeholder="Enter webhook..."
            />
          </div>
        )}
      </header>

      <main className="app-main">
        
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-icon">📊</span>
            <div className="stat-details">
              <span className="stat-label">Total</span>
              <span className="stat-number">{stats.total}</span>
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-icon">✅</span>
            <div className="stat-details">
              <span className="stat-label">Completed</span>
              <span className="stat-number">{stats.completed}</span>
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-icon">⚡</span>
            <div className="stat-details">
              <span className="stat-label">In Progress</span>
              <span className="stat-number">{stats.inProgress}</span>
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-icon">🔥</span>
            <div className="stat-details">
              <span className="stat-label">High Priority</span>
              <span className="stat-number">{stats.highpriority}</span>
            </div>
          </div>
        </div>

        <div className="layout-wrapper">
          
          {/* LEFT SIDE */}
          <aside className="sidebar">
            <h3>Status</h3>
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="sidebar-item">
                <span>{status}</span>
                <span className="badge">{count}</span>
              </div>
            ))}

            <h3>View Mode</h3>
            <div className="view-buttons">
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >📋</button>

              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >📦</button>

              <button 
                className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                onClick={() => setViewMode('kanban')}
              >📊</button>
            </div>
          </aside>

          {/* RIGHT SIDE */}
          <div className="main-panel">

            {error && (
              <div className="error-banner">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-card">
              <h2>New Task</h2>
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="form-input-large"
                placeholder="Task title..."
              />

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                placeholder="Description..."
              />

              <button className="btn-primary" onClick={handleAddTodo}>
                <Plus /> Create Task
              </button>
            </div>

            <div className={`todos-container ${viewMode}`}>
              {filteredTodos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p>No tasks yet</p>
                </div>
              ) : (
                filteredTodos.map((todo) => (
                  <div key={todo.id} className={`todo-card ${todo.status}`}>

                    <div className="todo-header">
                      <button 
                        onClick={() => handleToggle(todo.id)}
                        className="checkbox-btn"
                      >
                        {todo.completed ? (
                          <CheckCircle2 className="checked" size={24} />
                        ) : (
                          <Circle size={24} />
                        )}
                      </button>

                      <h3 className="todo-title">{todo.title}</h3>

                      <button 
                        onClick={() => handleDelete(todo.id)}
                        className="btn-delete-small"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {todo.description && (
                      <p className="todo-description">{todo.description}</p>
                    )}

                    <select
                      className="status-select"
                      value={todo.status}
                      onChange={(e) => handleStatusChange(todo.id, e.target.value as any)}
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>

                    <input
                      className="comment-input"
                      placeholder="Add comment..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setNewComment((e.target as any).value);
                          handleAddComment(todo.id);
                          (e.target as any).value = '';
                        }
                      }}
                    />
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
        
      </main>
    </div>
  );
};

export default Page;
