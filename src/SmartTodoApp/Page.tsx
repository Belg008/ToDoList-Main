import React, { useState, useEffect, useCallback } from 'react';
import {
  Trash2, Plus, CheckCircle2, Circle, AlertCircle, Calendar,
  Clock, Users, Save, RefreshCw, Settings, Filter,
  ChevronDown, Edit2, Eye, EyeOff, Send
} from 'lucide-react';
import './Page.css';

// URL-en til din backend
const API_BASE_URL = 'http://localhost:8000'; // Eller URL-en du bruker for FastAPI

// --- Interfaces (Datamodeller) ---

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

// --- Hovedkomponent ---

const Page: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'set priority' | 'low' | 'medium' | 'high' | 'urgent'>('set priority');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState('');
  const [category, setCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newComment, setNewComment] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'review' | 'done'>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- API Henting (GET) ---
  const fetchTodos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/todos`);
      if (!response.ok) {
        throw new Error('Kunne ikke hente oppgaver');
      }
      const data = await response.json();
      
      const formattedTodos: Todo[] = data.todos.map((t: any) => ({
        ...t,
        id: String(t.id), // Sikrer at ID er en streng for React keys
        // Bruk Type Assertion for å matche de strenge typene vi definerte
        status: t.status as Todo['status'],
        priority: t.priority as Todo['priority'],
        
        // Sikrer at komplekse lister er initialisert
        tags: t.tags || [], 
        subtasks: t.subtasks || [],
        comments: t.comments || [],
        description: t.description || '',
        dueDate: t.dueDate || undefined,
        assignee: t.assignee || undefined,
        category: t.category || undefined,
        estimatedHours: t.estimatedHours || undefined,
        actualHours: t.actualHours || undefined,
      }));
      setTodos(formattedTodos);
    } catch (error) {
      console.error("Feil ved henting av todos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // --- Oppgavelogikk (CRUD) ---

  const resetInputFields = () => {
    setInput('');
    setDescription('');
    setPriority('set priority');
    setDueDate('');
    setAssignee('');
    setCategory('');
    setNewTag('');
    setShowAdvancedForm(false);
  };

  const handleAddTodo = async () => {
    if (!input.trim()) return;

    const newTodo: Omit<Todo, 'id' | 'subtasks' | 'comments' | 'attachments'> & { id?: string } = {
      title: input.trim(),
      description: description.trim(),
      completed: false,
      priority: priority === 'set priority' ? 'medium' : priority,
      createdAt: new Date().toISOString(),
      dueDate: dueDate || undefined,
      assignee: assignee || undefined,
      category: category || undefined,
      tags: newTag ? [newTag.trim()] : [],
      status: 'todo',
    };

    try {
      const response = await fetch(`${API_BASE_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTodo),
      });

      if (!response.ok) {
        throw new Error('Kunne ikke legge til oppgave');
      }

      const result = await response.json();
      const createdTodo: Todo = { 
        ...result.todo, 
        id: String(result.todo.id), // Sikrer at ID er string
        tags: result.todo.tags || [],
        subtasks: result.todo.subtasks || [],
        comments: result.todo.comments || [],
        status: result.todo.status as Todo['status'],
        priority: result.todo.priority as Todo['priority'],
      };
      
      setTodos((prevTodos) => [createdTodo, ...prevTodos]);
      resetInputFields();
      
    } catch (error) {
      console.error("Feil ved legging til todo:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'DELETE',
      });
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
      
    } catch (err) {
      console.error("Kunne ikke slette på serveren:", err);
    }
  };

  const handleToggle = async (id: string) => {
    const todoToUpdate = todos.find((t) => t.id === id);
    if (!todoToUpdate) return;

    const newCompletedStatus = !todoToUpdate.completed;
    const newStatus: Todo['status'] = newCompletedStatus ? 'done' : 'todo';

    // 1. Optimal oppdatering av UI
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: newCompletedStatus, status: newStatus } : todo
    );
    setTodos(updatedTodos);

    try {
      // 2. Send endringen til backend via PUT
      await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: newCompletedStatus,
          status: newStatus
        })
      });

    } catch (err) {
      console.error("Kunne ikke oppdatere på serveren:", err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Todo['status']) => {
    const todoToUpdate = todos.find((t) => t.id === id);
    if (!todoToUpdate) return;
    
    const newCompletedStatus = newStatus === 'done' ? true : false;
    
    // 1. Optimal oppdatering av UI
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, status: newStatus, completed: newCompletedStatus } : todo
    );
    setTodos(updatedTodos);

    try {
      // 2. Send endringen til backend via PUT
      await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          completed: newCompletedStatus
        })
      });

    } catch (err) {
      console.error("Kunne ikke oppdatere status på serveren:", err);
    }
  };
  
  const handleSave = async (id: string, field: keyof Todo, value: any) => {
    const todoToUpdate = todos.find((t) => t.id === id);
    if (!todoToUpdate) return;

    // Spesialhåndtering for priority og status for å sikre riktig type i state
    let typedValue = value;
    if (field === 'priority' && typeof value === 'string') {
        typedValue = value as Todo['priority'];
    } else if (field === 'status' && typeof value === 'string') {
        typedValue = value as Todo['status'];
    }

    // Oppdater UI umiddelbart
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, [field]: typedValue } : todo
    );
    setTodos(updatedTodos);
    
    const updatePayload = { [field]: typedValue };

    try {
      await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
    } catch (err) {
      console.error(`Kunne ikke lagre felt ${String(field)} på serveren:`, err);
    }
  };

  const handleAddComment = (todoId: string) => {
    if (!newComment.trim()) return;

    const newCommentObj: Comment = {
      id: Date.now().toString(),
      author: 'User', // Kan hentes fra en innlogget bruker senere
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
    };

    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              comments: [...(todo.comments || []), newCommentObj],
            }
          : todo
      )
    );
    setNewComment('');
    // Kommentarer lagres ikke til FastAPI i dette eksempelet.
  };

  // --- Filtrering og visning ---
  const filteredTodos = todos
    .filter((todo) => (filter === 'all' ? true : todo.status === filter))
    .filter((todo) => showCompleted || !todo.completed);

  const kanbanColumns = [
    { title: 'To Do', status: 'todo' as const, color: 'var(--gray-600)' },
    { title: 'In Progress', status: 'in-progress' as const, color: 'var(--primary)' },
    { title: 'Review', status: 'review' as const, color: 'var(--warning)' },
    { title: 'Done', status: 'done' as const, color: 'var(--success)' },
  ];
  
  // Hjelpefunksjon for å returnere riktig ikon basert på prioritet
  const getPriorityIcon = (p: Todo['priority']) => {
    switch (p) {
      case 'urgent':
      case 'high':
        return <AlertCircle size={16} className="text-danger" />;
      case 'medium':
        return <CheckCircle2 size={16} className="text-warning" />;
      case 'low':
        return <Circle size={16} className="text-success" />;
      default:
        return null;
    }
  };

  // Funksjon for å sortere oppgavene (brukes for listevisning)
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    const priorityOrder: { [key: string]: number } = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1, 'set priority': 0 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
  
  // Statistikk for Dashboard
  const stats = [
    { label: 'Total Tasks', value: todos.length, icon: Plus },
    { label: 'To Do', value: todos.filter(t => t.status === 'todo').length, icon: Circle, color: 'var(--gray-600)' },
    { label: 'In Progress', value: todos.filter(t => t.status === 'in-progress').length, icon: RefreshCw, color: 'var(--primary)' },
    { label: 'Completed', value: todos.filter(t => t.completed).length, icon: CheckCircle2, color: 'var(--success)' },
  ];

  // --- Render funksjon ---

  const renderTodoCard = (todo: Todo) => (
    <div key={todo.id} className={`todo-card ${todo.completed ? 'completed' : ''} priority-${todo.priority}`}>
      <div className="card-header">
        <button className="toggle-btn" onClick={() => handleToggle(todo.id)}>
          {todo.completed ? <CheckCircle2 size={20} className="text-success" /> : <Circle size={20} />}
        </button>
        <input
          type="text"
          value={todo.title}
          className={`todo-title-input ${todo.completed ? 'completed-text' : ''}`} // KORRIGERT FEIL HER
          onChange={(e) => handleSave(todo.id, 'title', e.target.value)}
          onBlur={(e) => handleSave(todo.id, 'title', e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        />
        <button className="delete-btn" onClick={() => handleDelete(todo.id)}>
          <Trash2 size={20} />
        </button>
      </div>

      <div className="card-details">
        {todo.description && (
          <p className="description-text">
            <Edit2 size={14} /> {todo.description}
          </p>
        )}
        <div className="detail-row">
          {getPriorityIcon(todo.priority)}
          <select
            value={todo.priority}
            onChange={(e) => handleSave(todo.id, 'priority', e.target.value as Todo['priority'])}
            className={`priority-select priority-${todo.priority}`}
          >
            {['set priority', 'low', 'medium', 'high', 'urgent'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {todo.dueDate && (
          <div className="detail-row">
            <Calendar size={14} />
            <span>Due: {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'N/A'}</span>
          </div>
        )}
        {todo.assignee && (
          <div className="detail-row">
            <Users size={14} />
            <span>Assigned: {todo.assignee}</span>
          </div>
        )}
        {todo.tags && todo.tags.length > 0 && (
          <div className="detail-row tags-list">
            {todo.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
          </div>
        )}
      </div>
      
      <div className="card-footer">
        <div className="status-control">
          <label>Status:</label>
          <select
            value={todo.status}
            onChange={(e) => handleStatusChange(todo.id, e.target.value as Todo['status'])}
            className={`status-select status-${todo.status}`}
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
              {todo.comments!.map((comment) => (
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
              value={newComment} // Kontrollert input for å fange kommentar
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddComment(todo.id);
                  setNewComment(''); // Nullstill etter sendt
                }
              }}
            />
            <button className="send-comment-btn" onClick={() => handleAddComment(todo.id)}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // --- JSX Rendering ---

  return (
    <div className="app-container">
      <main className="app-main">
        <div className="todo-page-wrapper">
          <div className="header-content">
            <h1 className="title">
              <CheckCircle2 size={32} /> Smart To-Do List
            </h1>
            <button className="refresh-btn" onClick={fetchTodos} disabled={loading}>
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Laster...' : 'Oppdater'}
            </button>
          </div>

          <div className="stats-container">
            {stats.map(stat => (
              <div key={stat.label} className="stat-card" style={{ borderLeftColor: stat.color }}>
                <stat.icon size={20} style={{ color: stat.color }} />
                <div className="stat-info">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="add-todo-section">
            <div className="add-input-row">
              <input
                type="text"
                placeholder="New task title..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleAddTodo();
                  }
                }}
                className="main-input"
              />
              <button onClick={handleAddTodo} className="add-btn" aria-label="Add Task">
                <Plus size={20} /> Add
              </button>
              <button
                className="toggle-advanced-btn"
                onClick={() => setShowAdvancedForm(!showAdvancedForm)}
                aria-expanded={showAdvancedForm}
                aria-label="Toggle Advanced Form"
              >
                <Settings size={20} />
                <ChevronDown size={16} className={showAdvancedForm ? 'rotate-180' : ''} />
              </button>
            </div>

            {showAdvancedForm && (
              <div className="advanced-form">
                <div className="form-grid">
                  <textarea
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="textarea-input"
                  />
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Todo['priority'])}
                  >
                    <option value="set priority" disabled>Set Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <input
                    type="date"
                    placeholder="Due Date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Assignee"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Category (e.g., Work, Personal)"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Tags (one tag only)"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="controls-section">
            <div className="filter-controls">
              <label><Filter size={16} /> Filter by Status:</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
                <option value="all">All</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            
            <div className="view-controls">
              <button
                className={`view-btn ${view === 'list' ? 'active' : ''}`}
                onClick={() => setView('list')}
              >
                List View
              </button>
              <button
                className={`view-btn ${view === 'kanban' ? 'active' : ''}`}
                onClick={() => setView('kanban')}
              >
                Kanban View
              </button>
            </div>
            
            <div className="toggle-completed">
              <button
                className="toggle-completed-btn"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                {showCompleted ? <Eye size={16} /> : <EyeOff size={16} />}
                {showCompleted ? 'Hide Completed' : 'Show Completed'}
              </button>
            </div>
          </div>

          <div className="todo-list-wrapper">
            <div className={`todos-container ${view}`}>
              {view === 'kanban' ? (
                // --- Kanban View ---
                kanbanColumns.map((column) => (
                  <div key={column.status} className="kanban-column">
                    <h3 className="column-title" style={{ borderBottomColor: column.color }}>
                      {column.title} ({filteredTodos.filter(t => t.status === column.status).length})
                    </h3>
                    <div className="column-content">
                      {filteredTodos
                        .filter((t) => t.status === column.status)
                        .sort((a, b) => { // Sorterer også i Kanban
                            const priorityOrder: { [key: string]: number } = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1, 'set priority': 0 };
                            return priorityOrder[b.priority] - priorityOrder[a.priority];
                        })
                        .map(renderTodoCard)}
                      {!filteredTodos.filter(t => t.status === column.status).length && (
                        <p className="no-tasks-msg">No tasks in this column.</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                // --- List View ---
                sortedTodos.length === 0 ? (
                  <p className="no-tasks-msg">No tasks found matching your filter/visibility settings.</p>
                ) : (
                    sortedTodos.map(renderTodoCard)
                )
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Page;
