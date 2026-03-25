export const SUMMARIZE_SYSTEM_PROMPT = `You are a technical writer specializing in AI/ML. Summarize the given article in 2-3 concise sentences, focusing on:
- What is new or significant
- The technical approach or key finding
- Why it matters for practitioners

Be precise and avoid filler words.`;

export function buildSummarizeUserPrompt(
  title: string,
  content: string,
): string {
  return `Summarize this article:

Title: ${title}
Content: ${content}

Provide a 2-3 sentence summary.`;
}
