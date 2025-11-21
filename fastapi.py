from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from datetime import datetime

app = FastAPI()

# CORS - viktig for å tillate frontend å kommunisere med backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # I produksjon, sett dette til din frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models som matcher frontend
class Comment(BaseModel):
    id: str
    author: str
    text: str
    timestamp: str

class Subtask(BaseModel):
    id: str
    title: str
    completed: bool

class Todo(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    completed: bool = False
    priority: str = "medium"
    createdAt: Optional[str] = None
    dueDate: Optional[str] = None
    assignee: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = []
    comments: Optional[List[Comment]] = []
    estimatedHours: Optional[int] = None
    actualHours: Optional[int] = None
    status: str = "todo"
    subtasks: Optional[List[Subtask]] = []

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[str] = None
    dueDate: Optional[str] = None
    assignee: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    estimatedHours: Optional[int] = None

class CommentCreate(BaseModel):
    author: str
    text: str

# In-memory database (i produksjon, bruk ekte database)
todos = []
next_id = 1

@app.get("/")
def home():
    """Health check endpoint"""
    return {"status": "ok", "message": "Smart Todo API"}

@app.get("/api/todos")
def get_todos(
    completed: Optional[bool] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee: Optional[str] = None
):
    """
    Hent alle todos med valgfri filtering
    """
    filtered_todos = todos.copy()
    
    if completed is not None:
        filtered_todos = [t for t in filtered_todos if t["completed"] == completed]
    
    if status:
        filtered_todos = [t for t in filtered_todos if t["status"] == status]
    
    if priority:
        filtered_todos = [t for t in filtered_todos if t["priority"] == priority]
    
    if assignee:
        filtered_todos = [t for t in filtered_todos if t.get("assignee") == assignee]
    
    return {"todos": filtered_todos, "count": len(filtered_todos)}

@app.get("/api/todos/{todo_id}")
def get_todo(todo_id: str):
    """
    Hent en spesifikk todo
    """
    for todo in todos:
        if todo["id"] == todo_id:
            return todo
    
    raise HTTPException(status_code=404, detail="Todo ikke funnet")

@app.post("/api/todos")
def create_todo(todo: Todo):
    """
    Opprett ny todo
    """
    global next_id
    
    new_todo = todo.dict()
    new_todo["id"] = str(next_id)
    new_todo["createdAt"] = datetime.now().isoformat()
    
    if not new_todo.get("comments"):
        new_todo["comments"] = []
    if not new_todo.get("tags"):
        new_todo["tags"] = []
    if not new_todo.get("subtasks"):
        new_todo["subtasks"] = []
    
    todos.insert(0, new_todo)  # Legg til først i listen
    next_id += 1
    
    return {"message": "Todo opprettet!", "todo": new_todo}

@app.put("/api/todos/{todo_id}")
def update_todo(todo_id: str, updates: TodoUpdate):
    """
    Oppdater eksisterende todo (partial update)
    """
    for i, todo in enumerate(todos):
        if todo["id"] == todo_id:
            update_data = updates.dict(exclude_unset=True)
            
            for key, value in update_data.items():
                if value is not None:
                    todos[i][key] = value
            
            return {"message": "Todo oppdatert!", "todo": todos[i]}
    
    raise HTTPException(status_code=404, detail="Todo ikke funnet")

@app.patch("/api/todos/{todo_id}/toggle")
def toggle_todo(todo_id: str):
    """
    Toggle completed status
    """
    for i, todo in enumerate(todos):
        if todo["id"] == todo_id:
            todos[i]["completed"] = not todos[i]["completed"]
            return {"message": "Status endret!", "todo": todos[i]}
    
    raise HTTPException(status_code=404, detail="Todo ikke funnet")

@app.patch("/api/todos/{todo_id}/status")
def update_status(todo_id: str, status: str):
    """
    Oppdater kun status
    """
    valid_statuses = ["todo", "in-progress", "review", "done"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status må være en av: {valid_statuses}")
    
    for i, todo in enumerate(todos):
        if todo["id"] == todo_id:
            todos[i]["status"] = status
            return {"message": "Status oppdatert!", "todo": todos[i]}
    
    raise HTTPException(status_code=404, detail="Todo ikke funnet")

@app.post("/api/todos/{todo_id}/comments")
def add_comment(todo_id: str, comment: CommentCreate):
    """
    Legg til kommentar på todo
    """
    for i, todo in enumerate(todos):
        if todo["id"] == todo_id:
            new_comment = {
                "id": str(datetime.now().timestamp()),
                "author": comment.author,
                "text": comment.text,
                "timestamp": datetime.now().isoformat()
            }
            
            if not todos[i].get("comments"):
                todos[i]["comments"] = []
            
            todos[i]["comments"].append(new_comment)
            
            return {"message": "Kommentar lagt til!", "comment": new_comment, "todo": todos[i]}
    
    raise HTTPException(status_code=404, detail="Todo ikke funnet")

@app.delete("/api/todos/{todo_id}")
def delete_todo(todo_id: str):
    """
    Slett todo
    """
    for i, todo in enumerate(todos):
        if todo["id"] == todo_id:
            deleted = todos.pop(i)
            return {"message": "Todo slettet!", "todo": deleted}
    
    raise HTTPException(status_code=404, detail="Todo ikke funnet")

@app.get("/api/stats")
def get_stats():
    """
    Hent statistikk
    """
    return {
        "total": len(todos),
        "completed": len([t for t in todos if t["completed"]]),
        "active": len([t for t in todos if not t["completed"]]),
        "inProgress": len([t for t in todos if t["status"] == "in-progress"]),
        "highPriority": len([t for t in todos if t["priority"] in ["high", "urgent"]]),
        "statusCounts": {
            "todo": len([t for t in todos if t["status"] == "todo"]),
            "in-progress": len([t for t in todos if t["status"] == "in-progress"]),
            "review": len([t for t in todos if t["status"] == "review"]),
            "done": len([t for t in todos if t["status"] == "done"])
        }
    }

@app.delete("/api/todos")
def clear_all_todos():
    """
    Slett alle todos (for testing)
    """
    global todos, next_id
    todos = []
    next_id = 1
    return {"message": "Alle todos slettet!"}

# Health check for Coolify
@app.get("/health")
def health_check():
    return {"status": "healthy", "todos_count": len(todos)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
