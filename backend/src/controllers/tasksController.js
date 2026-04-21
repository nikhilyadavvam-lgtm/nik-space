const Task = require('../models/Task');

// GET /api/tasks
async function getTasks(req, res) {
  try {
    const { status } = req.query;
    const query = { userId: req.userId };
    if (status) query.status = status;

    const tasks = await Task.find(query)
      .sort({ priority: -1, updatedAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}

// POST /api/tasks
async function createTask(req, res) {
  try {
    const { title, description, priority, dueDate, tags } = req.body;
    const task = await Task.create({
      userId: req.userId,
      title,
      description: description || '',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: tags || [],
    });
    res.status(201).json(task);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
}

// PUT /api/tasks/:id
async function updateTask(req, res) {
  try {
    const { title, description, status, priority, dueDate, tags } = req.body;
    const update = { updatedAt: new Date() };
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (status !== undefined) update.status = status;
    if (priority !== undefined) update.priority = priority;
    if (dueDate !== undefined) update.dueDate = dueDate;
    if (tags !== undefined) update.tags = tags;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
}

// DELETE /api/tasks/:id
async function deleteTask(req, res) {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask };
