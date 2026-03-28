export const IDEATION_SYSTEM_PROMPT = `You are a senior content strategist and editorial lead for a technical AI/ML creator with a strong following. Your job is NOT to summarize articles — it's to identify compelling content ANGLES, then produce a full multi-platform content cascade for each.

You think like a creator, not a curator. Every idea must have:
- A specific, differentiated angle (not just "here's what happened" — WHY it matters, contrarian takes, implications others miss, hands-on tutorials, comparisons)
- A clear thesis or hook that makes someone stop scrolling
- Content that feels native to each platform — not copy-pasted and shortened

For each content idea, produce a complete CASCADE across 5 platforms:

1. **Long-form Article** (the anchor piece)
   - Full draft: 1500–2500 words
   - Strong opening hook, structured sections with headers, concrete examples, a clear thesis
   - Written to be genuinely useful — someone should learn something or see something differently

2. **YouTube Video Script**
   - Hook (first 15 seconds — pattern interrupt or bold claim)
   - 5–8 structured sections with talking points and transitions
   - B-roll/visual suggestions in brackets
   - Clear CTA at the end
   - Target: 8–12 minutes

3. **LinkedIn Post**
   - Professional angle, insight-driven (~200–300 words)
   - Opening line that stops the scroll (no "I'm excited to share...")
   - Personal POV or industry insight
   - End with a question or call to discussion

4. **X/Twitter Thread**
   - 5–8 tweets, each self-contained but building a narrative
   - Tweet 1: bold hook or surprising insight
   - Subsequent tweets: evidence, examples, nuance
   - Last tweet: takeaway + CTA (follow/repost)
   - Use short punchy sentences, not essay paragraphs

5. **Instagram Carousel**
   - Slide 1: Bold headline + visual hook (text overlay concept)
   - Slides 2–8: One key point per slide, visual-first, minimal text
   - Final slide: Summary + CTA (save/share)
   - Include suggested color scheme or visual style notes

Each platform version must feel like it was written BY someone who lives on that platform, not translated from a blog post.`;

export function buildIdeationUserPrompt(
  primaryItems: {
    title: string;
    aiSummary: string;
    topicTags: string[];
    whyItMatters: string;
    rank: number;
    articleSource?: string;
    articleUrl?: string;
  }[],
  contextItems?: {
    title: string;
    aiSummary: string;
    topicTags: string[];
    rank: number;
    articleSource?: string;
    articleUrl?: string;
  }[],
): string {
  const primary = primaryItems
    .map(
      (item, i) =>
        `${i + 1}. "${item.title}" [${item.articleSource || 'Unknown'}]${item.articleUrl ? ` (${item.articleUrl})` : ''}
   Summary: ${item.aiSummary}
   Topics: ${item.topicTags.join(', ')}
   Why it matters: ${item.whyItMatters}`,
    )
    .join('\n\n');

  let contextSection = '';
  if (contextItems && contextItems.length > 0) {
    const ctx = contextItems
      .map(
        (item, i) =>
          `${i + 1}. "${item.title}" [${item.articleSource || 'Unknown'}]${item.articleUrl ? ` (${item.articleUrl})` : ''}
   Summary: ${item.aiSummary}
   Topics: ${item.topicTags.join(', ')}`,
      )
      .join('\n');

    contextSection = `

── ADDITIONAL CONTEXT (articles ranked 21–50, use for cross-referencing and richer ideas) ──
${ctx}`;
  }

  return `Generate 3-5 HIGH-QUALITY content ideas with full multi-platform cascades. Each idea should have a unique, differentiated angle — not just a restatement of the article.

── PRIMARY SOURCE MATERIAL (top 20 ranked articles) ──
${primary}${contextSection}

IMPORTANT:
- Combine related articles into single ideas where it makes sense (don't just do 1 article = 1 idea)
- Find non-obvious angles: contrarian takes, "what no one is talking about", tutorials, comparisons, predictions
- The long-form article should be FULLY WRITTEN, not just an outline
- For each idea, list ALL articles from the full set (primary + context) that inform it

Return a JSON array with objects:
{
  "title": string (compelling, specific — not generic),
  "description": string (1-2 sentence pitch — why this content will perform),
  "angle": string (the specific editorial angle or thesis),
  "researchSteps": string[] (what to verify/research before publishing),
  "talkingPoints": string[] (core arguments or insights),
  "estimatedEffort": string ("1hr", "2hr", "4hr"),
  "priority": number (1-10, 10 = highest),
  "sourceArticles": [{ "title": string, "source": string, "url": string, "relevance": string }],
  "cascade": {
    "article": {
      "headline": string,
      "body": string (full 1500-2500 word article in markdown)
    },
    "youtubeScript": {
      "hook": string (first 15 seconds),
      "sections": [{ "title": string, "talkingPoints": string[], "visualNotes": string }],
      "cta": string,
      "estimatedLength": string
    },
    "linkedinPost": {
      "body": string (200-300 words, ready to post)
    },
    "twitterThread": {
      "tweets": string[] (5-8 tweets)
    },
    "instagramCarousel": {
      "slides": [{ "text": string, "visualDescription": string }],
      "caption": string,
      "styleNotes": string
    }
  }
}

Respond with a JSON array wrapped in \`\`\`json code fence.`;
}
