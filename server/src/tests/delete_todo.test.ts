
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        text: 'Test todo to delete',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    // Delete the todo
    const input: DeleteTodoInput = { id: todoId };
    const result = await deleteTodo(input);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify todo is deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should throw error when todo does not exist', async () => {
    const input: DeleteTodoInput = { id: 999 };

    expect(deleteTodo(input)).rejects.toThrow(/todo with id 999 not found/i);
  });

  it('should not affect other todos when deleting', async () => {
    // Create two test todos
    const createResult1 = await db.insert(todosTable)
      .values({
        text: 'First todo',
        completed: false
      })
      .returning()
      .execute();

    const createResult2 = await db.insert(todosTable)
      .values({
        text: 'Second todo',
        completed: true
      })
      .returning()
      .execute();

    const todoId1 = createResult1[0].id;
    const todoId2 = createResult2[0].id;

    // Delete only the first todo
    const input: DeleteTodoInput = { id: todoId1 };
    const result = await deleteTodo(input);

    expect(result.success).toBe(true);

    // Verify first todo is deleted
    const deletedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId1))
      .execute();

    expect(deletedTodos).toHaveLength(0);

    // Verify second todo still exists
    const remainingTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId2))
      .execute();

    expect(remainingTodos).toHaveLength(1);
    expect(remainingTodos[0].text).toEqual('Second todo');
    expect(remainingTodos[0].completed).toBe(true);
  });
});
