// Mock users data (students, tutors, admins)
export const users = [
    {
        id: 1,
        email: "sanjana@example.com",
        username: "sanjana_student",
        password: "demo",
        role: "student",
        profile: {
            firstName: "Sanjana",
            lastName: "RP",
            phone: "+1234567890",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
            bio: "Computer Science student interested in algorithms and web development",
            location: "New York, NY",
            joinedDate: "2024-01-15"
        }
    },
    {
        id: 2,
        email: "abhinay@example.com",
        username: "abhinay_admin",
        password: "demo",
        role: "admin",
        profile: {
            firstName: "Abhinay",
            lastName: "Kotla",
            phone: "+1234567891",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            bio: "Platform administrator and education coordinator with software engineering background",
            location: "San Francisco, CA",
            joinedDate: "2023-08-20"
        }
    },
    {
        id: 3,
        email: "saisree@example.com",
        username: "saisree_tutor",
        password: "demo",
        role: "tutor",
        profile: {
            firstName: "Sai",
            lastName: "Sree",
            phone: "+1234567892",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
            bio: "Experienced educator specializing in computer science and programming",
            location: "Austin, TX",
            joinedDate: "2023-05-10"
        }
    },
    {
        id: 4,
        email: "hemasri@example.com",
        username: "hemasri_tutor",
        password: "demo",
        role: "tutor",
        profile: {
            firstName: "Hema",
            lastName: "Sri",
            phone: "+1234567893",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
            bio: "PhD in Mathematics, specializing in calculus and linear algebra",
            location: "Chicago, IL",
            joinedDate: "2023-09-15"
        }
    },
    {
        id: 5,
        email: "rakesh@example.com",
        username: "rakesh_tutor",
        password: "demo",
        role: "tutor",
        profile: {
            firstName: "Rakesh",
            lastName: "Surampalli",
            phone: "+1234567894",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
            bio: "Professional physicist with expertise in quantum mechanics and thermodynamics",
            location: "Boston, MA",
            joinedDate: "2023-08-20"
        }
    },
    {
        id: 6,
        email: "sidhu@example.com",
        username: "sidhu_tutor",
        password: "demo",
        role: "tutor",
        profile: {
            firstName: "Sidhu",
            lastName: "Vinayak",
            phone: "+1234567895",
            avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
            bio: "Spanish literature professor and native speaker specializing in language instruction",
            location: "Miami, FL",
            joinedDate: "2023-07-10"
        }
    }
];

// Mock current user (for authentication state)
export const currentUser = users[0]; // Alice (student)