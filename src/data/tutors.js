// Mock tutor profiles with detailed information
export const tutorProfiles = [
    {
        id: 1,
        userId: 2, // Bob Smith
        hourlyRate: 45,
        subjects: ["JavaScript", "React", "Node.js", "Full-Stack Development"],
        experience: "5+ years",
        education: "BS Computer Science, Stanford University",
        languages: ["English", "Spanish"],
        availability: {
            monday: ["9:00-12:00", "14:00-18:00"],
            tuesday: ["9:00-12:00", "14:00-18:00"],
            wednesday: ["9:00-12:00"],
            thursday: ["14:00-18:00"],
            friday: ["9:00-12:00", "14:00-18:00"],
            saturday: ["10:00-14:00"],
            sunday: []
        },
        rating: 4.8,
        totalReviews: 23,
        totalSessions: 156,
        responseTime: "< 1 hour",
        verified: true,
        certifications: ["AWS Certified Developer", "Google Cloud Professional"],
        teachingStyle: "Hands-on coding with real-world projects",
        specializations: ["Web Development", "API Design", "Database Management"]
    },
    {
        id: 2,
        userId: 5, // Emma Davis
        hourlyRate: 60,
        subjects: ["Calculus", "Linear Algebra", "Statistics", "Differential Equations"],
        experience: "8+ years",
        education: "PhD Mathematics, MIT",
        languages: ["English", "French"],
        availability: {
            monday: ["10:00-16:00"],
            tuesday: ["10:00-16:00"],
            wednesday: ["10:00-16:00"],
            thursday: ["10:00-16:00"],
            friday: ["10:00-14:00"],
            saturday: [],
            sunday: ["12:00-16:00"]
        },
        rating: 4.9,
        totalReviews: 41,
        totalSessions: 203,
        responseTime: "< 30 minutes",
        verified: true,
        certifications: ["Certified Math Educator", "Advanced Teaching Certificate"],
        teachingStyle: "Step-by-step problem solving with visual explanations",
        specializations: ["Advanced Calculus", "Mathematical Proofs", "Applied Mathematics"]
    }
];