// Mock users data (students, tutors, admins)
export const users = [
    {
        id: 1,
        email: "alice@example.com",
        username: "alice_student",
        password: "password123", // Mock password
        role: "student",
        profile: {
            firstName: "Alice",
            lastName: "Johnson",
            phone: "+1234567890",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
            bio: "Computer Science student interested in algorithms and web development",
            location: "New York, NY",
            joinedDate: "2024-01-15"
        }
    },
    {
        id: 2,
        email: "bob@example.com",
        username: "bob_tutor",
        password: "password123",
        role: "tutor",
        profile: {
            firstName: "Bob",
            lastName: "Smith",
            phone: "+1234567891",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            bio: "Experienced software engineer with 5+ years in full-stack development",
            location: "San Francisco, CA",
            joinedDate: "2023-08-20"
        }
    },
    {
        id: 3,
        email: "carol@example.com",
        username: "carol_admin",
        password: "admin123",
        role: "admin",
        profile: {
            firstName: "Carol",
            lastName: "Williams",
            phone: "+1234567892",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
            bio: "Platform administrator and education coordinator",
            location: "Austin, TX",
            joinedDate: "2023-05-10"
        }
    },
    {
        id: 4,
        email: "david@example.com",
        username: "david_student",
        password: "password123",
        role: "student",
        profile: {
            firstName: "David",
            lastName: "Brown",
            phone: "+1234567893",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
            bio: "Mathematics major seeking help with advanced calculus",
            location: "Boston, MA",
            joinedDate: "2024-02-01"
        }
    },
    {
        id: 5,
        email: "emma@example.com",
        username: "emma_tutor",
        password: "password123",
        role: "tutor",
        profile: {
            firstName: "Emma",
            lastName: "Davis",
            phone: "+1234567894",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
            bio: "PhD in Mathematics, specializing in calculus and linear algebra",
            location: "Chicago, IL",
            joinedDate: "2023-09-15"
        }
    }
];

// Mock current user (for authentication state)
export const currentUser = users[0]; // Alice (student)