import React from 'react';

interface SampleQuestionsProps {
  onQuestionClick: (question: string) => void;
}

const sampleQuestions = [
  "What are the reporting requirements for accidental exposures?",
  "When must a licensee notify the NRC of an unplanned shutdown?",
  "What dose limits does occupational workers?",
  "What are the requirements for financial assurance for decommissioning?"
];

export function SampleQuestions({ onQuestionClick }: SampleQuestionsProps) {
  return (
    <div className="flex flex-col space-y-2 w-full max-w-3xl mx-auto mb-8">
      <p className="text-sm font-medium text-gray-500 mb-2">Try asking about:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {sampleQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="text-left px-4 py-3 text-sm bg-white/80 hover:bg-white rounded-xl border border-gray-100 
                     shadow-sm hover:shadow-md transition-all duration-200 text-gray-700 hover:text-primary"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
