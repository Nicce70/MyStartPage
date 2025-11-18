import React, { useState } from 'react';
import type { ToDoItem } from '../types';
import type { themes } from '../themes';
import { PlusIcon, TrashIcon } from './Icons';

// Simple UUID generator
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};


interface ToDoProps {
  todos: ToDoItem[];
  setTodos: React.Dispatch<React.SetStateAction<ToDoItem[]>>;
  themeClasses: typeof themes.default;
}

const ToDo: React.FC<ToDoProps> = ({ todos, setTodos, themeClasses }) => {
  const [newItemText, setNewItemText] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim() === '') return;
    const newItem: ToDoItem = {
      id: uuidv4(),
      text: newItemText.trim(),
      completed: false,
    };
    setTodos(prev => [...prev, newItem]);
    setNewItemText('');
  };

  const handleToggleItem = (id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteItem = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };
  
  const ringColorClass = themeClasses.inputFocusRing.split(' ').find(c => c.startsWith('focus:ring-'))?.replace('focus:', '') || 'ring-indigo-500';

  return (
    <div>
      <form onSubmit={handleAddItem} className="flex gap-2 mb-3">
        <input
          type="text"
          value={newItemText}
          onChange={e => setNewItemText(e.target.value)}
          placeholder="Add a new task..."
          className={`w-full p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
        />
        <button type="submit" className={`${themeClasses.buttonSecondary} font-semibold p-2 rounded-lg transition-colors`}>
          <PlusIcon className="w-4 h-4" />
        </button>
      </form>

      <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {todos.map(todo => (
          <li key={todo.id} className="group/todo flex items-center justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleItem(todo.id)}
                className={`w-4 h-4 rounded text-indigo-500 bg-slate-600 border-slate-500 focus:ring-offset-0 focus:ring-1 ${ringColorClass} mt-1 flex-shrink-0`}
              />
              <span className={`transition-colors break-all ${todo.completed ? `line-through ${themeClasses.textSubtle}` : themeClasses.modalText}`}>
                {todo.text}
              </span>
            </div>
            <button
              onClick={() => handleDeleteItem(todo.id)}
              className={`p-1 ${themeClasses.iconMuted} hover:text-red-400 rounded-full ${themeClasses.buttonIconHoverBg} transition-colors opacity-0 group-hover/todo:opacity-100 flex-shrink-0`}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </li>
        ))}
        {todos.length === 0 && (
            <p className={`text-center py-4 text-sm ${themeClasses.textSubtle}`}>No tasks yet. Add one!</p>
        )}
      </ul>
    </div>
  );
};

export default ToDo;