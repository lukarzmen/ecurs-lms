import React from "react";

function QuestionAnswerComponent({ question }: { question: string }) {
  return (
    <div className="mb-4">
      <p className="text-gray-800 font-bold mb-2 text-xl">{question}</p>
      <input
        type="text"
        className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Your answer"
      />
    </div>
  );
}

export default QuestionAnswerComponent;
