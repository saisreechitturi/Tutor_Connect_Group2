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
        userId: 4, // Emma Davis
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
    },
    {
        id: 3,
        userId: 5, // David Wilson
        hourlyRate: 55,
        subjects: ["Physics", "Quantum Mechanics", "Thermodynamics", "Mechanics"],
        experience: "7+ years",
        education: "PhD Physics, Harvard University",
        languages: ["English"],
        availability: {
            monday: ["9:00-17:00"],
            tuesday: ["9:00-17:00"],
            wednesday: ["9:00-17:00"],
            thursday: ["9:00-17:00"],
            friday: ["9:00-15:00"],
            saturday: ["10:00-14:00"],
            sunday: []
        },
        rating: 4.7,
        totalReviews: 35,
        totalSessions: 178,
        responseTime: "< 2 hours",
        verified: true,
        certifications: ["PhD Physics", "Quantum Computing Certificate"],
        teachingStyle: "Conceptual understanding with practical applications",
        specializations: ["Quantum Physics", "Nuclear Physics", "Advanced Mechanics"]
    },
    {
        id: 4,
        userId: 6, // Maria Garcia
        hourlyRate: 35,
        subjects: ["Spanish", "Literature", "Language Arts", "ESL"],
        experience: "6+ years",
        education: "MA Spanish Literature, University of Barcelona",
        languages: ["Spanish", "English", "Catalan"],
        availability: {
            monday: ["8:00-16:00"],
            tuesday: ["8:00-16:00"],
            wednesday: ["8:00-16:00"],
            thursday: ["8:00-16:00"],
            friday: ["8:00-16:00"],
            saturday: ["9:00-13:00"],
            sunday: ["9:00-13:00"]
        },
        rating: 4.8,
        totalReviews: 52,
        totalSessions: 245,
        responseTime: "< 1 hour",
        verified: true,
        certifications: ["Native Spanish Speaker", "DELE Examiner Certificate"],
        teachingStyle: "Immersive language learning with cultural context",
        specializations: ["Conversational Spanish", "Spanish Literature", "Business Spanish"]
    }
];