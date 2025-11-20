import React from 'react';
import { Bot, User, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import aiService from '../services/aiService';

const MessageBubble = ({ message }) => {
    return (
        <div
            className={`flex ${message.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
            <div
                className={`max-w-2xl lg:max-w-4xl px-3 py-2 rounded-lg ${message.message_type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                    }`}
            >
                <div className="flex items-start space-x-2">
                    {message.message_type === 'assistant' && (
                        <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                        {message.message_type === 'assistant' ? (
                            <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-1">
                                <ReactMarkdown
                                    components={{
                                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 last:mb-0">{children}</ul>,
                                        li: ({ children }) => <li className="mb-1">{children}</li>,
                                        strong: ({ children }) => <span className="font-semibold">{children}</span>,
                                        em: ({ children }) => <span className="italic">{children}</span>,
                                        h2: ({ children }) => <h2 className="font-bold text-base mb-1 mt-2 first:mt-0">{children}</h2>,
                                        h3: ({ children }) => <h3 className="font-semibold text-sm mb-1 mt-2 first:mt-0">{children}</h3>,
                                    }}
                                >
                                    {message.content}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                            <span className={`text-xs ${message.message_type === 'user' ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                {aiService.formatTimestamp(message.created_at)}
                            </span>
                            {message.response_time_ms && (
                                <span className="text-xs text-gray-400 flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {message.response_time_ms}ms
                                </span>
                            )}
                        </div>
                    </div>
                    {message.message_type === 'user' && (
                        <User className="h-4 w-4 mt-1 flex-shrink-0" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;