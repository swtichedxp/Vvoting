// components/Polls/PollCard.tsx

import React from 'react';

// Define the structure for a single poll option/candidate
interface Option {
  id: number;
  text: string;
  votes: number;
  percentage: number;
}

interface PollCardProps {
  pollId: number;
  title: string;
  question: string;
  author: string;
  authorImage: string;
  postedTime: string;
  options: Option[];
  selectedOptionId: number | null; // Null if no vote yet
}

const PollCard: React.FC<PollCardProps> = ({ 
  title, question, author, authorImage, postedTime, options, selectedOptionId 
}) => {
  // Total votes for percentage calculation (example data)
  const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);

  // A function placeholder for handling a vote click
  const handleVote = (optionId: number) => {
    // TODO: Implement the actual API call for voting and payment screenshot upload
    console.log(`Voting for option ID: ${optionId}`);
  };

  return (
    // Outer card container with a dark background and rounded edges
    <div className="w-full bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-4 mb-6 transition-all duration-300">
      
      {/* Header: Author Info */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <img 
            src={authorImage} 
            alt={author} 
            className="w-10 h-10 rounded-full object-cover mr-3 border-2 border-green-400"
          />
          <div>
            <div className="flex items-center text-white font-semibold text-base">
              {author}
              {/* Checkmark icon next to name */}
              <svg className="w-4 h-4 ml-1 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs text-gray-500">Posted {postedTime} ago</p>
          </div>
        </div>
        {/* Menu/Options icon */}
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </div>

      {/* Poll Question/Body */}
      <p className="text-gray-300 mb-6">{question}</p>

      {/* Options/Candidates */}
      <div className="space-y-3">
        {options.map((option) => (
          <div
            key={option.id}
            onClick={() => handleVote(option.id)}
            className={`
              relative flex justify-between items-center px-4 py-3 cursor-pointer 
              rounded-xl text-white font-medium overflow-hidden transition-colors
              ${selectedOptionId === option.id 
                ? 'border-2 border-green-500' // Selected style
                : 'border border-gray-700 hover:border-gray-600' // Default style
              }
            `}
          >
            {/* The colored background bar showing the vote percentage */}
            <div 
              className={`absolute inset-0 z-0 opacity-50 
                         ${selectedOptionId !== null ? 'bg-green-600' : 'bg-transparent'}`}
              style={{ width: `${selectedOptionId !== null ? option.percentage : 0}%` }}
            />
            
            {/* Option Text and Percentage */}
            <span className="relative z-10">{option.text}</span>
            <div className="relative z-10 flex items-center">
              {/* Show percentage only after a vote is cast (or state changes) */}
              {selectedOptionId !== null && (
                <span className={`text-sm font-bold mr-2 
                                  ${selectedOptionId === option.id ? 'text-green-200' : 'text-gray-400'}`}>
                  {option.percentage}%
                </span>
              )}

              {/* Checkmark for the selected option */}
              {selectedOptionId === option.id && (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="flex justify-between items-center text-gray-500 text-sm mt-6 pt-4 border-t border-gray-800">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
            <span>{totalVotes} Votes</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM10 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM14 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6z" /></svg>
            <span>5 Comments</span> 
          </div>
        </div>
        {/* Save/Bookmark button */}
        <div className="flex items-center hover:text-white cursor-pointer">
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 00-2 2v6a2 2 0 002 2h2v4l3-3 3 3v-4h2a2 2 0 002-2V6a2 2 0 00-2-2H5z" /></svg>
          <span>Save</span>
        </div>
      </div>

    </div>
  );
};

export default PollCard;
