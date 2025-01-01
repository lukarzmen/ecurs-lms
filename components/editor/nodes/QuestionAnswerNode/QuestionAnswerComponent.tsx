import React from "react";

function QuestionAnswerComponent({ question }: { question: string }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <p style={{ margin: "0" }}>{question}</p>
      <input type="text" style={{ width: "100%" }} placeholder="Your answer" />
    </div>
  );
}

export default QuestionAnswerComponent;