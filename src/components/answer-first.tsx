type AnswerFirstProps = {
  question: string;
  answer: string;
  id?: string;
  className?: string;
};

/**
 * Answer-first summary remains ordinary server-rendered HTML; it is not
 * hidden in JSON-LD or inserted only for crawlers.
 */
export function AnswerFirst({ question, answer, id = "quick-answer", className = "" }: AnswerFirstProps) {
  if (!answer.trim()) return null;
  return (
    <section className={`answer-first ${className}`.trim()} id={id} aria-labelledby={`${id}-heading`}>
      <div className="answer-first__label">Quick answer</div>
      <h2 id={`${id}-heading`}>{question}</h2>
      <p>{answer}</p>
    </section>
  );
}
