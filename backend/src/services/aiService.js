const Groq = require('groq-sdk');

class AIService {
    constructor() {
        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY || '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'
        });
        this.model = 'llama-3.1-8b-instant'; // Updated to current supported model
    }

    /**
     * Structure a comprehensive prompt for the AI tutor
     * @param {string} userMessage - The student's question
     * @param {Object} context - Additional context about the user
     * @returns {string} - Structured prompt
     */
    structurePrompt(userMessage, context = {}) {
        const systemPrompt = `You are TutorConnect AI, an intelligent and helpful study assistant designed to support students in their learning journey. Your role is to:

**Primary Functions:**
- Answer academic questions across all subjects (Math, Science, Literature, History, etc.)
- Provide clear, step-by-step explanations for complex concepts
- Offer study tips, learning strategies, and exam preparation advice
- Help with homework and assignment guidance (without doing the work for them)
- Suggest additional resources and practice materials
- Motivate and encourage students in their studies

**Guidelines:**
- Always be encouraging and supportive in your responses
- Break down complex topics into simple, understandable parts
- Use examples and analogies to make concepts clearer
- Ask follow-up questions to ensure understanding
- Suggest practice problems or exercises when appropriate
- Recommend study techniques tailored to the subject matter
- If you don't know something, admit it and suggest where they might find the answer
- Never provide direct answers to what appears to be test questions or assignments
- Always encourage critical thinking and learning processes

**Context:**
- Student Name: ${context.userName || 'Student'}
- Current Subject Focus: ${context.currentSubject || 'General Studies'}
- Academic Level: ${context.academicLevel || 'Not specified'}

**Communication Style:**
- Be friendly but professional
- Use age-appropriate language
- Provide structured responses with clear headings when helpful
- Include relevant emojis sparingly to make responses engaging
- Keep responses concise but comprehensive

Remember: Your goal is to help students learn and understand, not to do their work for them. Guide them to discover answers through understanding.`;

        return [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ];
    }

    /**
     * Send a message to the AI and get a response
     * @param {string} userMessage - The student's question
     * @param {Array} conversationHistory - Previous messages in the conversation
     * @param {Object} context - User context information
     * @returns {Object} - AI response with metadata
     */
    async generateResponse(userMessage, conversationHistory = [], context = {}) {
        try {
            const startTime = Date.now();

            // Build messages array with conversation history
            let messages = [];

            // Add system prompt
            const systemPrompt = `You are TutorConnect AI, an intelligent and helpful study assistant designed to support students in their learning journey. Your role is to:

**Primary Functions:**
- Answer academic questions across all subjects (Math, Science, Literature, History, etc.)
- Provide clear, step-by-step explanations for complex concepts
- Offer study tips, learning strategies, and exam preparation advice
- Help with homework and assignment guidance (without doing the work for them)
- Suggest additional resources and practice materials
- Motivate and encourage students in their studies

**Guidelines:**
- Always be encouraging and supportive in your responses
- Break down complex topics into simple, understandable parts
- Use examples and analogies to make concepts clearer
- Ask follow-up questions to ensure understanding
- Suggest practice problems or exercises when appropriate
- Recommend study techniques tailored to the subject matter
- If you don't know something, admit it and suggest where they might find the answer
- Never provide direct answers to what appears to be test questions or assignments
- Always encourage critical thinking and learning processes

**Context:**
- Student Name: ${context.userName || 'Student'}
- Current Subject Focus: ${context.currentSubject || 'General Studies'}
- Academic Level: ${context.academicLevel || 'Not specified'}

**Communication Style:**
- Be friendly but professional
- Use age-appropriate language
- Provide structured responses with clear headings when helpful
- Include relevant emojis sparingly to make responses engaging
- Keep responses concise but comprehensive

Remember: Your goal is to help students learn and understand, not to do their work for them. Guide them to discover answers through understanding.`;

            messages.push({ role: 'system', content: systemPrompt });

            // Add conversation history (limit to last 10 messages to avoid token limits)
            const recentHistory = conversationHistory.slice(-10);
            messages.push(...recentHistory);

            // Add current user message
            messages.push({ role: 'user', content: userMessage });

            // Make API call to Groq
            const completion = await this.groq.chat.completions.create({
                messages: messages,
                model: this.model,
                temperature: 0.7, // Balanced creativity and consistency
                max_tokens: 1000, // Reasonable response length
                top_p: 0.9,
                stream: false
            });

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Extract response
            const aiResponse = completion.choices[0]?.message?.content;
            const tokensUsed = completion.usage?.total_tokens || 0;

            if (!aiResponse) {
                throw new Error('No response generated from AI');
            }

            return {
                success: true,
                response: aiResponse,
                metadata: {
                    model: this.model,
                    tokensUsed: tokensUsed,
                    responseTime: responseTime,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('AI Service Error:', error);
            console.error('Error details:', error.error || error.message);

            // Return a fallback response
            return {
                success: false,
                response: "I apologize, but I'm experiencing some technical difficulties right now. Please try asking your question again in a moment. If the problem persists, you can always reach out to one of our human tutors for assistance! 📚",
                error: error.message,
                metadata: {
                    model: this.model,
                    tokensUsed: 0,
                    responseTime: 0,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    /**
     * Generate a chat session title based on the first message
     * @param {string} firstMessage - The first message in the conversation
     * @returns {string} - Generated title
     */
    async generateChatTitle(firstMessage) {
        try {
            const titlePrompt = `Generate a short, descriptive title (max 6 words) for a study session based on this student question: "${firstMessage}". 
            
            Examples:
            - "Help with Calculus Derivatives"
            - "English Literature Essay Help"
            - "Chemistry Balancing Equations"
            - "History World War 2"
            
            Return only the title, nothing else.`;

            const completion = await this.groq.chat.completions.create({
                messages: [{ role: 'user', content: titlePrompt }],
                model: this.model,
                temperature: 0.3,
                max_tokens: 20
            });

            const title = completion.choices[0]?.message?.content?.trim();
            return title || 'Study Help Session';

        } catch (error) {
            console.error('Error generating chat title:', error);
            return 'Study Help Session';
        }
    }

    /**
     * Validate and sanitize user input
     * @param {string} message - User message to validate
     * @returns {Object} - Validation result
     */
    validateMessage(message) {
        if (!message || typeof message !== 'string') {
            return { isValid: false, error: 'Message is required' };
        }

        const trimmedMessage = message.trim();

        if (trimmedMessage.length === 0) {
            return { isValid: false, error: 'Message cannot be empty' };
        }

        if (trimmedMessage.length > 2000) {
            return { isValid: false, error: 'Message is too long (max 2000 characters)' };
        }

        // Basic profanity filter (you might want to use a more sophisticated solution)
        const inappropriateWords = ['spam', 'test123', 'asdfgh'];
        const hasInappropriateContent = inappropriateWords.some(word =>
            trimmedMessage.toLowerCase().includes(word)
        );

        if (hasInappropriateContent) {
            return { isValid: false, error: 'Message contains inappropriate content' };
        }

        return { isValid: true, message: trimmedMessage };
    }
}

module.exports = new AIService();