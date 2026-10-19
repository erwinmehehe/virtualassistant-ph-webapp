/**
 * FAQ markup mirrors questions and answers that are already visible on the
 * page. Google generally restricts FAQ rich results to government and health
 * authorities; do not describe this as an AI citation or rich-result guarantee.
 */
export type VisibleFaq = { question: string; answer: string };

export function faqSchema(pageUrl: string, faqs: readonly VisibleFaq[]) {
  return {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    url: `${pageUrl}#faq`,
    isPartOf: { "@id": `${pageUrl}#webpage` },
    mainEntity: faqs
      .filter((faq) => faq.question.trim() && faq.answer.trim())
      .map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
  };
}
