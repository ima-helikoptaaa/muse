// ─── PASS 1: FILTER ──────────────────────────────────────
// Quick pass to filter out irrelevant articles. Sees title + short summary only.

export const FILTER_SYSTEM_PROMPT = `You are an AI content filter. Given a batch of articles, quickly determine which are relevant to someone focused on:

- AI Agents and Agentic Workflows
- Agentic Memory systems
- LLM advancements and breakthroughs
- LLM Training from scratch and fine-tuning
- Agentic Frameworks (LangChain, CrewAI, AutoGen, etc.)
- Machine Learning research breakthroughs
- Foundation Models
- AI Safety and Alignment
- RAG (Retrieval Augmented Generation)
- Multi-agent systems

Return ONLY the IDs of relevant articles. Be aggressive with filtering — only keep articles that would genuinely interest an AI practitioner building with agents and LLMs. Generic tech news, business/funding news, and tangentially-related articles should be filtered out.`;

export function buildFilterUserPrompt(
  articles: { id: string; title: string; summary?: string; source: string }[],
): string {
  const list = articles
    .map(
      (a, i) =>
        `${i + 1}. [${a.source}] "${a.title}"${a.summary ? ` — ${a.summary.slice(0, 150)}` : ''}\n   ID: ${a.id}`,
    )
    .join('\n');

  return `Filter the following ${articles.length} articles. Return a JSON array of IDs for ONLY the relevant articles.

${list}

Respond with a JSON array of strings (article IDs) wrapped in \`\`\`json code fence.`;
}

// ─── PASS 2: RANK ────────────────────────────────────────
// Deep ranking of pre-filtered articles. Sees full content when available.

export const RANK_SYSTEM_PROMPT = `You are an AI research analyst. You are ranking a curated set of articles that have already been filtered for relevance. Your job is to COMPARATIVELY rank them — you can see all articles at once, so rank them relative to each other.

The reader is deeply interested in:
- AI Agents and Agentic Workflows
- Agentic Memory systems
- LLM advancements and breakthroughs
- LLM Training from scratch
- Agentic Frameworks (LangChain, CrewAI, AutoGen, etc.)
- Machine Learning research
- Foundation Models, RAG, Multi-agent systems
- AI Safety and Alignment

Ranking criteria (in order of importance):
1. **Novelty** — Is this genuinely new, or a rehash of known stuff?
2. **Impact** — Will this change how practitioners work?
3. **Specificity** — Concrete results/tools > vague announcements
4. **Actionability** — Can the reader use this in their work?

For each article, provide:
1. A relevance score from 0.0 to 1.0 (rank them RELATIVE to each other, use the full range)
2. A concise summary (2-3 sentences) — focus on what's new and why
3. Topic tags from the interest categories
4. A "Why it matters" explanation (1-2 sentences)

Return ONLY a JSON array, sorted by relevance score descending.`;

export function buildRankUserPrompt(
  articles: {
    id: string;
    title: string;
    summary?: string;
    content?: string;
    url?: string;
    source: string;
    crossSourceCount?: number;
  }[],
  personalContext?: string,
): string {
  const articleList = articles
    .map((a, i) => {
      let entry = `${i + 1}. [${a.source}] "${a.title}"`;
      if (a.crossSourceCount && a.crossSourceCount > 1) {
        entry += ` (appeared in ${a.crossSourceCount} sources)`;
      }
      if (a.content) {
        entry += `\n   Content: ${a.content.slice(0, 2000)}`;
      } else if (a.summary) {
        entry += `\n   Summary: ${a.summary}`;
      }
      if (a.url) entry += `\n   URL: ${a.url}`;
      return entry;
    })
    .join('\n\n');

  let prompt = `Comparatively rank these ${articles.length} pre-filtered articles. Return a JSON array with objects: { "index": number, "rank": number, "relevanceScore": number, "aiSummary": string, "topicTags": string[], "whyItMatters": string }
where "index" is the article number (1-based) from the list above.

Articles:
${articleList}`;

  if (personalContext) {
    prompt += `\n\nPersonalization context — topics the reader has recently created content about (boost similar but novel items, deprioritize exact repeats):\n${personalContext}`;
  }

  prompt +=
    '\n\nRank ALL articles. Use the full 0.0-1.0 range comparatively. Respond with a JSON array wrapped in ```json code fence.';

  return prompt;
}

// ─── LEGACY COMPAT ───────────────────────────────────────
// Keep the old names so existing code that references them still compiles
export const DIGEST_SYSTEM_PROMPT = RANK_SYSTEM_PROMPT;
export const buildDigestUserPrompt = buildRankUserPrompt;
