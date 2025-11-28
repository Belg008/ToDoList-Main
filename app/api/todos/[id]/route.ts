import { NextRequest, NextResponse } from 'next/server';
import { loadTodos, saveTodos } from '@/lib/storage';

// GET /api/todos/[id] - Get specific todo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = loadTodos();
  const todo = data.todos.find(t => t.id === id);

  if (!todo) {
    return NextResponse.json(
      { error: 'Todo not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(todo);
}

// PUT /api/todos/[id] - Update todo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const data = loadTodos();
    const index = data.todos.findIndex(t => t.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    // Merge updates with existing todo
    data.todos[index] = {
      ...data.todos[index],
      ...updates,
    };

    saveTodos(data);

    return NextResponse.json({
      message: 'Todo updated!',
      todo: data.todos[index],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    );
  }
}

// DELETE /api/todos/[id] - Delete todo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = loadTodos();
  const index = data.todos.findIndex(t => t.id === id);

  if (index === -1) {
    return NextResponse.json(
      { error: 'Todo not found' },
      { status: 404 }
    );
  }

  const deleted = data.todos.splice(index, 1)[0];
  saveTodos(data);

  return NextResponse.json({
    message: 'Todo deleted!',
    todo: deleted,
  });
}
