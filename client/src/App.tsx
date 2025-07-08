
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);

  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    setIsAddingTodo(true);
    try {
      const todoInput: CreateTodoInput = {
        text: newTodoText.trim()
      };
      const newTodo = await trpc.createTodo.mutate(todoInput);
      setTodos((prev: Todo[]) => [newTodo, ...prev]);
      setNewTodoText('');
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsAddingTodo(false);
    }
  };

  const handleToggleComplete = async (id: number, completed: boolean) => {
    try {
      const updatedTodo = await trpc.updateTodoCompletion.mutate({ id, completed });
      setTodos((prev: Todo[]) =>
        prev.map((todo: Todo) =>
          todo.id === id ? updatedTodo : todo
        )
      );
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await trpc.deleteTodo.mutate({ id });
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <CheckCircle2 className="text-blue-600" />
            Todo App
          </h1>
          <p className="text-gray-600">Stay organized and get things done! ✨</p>
        </div>

        {/* Add Todo Form */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <Plus className="text-green-600" size={20} />
              Add New Todo
            </CardTitle>
            <CardDescription>
              What would you like to accomplish today?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTodo} className="flex gap-2">
              <Input
                value={newTodoText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTodoText(e.target.value)}
                placeholder="Enter your todo item..."
                className="flex-1 border-gray-300 focus:border-blue-500"
                maxLength={500}
              />
              <Button 
                type="submit" 
                disabled={isAddingTodo || !newTodoText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isAddingTodo ? 'Adding...' : 'Add'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        {totalCount > 0 && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Progress:</span>
                  <Badge variant={completedCount === totalCount ? "default" : "secondary"} className="text-sm">
                    {completedCount} of {totalCount} completed
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)}%
                  </div>
                </div>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalCount === 0 ? 0 : (completedCount / totalCount) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Todo List */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Your Tasks</CardTitle>
            <CardDescription>
              {totalCount === 0 ? 'No tasks yet. Add one above!' : `${totalCount} task${totalCount === 1 ? '' : 's'} total`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading todos...</p>
              </div>
            ) : todos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Circle className="mx-auto mb-2 text-gray-400" size={48} />
                <p>No todos yet. Start by adding one above! 🚀</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todos.map((todo: Todo, index: number) => (
                  <div key={todo.id}>
                    <div className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                      todo.completed 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}>
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={(checked: boolean) => handleToggleComplete(todo.id, checked)}
                        className="border-gray-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          todo.completed 
                            ? 'text-green-800 line-through' 
                            : 'text-gray-900'
                        }`}>
                          {todo.text}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created {todo.created_at.toLocaleDateString()} at {todo.created_at.toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {todo.completed && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            ✓ Done
                          </Badge>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Todo</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{todo.text}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteTodo(todo.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {index < todos.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>Made with ❤️ • Stay productive and organized!</p>
        </div>
      </div>
    </div>
  );
}

export default App;
