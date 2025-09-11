// Mock tasks for study planner
export const tasks = [
    {
        id: 1,
        userId: 1, // Alice
        title: "Complete React Router tutorial",
        description: "Go through the official React Router documentation and build a small multi-page app",
        category: "Web Development",
        priority: "high",
        status: "in-progress",
        progress: 65,
        dueDate: "2024-09-18",
        createdAt: "2024-09-10",
        updatedAt: "2024-09-11",
        tags: ["React", "Frontend", "Tutorial"],
        estimatedHours: 4,
        actualHours: 2.5
    },
    {
        id: 2,
        userId: 1,
        title: "Practice calculus integration problems",
        description: "Solve 20 integration problems from chapter 7",
        category: "Mathematics",
        priority: "medium",
        status: "pending",
        progress: 0,
        dueDate: "2024-09-16",
        createdAt: "2024-09-08",
        updatedAt: "2024-09-08",
        tags: ["Calculus", "Practice", "Integration"],
        estimatedHours: 3,
        actualHours: 0
    },
    {
        id: 3,
        userId: 1,
        title: "Read Chapter 5: Algorithms",
        description: "Read and summarize the sorting algorithms chapter",
        category: "Computer Science",
        priority: "low",
        status: "completed",
        progress: 100,
        dueDate: "2024-09-12",
        createdAt: "2024-09-05",
        updatedAt: "2024-09-11",
        tags: ["Algorithms", "Reading", "CS"],
        estimatedHours: 2,
        actualHours: 2.5
    },
    {
        id: 4,
        userId: 1,
        title: "Prepare for midterm exam",
        description: "Review all materials and create study notes for statistics midterm",
        category: "Statistics",
        priority: "high",
        status: "pending",
        progress: 0,
        dueDate: "2024-09-25",
        createdAt: "2024-09-11",
        updatedAt: "2024-09-11",
        tags: ["Exam", "Statistics", "Review"],
        estimatedHours: 8,
        actualHours: 0
    }
];

// Task categories
export const taskCategories = [
    "Web Development",
    "Mathematics",
    "Computer Science",
    "Statistics",
    "Physics",
    "General Studies"
];

// Task priorities
export const taskPriorities = [
    { value: "low", label: "Low", color: "green" },
    { value: "medium", label: "Medium", color: "yellow" },
    { value: "high", label: "High", color: "red" }
];

// Task statuses
export const taskStatuses = [
    { value: "pending", label: "Pending", color: "gray" },
    { value: "in-progress", label: "In Progress", color: "blue" },
    { value: "completed", label: "Completed", color: "green" }
];