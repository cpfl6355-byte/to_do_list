import * as React from "react"
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, signInWithGoogle, logout } from './lib/firebase';
import { Button } from './components/ui/button.tsx';
import { Input } from './components/ui/input.tsx';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card.tsx';
import { Checkbox } from './components/ui/checkbox.tsx';
import { ScrollArea } from './components/ui/scroll-area.tsx';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar.tsx';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './components/ui/dropdown-menu.tsx';
import { Toaster } from './components/ui/sonner.tsx';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, LogOut, User as UserIcon, CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  userId: string;
  createdAt: Timestamp;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setTodos([]);
      return;
    }

    const q = query(
      collection(db, 'todos'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todoData: Todo[] = [];
      snapshot.forEach((doc) => {
        todoData.push({ id: doc.id, ...doc.data() } as Todo);
      });
      setTodos(todoData);
    }, (error) => {
      console.error("Firestore Error:", error);
      toast.error("Failed to fetch todos. Please check your connection.");
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'todos'), {
        text: newTodo.trim(),
        completed: false,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setNewTodo('');
      toast.success("Task added!");
    } catch (error) {
      console.error("Error adding todo:", error);
      toast.error("Failed to add task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, 'todos', id), {
        completed: !completed,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating todo:", error);
      toast.error("Failed to update task.");
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'todos', id));
      toast.success("Task deleted.");
    } catch (error) {
      console.error("Error deleting todo:", error);
      toast.error("Failed to delete task.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">FocusFlow</h1>
            <p className="text-slate-500">Simplify your day, one task at a time.</p>
          </div>
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">Welcome Back</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={signInWithGoogle} 
                className="w-full h-12 text-lg font-medium transition-all hover:scale-[1.02]"
                variant="default"
              >
                Sign in with Google
              </Button>
              <p className="text-xs text-slate-400">
                Secure authentication powered by Firebase
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">FocusFlow</h1>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.displayName?.charAt(0) || <UserIcon className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user.displayName && (
                    <p className="font-medium text-sm">{user.displayName}</p>
                  )}
                  {user.email && (
                    <p className="w-[200px] truncate text-xs text-slate-500">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Add Todo Form */}
        <Card className="border-none shadow-lg overflow-hidden">
          <CardContent className="p-4">
            <form onSubmit={handleAddTodo} className="flex gap-2">
              <Input
                type="text"
                placeholder="What needs to be done?"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                className="flex-1 h-12 border-none bg-slate-100 focus-visible:ring-primary text-lg"
                disabled={isSubmitting}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="h-12 w-12 rounded-xl shrink-0"
                disabled={!newTodo.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-6 h-6" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todo List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Your Tasks ({todos.length})
            </h2>
          </div>
          
          <ScrollArea className="h-[calc(100vh-320px)] rounded-xl">
            <div className="space-y-3 pr-4">
              <AnimatePresence mode="popLayout">
                {todos.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 space-y-3"
                  >
                    <div className="inline-flex p-4 bg-slate-100 rounded-full text-slate-400">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <p className="text-slate-500">All caught up! Time to relax.</p>
                  </motion.div>
                ) : (
                  todos.map((todo) => (
                    <motion.div
                      key={todo.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className={`group border-none shadow-sm transition-all hover:shadow-md ${todo.completed ? 'bg-slate-50/50' : 'bg-white'}`}>
                        <CardContent className="p-4 flex items-center gap-4">
                          <Checkbox
                            checked={todo.completed}
                            onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
                            className="w-6 h-6 rounded-full border-2 border-slate-200 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className={`flex-1 text-lg transition-all ${todo.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {todo.text}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTodo(todo.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
