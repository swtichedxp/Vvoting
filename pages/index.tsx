// pages/index.tsx

import React from 'react';
import PollCard from '../components/Polls/PollCard';

// Example data structure based on your initial request
const samplePolls = [
  {
    pollId: 1,
    title: "Best AI of the Year",
    question: "Cast your vote for the most impactful AI of the year for NAOTEMS.",
    author: "NAOTEMS Admin",
    authorImage: "/images/admin-avatar.jpg", // Placeholder path
    postedTime: "1d",
    options: [
      { id: 101, text: "Gemini", votes: 350, percentage: 35 },
      { id: 102, text: "Siri", votes: 150, percentage: 15 },
      { id: 103, text: "ChatGPT", votes: 500, percentage: 50 },
    ],
    selectedOptionId: 103, // Simulate the user has voted for ChatGPT
  },
  {
    pollId: 2,
    title: "Head of Department (HoD) Election",
    question: "Who should be the next departmental Head of Department?",
    author: "Electoral Committee",
    authorImage: "/images/committee-avatar.jpg", // Placeholder path
    postedTime: "2h",
    options: [
      { id: 201, text: "Dr. Aliyu Musa", votes: 0, percentage: 0 },
      { id: 202, text: "Prof. Aisha Bello", votes: 0, percentage: 0 },
    ],
    selectedOptionId: null, // Simulate the user has NOT voted yet
  },
];


const HomePage: React.FC = () => {
  return (
    // The main container. We keep the default dark background from globals.css
    <div className="min-h-screen p-4 sm:p-6">
      
      {/* Header for the Polls Feed */}
      <header className="py-4 mb-6">
        <h1 className="text-3xl font-bold text-white text-center">
          NAOTEMS Poll Feed
        </h1>
        <p className="text-sm text-gray-400 text-center">
          Vote for your favorite candidates and proposals.
        </p>
      </header>
      
      {/* Polls List */}
      <main className="max-w-xl mx-auto">
        {samplePolls.map((poll) => (
          <PollCard 
            key={poll.pollId}
            {...poll} // Pass all properties to the PollCard component
          />
        ))}

        <div className="text-center text-gray-500 mt-10">
            End of Current Polls. Check back soon!
        </div>
      </main>

    </div>
  );
};

export default HomePage;
