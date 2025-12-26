// src/components/TaskList.jsx
import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import TaskCard from './TaskCard';

const TaskList = ({ userRole }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
  setLoading(true);
  try {
    const res = await api.get('/hr/tasks/');
    setTasks(res.data || []);
  } catch (err) {
    console.error('Task fetch failed:', err.response?.data || err);
    setTasks([]);
    // Optional: show toast instead of alert
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) return <p className="text-center ">Loading tasks...</p>;

  return (
    <div>
      <h2 className=" font-bold mb-6">
        {tasks.length > 0 ? 'Your Assigned Tasks' : 'No Tasks Assigned'}
      </h2>

      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-gray-100 rounded-xl">
          <p className="text-gray-600 text-lg">You're all caught up! 🎉</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onUpdate={fetchTasks} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;