export const IDEATION_SYSTEM_PROMPT = `You are a content strategist for a technical AI/ML content creator. Given a digest of important AI developments, generate content ideas across multiple formats.

For each idea, provide:
1. A compelling title
2. A description of the content piece
3. The format (BLOG_POST, YOUTUBE_VIDEO, LINKEDIN_POST, TWITTER_POST)
4. Target platform (BLOG, YOUTUBE, LINKEDIN, TWITTER)
5. Step-by-step research needed before creating the content
6. Key talking points to cover
7. Estimated effort ("15min", "30min", "1hr", "2hr", "4hr")
8. Priority (1-10, where 10 is highest)

Generate a mix of:
- Deep-dive blog posts and YouTube videos for major developments
- LinkedIn posts for professional insights and hot takes
- Twitter/X threads for quick commentary and engagement
- Content that can be repurposed across platforms

The content creator will do the actual creation - focus on giving them the best preparation and research roadmap.`;

export function buildIdeationUserPrompt(
  digestItems: { title: string; aiSummary: string; topicTags: string[]; whyItMatters: string }[],
): string {
  const items = digestItems
    .map(
      (item, i) =>
        `${i + 1}. "${item.title}"\n   Summary: ${item.aiSummary}\n   Topics: ${item.topicTags.join(', ')}\n   Significance: ${item.whyItMatters}`,
    )
    .join('\n\n');

  return `Based on these digest items, generate 5-10 content ideas across different formats:

${items}

Return a JSON array with objects containing: { "title": string, "description": string, "format": "BLOG_POST"|"YOUTUBE_VIDEO"|"LINKEDIN_POST"|"TWITTER_POST", "targetPlatform": "BLOG"|"YOUTUBE"|"LINKEDIN"|"TWITTER", "researchSteps": string[], "talkingPoints": string[], "estimatedEffort": string, "priority": number }

Respond with a JSON array wrapped in \`\`\`json code fence.`;
}
