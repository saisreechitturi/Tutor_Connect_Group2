import React from 'react';
import { Check, X } from 'lucide-react';

const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
    const requirements = [
        { test: /.{8,}/, text: 'At least 8 characters' },
        { test: /[a-z]/, text: 'One lowercase letter' },
        { test: /[A-Z]/, text: 'One uppercase letter' },
        { test: /\d/, text: 'One number' }
    ];

    const getStrength = () => {
        const passedRequirements = requirements.filter(req => req.test.test(password)).length;
        if (passedRequirements === 0) return { level: 0, text: '', color: '' };
        if (passedRequirements === 1) return { level: 1, text: 'Very Weak', color: 'bg-red-500' };
        if (passedRequirements === 2) return { level: 2, text: 'Weak', color: 'bg-orange-500' };
        if (passedRequirements === 3) return { level: 3, text: 'Fair', color: 'bg-yellow-500' };
        if (passedRequirements === 4) return { level: 4, text: 'Strong', color: 'bg-green-500' };
        return { level: 0, text: '', color: '' };
    };

    const strength = getStrength();

    if (!password) return null;

    return (
        <div className="mt-2">
            {/* Strength Bar */}
            <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${(strength.level / 4) * 100}%` }}
                    />
                </div>
                {strength.text && (
                    <span className={`text-xs font-medium ${strength.level === 1 ? 'text-red-600' :
                            strength.level === 2 ? 'text-orange-600' :
                                strength.level === 3 ? 'text-yellow-600' :
                                    'text-green-600'
                        }`}>
                        {strength.text}
                    </span>
                )}
            </div>

            {/* Requirements List */}
            {showRequirements && (
                <div className="space-y-1">
                    {requirements.map((req, index) => {
                        const passes = req.test.test(password);
                        return (
                            <div key={index} className="flex items-center gap-2 text-xs">
                                {passes ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                    <X className="w-3 h-3 text-gray-400" />
                                )}
                                <span className={passes ? 'text-green-600' : 'text-gray-500'}>
                                    {req.text}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PasswordStrengthIndicator;