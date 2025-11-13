import apiClient from './apiClient';

class TaskService {
    // Get user's tasks
    async getTasks(filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            // Add filters to query params
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.priority) queryParams.append('priority', filters.priority);
            if (filters.dueDate) queryParams.append('dueDate', filters.dueDate);
            if (filters.completed !== undefined) queryParams.append('completed', filters.completed);
            if (filters.sessionId) queryParams.append('sessionId', filters.sessionId);
            if (filters.subjectId) queryParams.append('subjectId', filters.subjectId);

            const endpoint = `/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await apiClient.get(endpoint);

            return response.tasks || response;
        } catch (error) {
            console.error('[TaskService] Get tasks failed:', error);
            throw error;
        }
    }

    // Get task by ID
    async getTaskById(taskId) {
        try {
            const response = await apiClient.get(`/tasks/${taskId}`);
            return response.task || response;
        } catch (error) {
            console.error('[TaskService] Get task by ID failed:', error);
            throw error;
        }
    }

    // Create new task
    async createTask(taskData) {
        try {
            const response = await apiClient.post('/tasks', {
                title: taskData.title,
                description: taskData.description,
                priority: taskData.priority || 'medium',
                dueDate: taskData.dueDate,
                sessionId: taskData.sessionId, // optional - link to specific session
                subjectId: taskData.subjectId, // optional - link to subject
                estimatedHours: taskData.estimatedHours, // in hours
                tags: taskData.tags || [],
            });

            return response;
        } catch (error) {
            console.error('[TaskService] Create task failed:', error);
            throw error;
        }
    }

    // Update task
    async updateTask(taskId, updateData) {
        try {
            const response = await apiClient.put(`/tasks/${taskId}`, updateData);
            return response;
        } catch (error) {
            console.error('[TaskService] Update task failed:', error);
            throw error;
        }
    }

    // Delete task
    async deleteTask(taskId) {
        try {
            const response = await apiClient.delete(`/tasks/${taskId}`);
            return response;
        } catch (error) {
            console.error('[TaskService] Delete task failed:', error);
            throw error;
        }
    }

    // Mark task as completed
    async completeTask(taskId) {
        try {
            const response = await apiClient.put(`/tasks/${taskId}/complete`);
            return response;
        } catch (error) {
            console.error('[TaskService] Complete task failed:', error);
            throw error;
        }
    }

    // Mark task as incomplete
    async uncompleteTask(taskId) {
        try {
            const response = await apiClient.put(`/tasks/${taskId}/incomplete`);
            return response;
        } catch (error) {
            console.error('[TaskService] Uncomplete task failed:', error);
            throw error;
        }
    }

    // Get tasks by priority
    async getTasksByPriority(priority) {
        try {
            return await this.getTasks({ priority });
        } catch (error) {
            console.error('[TaskService] Get tasks by priority failed:', error);
            throw error;
        }
    }

    // Get completed tasks
    async getCompletedTasks() {
        try {
            return await this.getTasks({ completed: true });
        } catch (error) {
            console.error('[TaskService] Get completed tasks failed:', error);
            throw error;
        }
    }

    // Get pending tasks
    async getPendingTasks() {
        try {
            return await this.getTasks({ completed: false });
        } catch (error) {
            console.error('[TaskService] Get pending tasks failed:', error);
            throw error;
        }
    }

    // Get overdue tasks
    async getOverdueTasks() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await apiClient.get(`/tasks/overdue?date=${today}`);
            return response.tasks || response;
        } catch (error) {
            console.error('[TaskService] Get overdue tasks failed:', error);
            throw error;
        }
    }

    // Get tasks due today
    async getTodayTasks() {
        try {
            const today = new Date().toISOString().split('T')[0];
            return await this.getTasks({ dueDate: today });
        } catch (error) {
            console.error('[TaskService] Get today tasks failed:', error);
            throw error;
        }
    }

    // Get tasks for a specific session
    async getSessionTasks(sessionId) {
        try {
            return await this.getTasks({ sessionId });
        } catch (error) {
            console.error('[TaskService] Get session tasks failed:', error);
            throw error;
        }
    }

    // Update task progress
    async updateTaskProgress(taskId, progress) {
        try {
            const response = await apiClient.put(`/tasks/${taskId}/progress`, {
                progress: Math.max(0, Math.min(100, progress)) // Ensure progress is between 0-100
            });
            return response;
        } catch (error) {
            console.error('[TaskService] Update task progress failed:', error);
            throw error;
        }
    }

    // Add note to task
    async addTaskNote(taskId, note) {
        try {
            const response = await apiClient.post(`/tasks/${taskId}/notes`, {
                note
            });
            return response;
        } catch (error) {
            console.error('[TaskService] Add task note failed:', error);
            throw error;
        }
    }

    // Get task statistics
    async getTaskStats() {
        try {
            const response = await apiClient.get('/tasks/stats');
            return response.stats || response;
        } catch (error) {
            console.error('[TaskService] Get task stats failed:', error);
            throw error;
        }
    }

    // Bulk update tasks
    async bulkUpdateTasks(taskIds, updateData) {
        try {
            const response = await apiClient.put('/tasks/bulk-update', {
                taskIds,
                updateData
            });
            return response;
        } catch (error) {
            console.error('[TaskService] Bulk update tasks failed:', error);
            throw error;
        }
    }

    // Search tasks
    async searchTasks(searchQuery) {
        try {
            const response = await apiClient.get(`/tasks/search?q=${encodeURIComponent(searchQuery)}`);
            return response.tasks || response;
        } catch (error) {
            console.error('[TaskService] Search tasks failed:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const taskService = new TaskService();
export default taskService;