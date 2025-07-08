
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoCompletionInput } from '../schema';
import { updateTodoCompletion } from '../handlers/update_todo_completion';
import { eq } from 'drizzle-orm';

describe('updateTodoCompletion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo completion status to true', async () => {
    // Create a todo directly in the database first
    const createResult = await db.insert(todosTable)
      .values({
        text: 'Test todo',
        completed: false
      })
      .returning()
      .execute();

    const createdTodo = createResult[0];

    // Update completion status
    const updateInput: UpdateTodoCompletionInput = {
      id: createdTodo.id,
      completed: true
    };

    const result = await updateTodoCompletion(updateInput);

    // Verify the update
    expect(result.id).toEqual(createdTodo.id);
    expect(result.text).toEqual('Test todo');
    expect(result.completed).toBe(true);
    expect(result.created_at).toEqual(createdTodo.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTodo.updated_at.getTime());
  });

  it('should update todo completion status to false', async () => {
    // Create a completed todo directly in the database first
    const createResult = await db.insert(todosTable)
      .values({
        text: 'Completed todo',
        completed: true
      })
      .returning()
      .execute();

    const createdTodo = createResult[0];

    // Now mark it as incomplete
    const updateInput: UpdateTodoCompletionInput = {
      id: createdTodo.id,
      completed: false
    };

    const result = await updateTodoCompletion(updateInput);

    // Verify the update
    expect(result.id).toEqual(createdTodo.id);
    expect(result.text).toEqual('Completed todo');
    expect(result.completed).toBe(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated todo to database', async () => {
    // Create a todo directly in the database first
    const createResult = await db.insert(todosTable)
      .values({
        text: 'Database test todo',
        completed: false
      })
      .returning()
      .execute();

    const createdTodo = createResult[0];

    // Update completion status
    const updateInput: UpdateTodoCompletionInput = {
      id: createdTodo.id,
      completed: true
    };

    await updateTodoCompletion(updateInput);

    // Verify in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].completed).toBe(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at.getTime()).toBeGreaterThan(createdTodo.updated_at.getTime());
  });

  it('should throw error when todo does not exist', async () => {
    const updateInput: UpdateTodoCompletionInput = {
      id: 999999,
      completed: true
    };

    await expect(updateTodoCompletion(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should preserve original text and created_at when updating', async () => {
    // Create a todo directly in the database first
    const createResult = await db.insert(todosTable)
      .values({
        text: 'Original todo text',
        completed: false
      })
      .returning()
      .execute();

    const createdTodo = createResult[0];

    // Update completion status
    const updateInput: UpdateTodoCompletionInput = {
      id: createdTodo.id,
      completed: true
    };

    const result = await updateTodoCompletion(updateInput);

    // Verify original fields are preserved
    expect(result.text).toEqual('Original todo text');
    expect(result.created_at).toEqual(createdTodo.created_at);
    expect(result.id).toEqual(createdTodo.id);
    expect(result.completed).toBe(true);
  });
});
