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
- Novel architectures, attention mechanisms, quantization methods
- Benchmark results, evals, and model comparisons

Return ONLY the IDs of relevant articles. Be aggressive with filtering — only keep articles that would genuinely interest an AI practitioner building with agents and LLMs. Generic tech news, business/funding news, and tangentially-related articles should be filtered out.

IMPORTANT — Always keep articles that signal a BREAKTHROUGH or significant release:
- New model releases, new architectures, new training methods
- State-of-the-art benchmark results (e.g., "99% on X", "beats GPT-4")
- Novel research papers (especially from arXiv)
- New open-source tools, frameworks, or libraries with real substance
- Even if engagement/score is low, keep items that describe genuinely new technical work.`;

export function buildFilterUserPrompt(
  articles: { id: string; title: string; summary?: string; source: string; score?: number; publishedAge?: string }[],
): string {
  const list = articles
    .map(
      (a, i) => {
        let line = `${i + 1}. [${a.source}] "${a.title}"`;
        if (a.score) line += ` (engagement: ${a.score})`;
        if (a.publishedAge) line += ` (${a.publishedAge})`;
        if (a.summary) line += `\n   ${a.summary.slice(0, 150)}`;
        line += `\n   ID: ${a.id}`;
        return line;
      },
    )
    .join('\n');

  return `Filter the following ${articles.length} articles. Return a JSON array of IDs for ONLY the relevant articles.
Note: Low engagement does NOT mean low quality — new papers and fresh announcements won't have engagement yet. Judge by CONTENT, not popularity.

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
- Novel architectures, attention mechanisms, quantization methods
- Benchmark results and evals

Ranking criteria (in order of importance):
1. **Breakthrough potential** — Does this represent a genuine breakthrough, new architecture, SOTA result, or paradigm shift? If yes, it should rank near the top regardless of engagement.
2. **Novelty** — Is this genuinely new, or a rehash of known stuff? Fresh research papers and new releases should rank higher than commentary.
3. **Recency** — More recent items should be preferred over older ones, all else being equal. Items published in the last 24 hours deserve extra consideration.
4. **Impact** — Will this change how practitioners work?
5. **Specificity** — Concrete results/tools/papers > vague announcements or opinions
6. **Actionability** — Can the reader use this in their work?

IMPORTANT: Do NOT let high social media engagement override substance. A viral tweet with an opinion is less valuable than a new arXiv paper with novel results, even if the paper has zero likes. Judge by CONTENT and SIGNIFICANCE, not popularity.

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
    score?: number;
    publishedAge?: string;
  }[],
  personalContext?: string,
): string {
  const articleList = articles
    .map((a, i) => {
      let entry = `${i + 1}. [${a.source}] "${a.title}"`;
      const meta: string[] = [];
      if (a.crossSourceCount && a.crossSourceCount > 1) {
        meta.push(`appeared in ${a.crossSourceCount} sources`);
      }
      if (a.score != null) meta.push(`engagement: ${a.score}`);
      if (a.publishedAge) meta.push(a.publishedAge);
      if (meta.length > 0) entry += ` (${meta.join(', ')})`;
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
