import React, { useState, useEffect } from 'react';
import {
  Trash2, Plus, CheckCircle2, Circle, AlertCircle, Calendar,
  Clock, Users, Settings, Filter
} from 'lucide-react';
import './Page.css';

// Sett API URL - endre dette til din Coolify URL i produksjon
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'set priority' | 'low' | 'medium' | 'high' | 'urgent';
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

const Page: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'set priority' | 'low' | 'medium' | 'high' | 'urgent'>('medium');
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
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [loading, setLoading] = useState(false);

  // Hent todos fra API ved oppstart
  useEffect(() => {
    fetchTodos();
    const webhook = localStorage.getItem('n8nWebhook');
    const events = localStorage.getItem('n8nEvents');
    
    if (webhook) setN8nWebhookUrl(webhook);
    if (events) setN8nEvents(JSON.parse(events));
  }, []);

  // Lagre n8n innstillinger
  useEffect(() => {
    localStorage.setItem('n8nWebhook', n8nWebhookUrl);
    localStorage.setItem('n8nEvents', JSON.stringify(n8nEvents));
  }, [n8nWebhookUrl, n8nEvents]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/todos`);
      const data = await response.json();
      setTodos(data.todos);
    } catch (err) {
      console.error('Failed to fetch todos:', err);
      setError('Kunne ikke laste todos fra serveren');
    } finally {
      setLoading(false);
    }
  };

  const sendToN8N = async (event: string, data: any) => {
    if (!n8nWebhookUrl) return;

    const eventEnabled = n8nEvents[event as keyof typeof n8nEvents];
    if (!eventEnabled) return;

    try {
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString(),
          source: 'smart-todo-list',
        }),
      });
    } catch (err) {
      console.error('Failed to send to n8n:', err);
    }
  };

  const handleAddTodo = async () => {
    if (!input.trim()) {
      setError('Please enter a task title');
      return;
    }

    try {
      const newTodo = {
        title: input,
        description,
        completed: false,
        priority,
        status,
        dueDate: dueDate || undefined,
        assignee: assignee || undefined,
        category: category || undefined,
        estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
      };

      const response = await fetch(`${API_URL}/api/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTodo),
      });

      const data = await response.json();
      
      if (response.ok) {
        await fetchTodos();
        await sendToN8N('onCreate', data.todo);
        
        // Reset form
        setInput('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setAssignee('');
        setCategory('');
        setEstimatedHours('');
        setStatus('todo');
        setError(null);
      } else {
        setError('Kunne ikke opprette todo');
      }
    } catch (err) {
      console.error('Failed to add todo:', err);
      setError('Kunne ikke opprette todo');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/todos/${id}/toggle`, {
        method: 'PATCH',
      });

      if (response.ok) {
        await fetchTodos();
        const todo = todos.find(t => t.id === id);
        await sendToN8N('onUpdate', todo);
      }
    } catch (err) {
      console.error('Failed to toggle todo:', err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Todo['status']) => {
    try {
      const response = await fetch(`${API_URL}/api/todos/${id}/status?status=${newStatus}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        await fetchTodos();
        const todo = todos.find(t => t.id === id);
        await sendToN8N('onStatusChange', { id, status: newStatus, todo });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const todo = todos.find(t => t.id === id);
      const response = await fetch(`${API_URL}/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTodos();
        await sendToN8N('onDelete', { id, deletedTodo: todo });
      }
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  };

  const handleAddComment = async (todoId: string, commentText: string) => {
    if (!commentText.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/todos/${todoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: 'You',
          text: commentText,
        }),
      });

      if (response.ok) {
        await fetchTodos();
        const todo = todos.find(t => t.id === todoId);
        await sendToN8N('onComment', { id: todoId, comment: commentText, todo });
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
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
    active: todos.filter((t) => !t.completed).length,
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
            <p className="app-subtitle">Advanced Task Management with FastAPI & n8n</p>
          </div>
          <div className="header-right">
            <button
              onClick={() => setShowN8nSettings(!showN8nSettings)}
              className="btn-settings"
              title="n8n Settings"
            >
              <Settings size={24} />
            </button>
          </div>
        </div>

        {showN8nSettings && (
          <div className="n8n-settings-panel">
            <div className="settings-content">
              <h3>n8n Webhook Configuration</h3>
              <input
                type="text"
                value={n8nWebhookUrl}
                onChange={(e) => setN8nWebhookUrl(e.target.value)}
                placeholder="Enter your n8n webhook URL..."
                className="webhook-input"
              />
              
              <div className="event-toggles">
                <h4>Enable Event Triggers:</h4>
                {Object.entries(n8nEvents).map(([key, value]) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setN8nEvents({ ...n8nEvents, [key]: e.target.checked })}
                    />
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="app-main">
        <div className="stats-container">
          <div className="stat-item total">
            <div className="stat-header">
              <span className="stat-icon">📊</span>
              <div className="stat-details">
                <span className="stat-label">Total</span>
                <span className="stat-number">{stats.total}</span>
              </div>
            </div>
          </div>
          <div className="stat-item completed">
            <div className="stat-header">
              <span className="stat-icon">✅</span>
              <div className="stat-details">
                <span className="stat-label">Completed</span>
                <span className="stat-number">{stats.completed}</span>
              </div>
            </div>
          </div>
          <div className="stat-item active">
            <div className="stat-header">
              <span className="stat-icon">⚡</span>
              <div className="stat-details">
                <span className="stat-label">In Progress</span>
                <span className="stat-number">{stats.inProgress}</span>
              </div>
            </div>
          </div>
          <div className="stat-item urgent">
            <div className="stat-header">
              <span className="stat-icon">🔥</span>
              <div className="stat-details">
                <span className="stat-label">High Priority</span>
                <span className="stat-number">{stats.highpriority}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="layout-wrapper">
          <aside className="sidebar">
            <div className="sidebar-section">
              <h3>Status</h3>
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="sidebar-item">
                  <span>{status.replace('-', ' ')}</span>
                  <span className="badge">{count}</span>
                </div>
              ))}
            </div>

            <div className="sidebar-section">
              <h3>View Mode</h3>
              <div className="view-buttons">
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  📋
                </button>
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  📦
                </button>
                <button
                  className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                  onClick={() => setViewMode('kanban')}
                  title="Kanban View"
                >
                  📊
                </button>
              </div>
            </div>
          </aside>

          <div className="main-content">
            {error && (
              <div className="error-banner">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-card">
              <h2>New Task</h2>
              <div className="form-column-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                  placeholder="Task title..."
                  className="form-input-large"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task description..."
                  className="form-textarea"
                  rows={4}
                />
              </div>

              <div className="form-column-2">
                <div className="form-group">
                  <label>Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="form-select">
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                    <option value="urgent">🚨 Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="form-select">
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="form-input" />
                </div>

                <div className="form-group">
                  <label>Assignee</label>
                  <input type="text" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Name..." className="form-input" />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category..." className="form-input" />
                </div>

                <div className="form-group">
                  <label>Est. Hours</label>
                  <input type="number" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} placeholder="Hours..." className="form-input" />
                </div>
              </div>

              <button onClick={handleAddTodo} className="btn-primary" disabled={loading}>
                <Plus size={20} />
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>

            <div className="controls-section">
              <div className="search-box">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="🔍 Search tasks..."
                  className="search-input"
                />
              </div>

              <div className="filter-controls">
                {(['all', 'active', 'completed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`filter-btn ${filter === f ? 'active' : ''}`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className={`todos-container ${viewMode}`}>
              {loading ? (
                <div className="empty-state">
                  <div className="empty-icon">⏳</div>
                  <p>Loading todos...</p>
                </div>
              ) : filteredTodos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔭</div>
                  <p>No tasks found</p>
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
                          <CheckCircle2 size={24} className="checked" />
                        ) : (
                          <Circle size={24} />
                        )}
                      </button>
                      <div className="todo-title-section">
                        <h3 className={`todo-title ${todo.completed ? 'completed' : ''}`}>
                          {todo.title}
                        </h3>
                        {todo.category && <span className="category-badge">{todo.category}</span>}
                      </div>
                      <button onClick={() => handleDelete(todo.id)} className="btn-delete-small">
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {todo.description && (
                      <p className="todo-description">{todo.description}</p>
                    )}

                    <div className="todo-meta">
                      <div className="meta-item">
                        <span className={`priority-badge ${todo.priority}`}>{todo.priority}</span>
                      </div>
                      {todo.dueDate && (
                        <div className="meta-item">
                          <Calendar size={14} />
                          <span>{new Date(todo.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {todo.assignee && (
                        <div className="meta-item">
                          <Users size={14} />
                          <span>{todo.assignee}</span>
                        </div>
                      )}
                      {todo.estimatedHours && (
                        <div className="meta-item">
                          <Clock size={14} />
                          <span>{todo.estimatedHours}h</span>
                        </div>
                      )}
                    </div>

                    <div className="todo-status-selector">
                      <select
                        value={todo.status}
                        onChange={(e) => handleStatusChange(todo.id, e.target.value as any)}
                        className="status-select"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                    </div>

                    <div className="todo-comments">
                      {(todo.comments || []).length > 0 && (
                        <div className="comments-list">
                          {todo.comments.map((comment) => (
                            <div key={comment.id} className="comment">
                              <strong>{comment.author}:</strong> {comment.text}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="add-comment">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          className="comment-input"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const inputElement = e.target as HTMLInputElement;
                              handleAddComment(todo.id, inputElement.value);
                              inputElement.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
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
