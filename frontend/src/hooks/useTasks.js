import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load tasks with professional error logging
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.getTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err);
      console.error('[Lifecycle Hook Error]:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTask = async (title, description = "") => {
    try {
      const { data } = await api.createTask({ title, description });
      setTasks((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      setError("Task initialization failed. Check input constraints.");
      throw err;
    }
  };

  const moveTask = async (task) => {
    // State Machine logic matching the Backend service
    const sequence = { 
      'open': 'in_progress', 
      'in_progress': 'resolved', 
      'resolved': 'open' 
    };
    
    const nextStatus = sequence[task.status];
    
    try {
      const { data } = await api.transitionTask(task.id, nextStatus);
      // Implements "Single Source of Truth" by replacing the object in state
      setTasks((prev) => prev.map((t) => (t.id === data.id ? data : t)));
    } catch (err) {
      setError(`Transition illegal: Cannot move ${task.status} directly.`);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return { tasks, loading, error, addTask, moveTask, refresh: loadTasks };
};