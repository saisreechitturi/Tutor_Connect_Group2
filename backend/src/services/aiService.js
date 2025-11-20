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
     * @param {Object} userProfile - Complete user profile information
     * @returns {Object} - AI response with metadata
     */
    async generateResponse(userMessage, conversationHistory = [], context = {}, userProfile = {}) {
        try {
            const startTime = Date.now();

            // Build messages array with conversation history
            let messages = [];

            // Build enhanced system prompt with user profile information
            const systemPrompt = this.buildEnhancedSystemPrompt(userProfile, context, conversationHistory);

            messages.push({ role: 'system', content: systemPrompt });

            // Add recent conversation history (last 3 messages for context)
            const recentHistory = conversationHistory.slice(-3).map(msg => ({
                role: msg.message_type === 'user' ? 'user' : 'assistant',
                content: msg.content
            }));
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
     * Build enhanced system prompt with user profile and conversation context
     * @param {Object} userProfile - Complete user profile information
     * @param {Object} context - Session context
     * @param {Array} conversationHistory - Recent conversation history
     * @returns {string} - Enhanced system prompt
     */
    buildEnhancedSystemPrompt(userProfile = {}, context = {}, conversationHistory = []) {
        // Extract user information
        const userName = userProfile.first_name || context.userName || 'Student';
        const userRole = userProfile.role || 'student';
        const academicLevel = userProfile.academic_level || context.academicLevel || 'Not specified';
        const bio = userProfile.bio || '';
        const subjects = userProfile.subjects_interested || userProfile.subjects || [];
        const learningStyle = userProfile.learning_style || '';
        const goals = userProfile.academic_goals || userProfile.goals || '';
        const location = userProfile.location || '';
        const timezone = userProfile.timezone || '';

        // Build conversation context summary
        let conversationContext = '';
        if (conversationHistory.length > 0) {
            const recentMessages = conversationHistory.slice(-3);
            conversationContext = `
**Recent Conversation Context:**
${recentMessages.map((msg, index) =>
                `${index + 1}. ${msg.message_type === 'user' ? 'Student' : 'AI'}: "${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}"`
            ).join('\n')}
`;
        }

        // Build role-specific context
        let roleSpecificContext = '';
        const userSince = userProfile.user_since ? new Date(userProfile.user_since).toLocaleDateString() : 'Recently joined';

        if (userRole === 'student') {
            roleSpecificContext = `
**Student Information:**
- Joined TutorConnect: ${userSince}
- Focus: Learning and academic support`;
        } else if (userRole === 'tutor') {
            roleSpecificContext = `
**Tutor Information:**
- Joined TutorConnect: ${userSince}
- Focus: Teaching and helping students succeed`;
        } else if (userRole === 'admin') {
            roleSpecificContext = `
**Admin Information:**
- Platform administrator
- Focus: Platform management and user support`;
        }

        // Build personal context
        let personalContext = '';
        if (bio) {
            personalContext = `
**Personal Background:**
- Bio: ${bio}`;
        }

        return `You are TutorConnect AI, an intelligent and personalized study assistant designed to support students in their learning journey. You have access to this student's profile and recent conversation history to provide tailored assistance.

**User Profile:**
- Name: ${userName}
- Role: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}${roleSpecificContext}${personalContext}
${conversationContext}

**Your Primary Functions:**
${userRole === 'student' ? `
- Answer academic questions across all subjects with clear explanations
- Provide step-by-step guidance for learning concepts
- Offer study tips and effective learning strategies
- Help with homework and assignments (guide, don't solve directly)
- Suggest educational resources and materials
- Build on previous conversations to maintain learning continuity
- Motivate and encourage academic progress` :
                userRole === 'tutor' ? `
- Provide teaching strategies and pedagogical advice
- Help with lesson planning and curriculum ideas
- Offer guidance on student engagement techniques
- Suggest assessment and evaluation methods
- Share educational best practices
- Provide professional development insights
- Help resolve teaching challenges` : `
- Provide comprehensive educational support
- Answer questions across academic and educational domains
- Offer guidance based on educational needs and goals`}

**Enhanced Guidelines:**
- Reference their background and role when providing advice
- Build upon previous conversation points for continuity
- Adapt your communication style to their role and needs
- ${userRole === 'student' ? 'Focus on learning techniques and academic success' : userRole === 'tutor' ? 'Focus on teaching effectiveness and student outcomes' : 'Provide balanced educational support'}
- Connect new topics to their educational interests
- Be encouraging while respecting their ${userRole === 'student' ? 'learning journey' : userRole === 'tutor' ? 'teaching career' : 'educational goals'}
- If they're struggling with a recurring topic, offer alternative approaches

**CRITICAL - Accuracy and Honesty Requirements:**
- NEVER make up or invent facts, statistics, dates, or specific details you're unsure about
- If you don't know something, clearly state "I don't know" or "I'm not certain about this"
- Don't provide specific personal information about the user that wasn't given to you
- Don't invent course names, professor names, or institutional details
- When discussing academic topics, stick to well-established, verifiable information
- If asked about current events or recent developments, acknowledge your knowledge limitations
- Don't create fake examples or scenarios - use general, educational examples instead
- Always distinguish between what you know to be factual vs. what might be helpful suggestions

**Context-Aware Responses:**
- Remember what you've discussed before in this session
- Reference their academic goals when suggesting study strategies
- Tailor examples to their subject interests
- Adjust complexity based on their academic level
- Consider their learning style when structuring explanations

**Communication Style:**
- Address them by name (${userName}) when appropriate
- Be friendly, supportive, and professional
- Use clear, structured responses with headings when helpful
- Include relevant emojis sparingly for engagement
- Keep responses comprehensive but concise
- Ask follow-up questions to ensure understanding

**Verification and Sources:**
- When providing factual information, stick to well-established knowledge
- If uncertain about details, suggest where they can verify information
- Encourage users to cross-reference important information with reliable sources
- Be transparent about the limits of your knowledge and capabilities

**Important:** Your goal is to provide personalized, context-aware tutoring that builds on their profile and conversation history. Help them learn and grow while maintaining the continuity of your educational relationship. Always prioritize accuracy and honesty over appearing knowledgeable about everything.`;
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