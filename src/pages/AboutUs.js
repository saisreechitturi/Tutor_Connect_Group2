import React from 'react';
import { Users, Target, Heart, Award, CheckCircle, Mail, Phone, MapPin } from 'lucide-react';

const AboutUs = () => {
    const features = [
        {
            icon: Users,
            title: "Expert Tutors",
            description: "Connect with verified tutors across various subjects with proven track records and excellent reviews."
        },
        {
            icon: Target,
            title: "Personalized Learning",
            description: "AI-powered study plans tailored to your learning style, pace, and academic goals."
        },
        {
            icon: Heart,
            title: "Student-Centered Approach",
            description: "We prioritize student success with flexible scheduling, affordable rates, and comprehensive support."
        },
        {
            icon: Award,
            title: "Quality Assurance",
            description: "All tutors are thoroughly vetted, and sessions are monitored to ensure the highest quality education."
        }
    ];

    const teamMembers = [
        {
            name: "Sai Sree Chitturi",
            role: "Chief Executive Officer",
            description: "Visionary leader driving innovation in educational technology and student success."
        },
        {
            name: "Sai Prathyusha Celoth",
            role: "Head of Academic Affairs",
            description: "Educational expert developing curriculum standards and tutor quality assurance programs."
        },
        {
            name: "Chandan Cheni",
            role: "Head of Product Development",
            description: "Product strategist focused on creating intuitive learning experiences and user engagement."
        },
        {
            name: "Adarsh Cherukuri",
            role: "Chief Technology Officer",
            description: "Technology expert specializing in AI-powered learning solutions and platform architecture."
        },
        {
            name: "Maatheswaran Kannan Chellapandian",
            role: "Head of Operations",
            description: "Operations specialist ensuring seamless platform performance and user satisfaction."
        }
    ];

    const achievements = [
        { number: "50,000+", label: "Students Helped" },
        { number: "2,000+", label: "Expert Tutors" },
        { number: "500,000+", label: "Sessions Completed" },
        { number: "98%", label: "Student Satisfaction" }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">About TutorConnect</h1>
                        <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
                            Empowering students worldwide through personalized tutoring and AI-powered learning solutions
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Mission Section */}
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            To democratize quality education by connecting students with expert tutors and providing
                            AI-powered learning tools that adapt to individual needs, making academic success accessible to everyone.
                        </p>
                    </div>

                    {/* Achievement Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                        {achievements.map((achievement, index) => (
                            <div key={index} className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                                    {achievement.number}
                                </div>
                                <div className="text-gray-600 font-medium">{achievement.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Features Section */}
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose TutorConnect?</h2>
                        <p className="text-lg text-gray-600">
                            We're committed to providing the best learning experience through innovation and dedication
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                                        <Icon className="h-6 w-6 text-primary-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                    <p className="text-gray-600">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Story Section */}
                <div className="mb-16">
                    <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                        <div className="prose prose-lg text-gray-600 max-w-none">
                            <p className="mb-4">
                                TutorConnect was founded in 2025 with a simple yet powerful vision: to make quality education
                                accessible to students everywhere. Our founders, experienced educators and technologists,
                                recognized the growing need for personalized learning solutions in an increasingly digital world.
                            </p>
                            <p className="mb-4">
                                Starting as a small platform connecting local tutors with students, we've grown into a
                                comprehensive educational ecosystem powered by artificial intelligence. Our platform now
                                serves thousands of students worldwide, offering everything from one-on-one tutoring to
                                AI-powered study planning.
                            </p>
                            <p>
                                Today, we continue to innovate and expand our services, always keeping our core mission at heart:
                                helping every student achieve their academic potential through personalized, quality education.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Team Section */}
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
                        <p className="text-lg text-gray-600">
                            Passionate educators and technologists working to transform education
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                                <p className="text-primary-600 font-medium mb-3">{member.role}</p>
                                <p className="text-gray-600 text-sm">{member.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Values Section */}
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Excellence</h3>
                            <p className="text-gray-600">
                                We maintain the highest standards in education quality, tutor selection, and platform performance.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Heart className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Empathy</h3>
                            <p className="text-gray-600">
                                We understand each student's unique challenges and provide compassionate, personalized support.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
                            <p className="text-gray-600">
                                We continuously evolve our platform using cutting-edge technology to enhance learning outcomes.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Get In Touch</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <Mail className="h-6 w-6 text-primary-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                            <p className="text-gray-600">contact@tutorconnect.com</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <Phone className="h-6 w-6 text-primary-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
                            <p className="text-gray-600">+1 (555) 123-4567</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <MapPin className="h-6 w-6 text-primary-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Address</h3>
                            <p className="text-gray-600">123 Education St, Learning City, LC 12345</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;