from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List

# Opprett FastAPI app EN gang
app = FastAPI()

# Legg til CORS-støtte umiddelbart etter app-opprettelse
# Dette gjør at API-et kan nås fra andre nettsider/domener
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tillater requests fra alle domener
    allow_methods=["*"],  # Tillater alle HTTP metoder (GET, POST, PUT, DELETE)
    allow_headers=["*"],  # Tillater alle HTTP-headers i forespørselene
)

# Initialiser data EN gang med noen eksempel-todos
todos = [
    {"id": 1, "title": "Lær FastAPI", "completed": False, "priority": "medium"},
    {"id": 2, "title": "Lag to-do app", "completed": False, "priority": "high"}
]
next_id = 3  # Holder styr på neste ID som skal brukesa

# Pydantic-modeller for validering av data
class Todo(BaseModel):
    title: str
    completed: bool = False
    priority: str = "medium"

class TodoUpdate(BaseModel):
    # Tillater partial updates - alle felt er optional
    title: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[str] = None


#forespørsmål for AI-en
class AIRequest(BaseModel):
    # Modell for AI-forespørsler fra nettsiden
    text: str
    action: str
    todos: Optional[List[dict]] = None

# --- ROUTES / ENDEPUNKTER ---

@app.get("/")
def home():
    """Hjemmeside-endepunkt som returnerer en velkomstmelding"""
    return {"message": "Velkommen til to-do appen!"}

@app.get("/todos")
def get_todos(completed: Optional[bool] = None):
    """
    Henter alle todos eller filtrerer basert på completed status
    Query parameter: ?completed=true eller ?completed=false
    """
    if completed is None:
        return {"todos": todos}
    
    # Filtrer basert på completed status
    filtered = [t for t in todos if t["completed"] == completed]
    return {"todos": filtered}

@app.get("/todos/{todo_id}")
def get_todo(todo_id: int):
    """
    Henter en spesifikk todo basert på ID
    Path parameter: /todos/1
    """
    for todo in todos:
        if todo["id"] == todo_id:
            return todo
    
    raise HTTPException(status_code=404, detail="Todo ikke funnet")

#en liten health check
@app.get("/health")
def health_check():
    return {"status": "ok", "todos_count": len(todos)}

@app.post("/todos")
def create_todo(todo: Todo):
    """
    Oppretter en ny todo
    Body: {"title": "Min nye oppgave", "completed": false, "priority": "high"}
    """
    global next_id
    
    new_todo = {
        "id": next_id,
        "title": todo.title,
        "completed": todo.completed,
        "priority": todo.priority
    }
    
    todos.append(new_todo)
    next_id += 1
    
    return {"message": "Todo opprettet!", "todo": new_todo}

@app.put("/todos/{todo_id}")
def update_todo(todo_id: int, updates: TodoUpdate):
    """
    Oppdaterer en eksisterende todo
    Kun feltene som sendes inn blir oppdatert (partial update)
    """
    for todo in todos:
        if todo["id"] == todo_id:
            if updates.title is not None:
                todo["title"] = updates.title
            if updates.completed is not None:
                todo["completed"] = updates.completed
            if updates.priority is not None:
                todo["priority"] = updates.priority
            return {"message": "Todo oppdatert!", "todo": todo}
    
    raise HTTPException(status_code=404, detail="Todo ikke funnet")

@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int):
    """
    Sletter en todo basert på ID
    """
    for i, todo in enumerate(todos):
        if todo["id"] == todo_id:
            deleted = todos.pop(i)
            return {"message": "Todo slettet!", "todo": deleted}
    
    raise HTTPException(status_code=404, detail="Todo ikke funnet")

# --- AI ANALYSE ENDEPUNKT ---

@app.post("/ai/analyze")
def analyze_task(request: AIRequest):
    
    
    """
    AI-endepunkt som analyserer oppgaver og gir intelligente forslag
    Støtter actions: estimate, priority, plan, tips
    """
    text = request.text.lower()
    action = request.action

    

    # 1. ESTIMERE TIDSBRUK
    # Sjekker om action er "estimate" og returnerer estimert tid i minutter
    if action == "estimate":
        time = 30  # Standard tid er 30 minutter

        if any(word in text for word in ["rapport", "prosjekt"]):
            time = 120
        elif any(word in text for word in ["møte"]):
            time = 60
        elif any(word in text for word in ["epost", "ringe"]):
            time = 15

        return {"estimated_time": time}
    
    # 2. PRIORITERING
    # Detekterer prioritet basert på nøkkelord i teksten
    elif action == "priority":
        priority = "medium"

        if any(word in text for word in ["viktig", "urgent", "asap"]):
            priority = "high"
        elif any(word in text for word in ["kanskje", "senere"]):
            priority = "low"

        return {"priority": priority}
    


    # 3. DAGLIG PLAN
    # Lager en prioritert plan for dagen basert på eksisterende todos
    elif action == "plan":
        if not request.todos:
            return {"plan": []}
        
        # Sorterer todos: high prioritet først, deretter medium
        #t for t ... går gjennom hver todo (ordbøl
        high = [t for t in request.todos if t.get("priority") == "high"]
        medium = [t for t in request.todos if t.get("priority") == "medium"]
        
        # Returner maksimalt 10 oppgaver (5 high + 5 medium)
        plan = high[:5] + medium[:5]
        return {"plan": plan}
    


    
    # 4. TIPS
    # Gir produktivitetstips til brukeren
    elif action == "tips":
        tips = [
            "Start med de viktigste oppgavene først",
            "Ta pauser hver 25. minutt (Pomodoro-teknikk)",
            "Skru av varsler mens du jobber"
        ]
        return {"tips": tips}
    


    
    # 5. FORSLAG TIL SUBTASKS
    # Genererer subtasks basert på oppgavetype
    else:
        priority = "medium"
        
        # Detekter prioritetl
        if any(word in text for word in ["viktig", "urgent", "asap"]):
            priority = "high"
        elif any(word in text for word in ["kanskje", "senere"]):
            priority = "low"
        
        # Generer subtasks basert på oppgavetype
        subtasks = []
        if "rapport" in text or "oppgave" in text:
            subtasks = ["Research og planlegging", "Skriv utkast", "Gjennomgang og sjekk"]
        else:
            subtasks = ["Start oppgaven", "Gjør ferdig", "Kvalitetssjekk"]
        
        return {
            "suggested_priority": priority,
            "subtasks": subtasks,
            "tips": ["Sett av nok tid", "Fjern distraksjoner"]
        }


