import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default sources...');

  const sources = [
    {
      name: 'ArXiv - AI',
      type: 'ARXIV' as const,
      url: 'https://rss.arxiv.org/rss/cs.AI',
      fetchConfig: {
        feeds: [
          'https://rss.arxiv.org/rss/cs.AI',
          'https://rss.arxiv.org/rss/cs.CL',
          'https://rss.arxiv.org/rss/cs.LG',
        ],
      },
    },
    {
      name: 'Hacker News',
      type: 'HACKER_NEWS' as const,
      url: 'https://hacker-news.firebaseio.com/v0/',
    },
    {
      name: 'Reddit - ML',
      type: 'REDDIT' as const,
      url: 'https://oauth.reddit.com',
      fetchConfig: {
        subreddits: ['MachineLearning', 'LocalLLaMA', 'artificial'],
      },
    },
    {
      name: 'GitHub Trending',
      type: 'GITHUB_TRENDING' as const,
      url: 'https://github.com/trending',
    },
    {
      name: 'HuggingFace',
      type: 'HUGGINGFACE' as const,
      url: 'https://huggingface.co',
    },
    {
      name: 'Tech Blogs',
      type: 'TECH_BLOG' as const,
      url: 'https://openai.com/blog',
      fetchConfig: {
        feeds: [
          { name: 'OpenAI', url: 'https://openai.com/blog/rss.xml' },
          { name: 'Anthropic', url: 'https://www.anthropic.com/rss.xml' },
          {
            name: 'Google DeepMind',
            url: 'https://deepmind.google/blog/rss.xml',
          },
          { name: 'Meta AI', url: 'https://ai.meta.com/blog/rss/' },
        ],
      },
    },
    {
      name: 'AI Newsletters',
      type: 'TECH_BLOG' as const,
      url: 'https://simonwillison.net',
      fetchConfig: {
        feeds: [
          { name: 'Simon Willison', url: 'https://simonwillison.net/atom/everything/' },
          { name: 'Latent Space', url: 'https://www.latent.space/feed' },
          { name: 'Ahead of AI', url: 'https://magazine.sebastianraschka.com/feed' },
          { name: 'The Rundown AI', url: 'https://www.therundown.ai/feed' },
          { name: 'LangChain Blog', url: 'https://blog.langchain.dev/rss/' },
          { name: 'LlamaIndex Blog', url: 'https://www.llamaindex.ai/blog/rss.xml' },
        ],
      },
    },
    {
      name: 'Product Hunt - AI',
      type: 'PRODUCT_HUNT' as const,
      url: 'https://api.producthunt.com/v2/api/graphql',
    },
    {
      name: 'X/Twitter - AI Researchers',
      type: 'TWITTER' as const,
      url: 'https://api.x.com/2',
      fetchConfig: {
        accounts: [
          'karpathy',        // Andrej Karpathy - ex-Tesla AI, ex-OpenAI
          'DrJimFan',        // Jim Fan - NVIDIA AI researcher
          'ylecun',          // Yann LeCun - Meta Chief AI Scientist
          'swyx',            // Swyx - AI engineer, Latent Space
          'hwchase17',       // Harrison Chase - LangChain founder
          'jerryjliu0',      // Jerry Liu - LlamaIndex founder
          'sama',            // Sam Altman - OpenAI CEO
          'DemisHassabis',   // Demis Hassabis - Google DeepMind CEO
          'DarioAmodei',     // Dario Amodei - Anthropic CEO
          'EMostaque',       // Emad Mostaque - Stability AI
          'GuillaumeLample',  // Guillaume Lample - Mistral CTO
          'arthurmensch',    // Arthur Mensch - Mistral CEO
          'ilyasut',           // Ilya Sutskever - SSI
          'aidangomez',        // Aidan Gomez - Cohere CEO, Transformer co-author
          '_jasonwei',         // Jason Wei - OpenAI, chain-of-thought prompting
          'YiTayML',           // Yi Tay - Reka AI, ex-Google
          'charlespacker',     // Charles Packer - Letta/MemGPT founder
        ],
      },
    },
    {
      name: 'X/Twitter - AI Labs & Companies',
      type: 'TWITTER' as const,
      url: 'https://api.x.com/2',
      fetchConfig: {
        accounts: [
          'OpenAI',          // OpenAI official
          'AnthropicAI',     // Anthropic official
          'GoogleDeepMind',  // Google DeepMind official
          'MistralAI',       // Mistral AI official
          'deepseek_ai',     // DeepSeek AI
          'xai',              // xAI
          'CohereForAI',     // Cohere
          'AI21Labs',        // AI21 Labs
          'StabilityAI',     // Stability AI
          'MetaAI',          // Meta AI
          'NVIDIAAI',         // NVIDIA AI
          'HuggingFace',     // Hugging Face
          'SarvamAI',        // Sarvam AI (India)
          'PuchAI',          // Puch AI (India)
          'Alibaba_Qwen',    // Qwen models (Alibaba)
          '01AI_Yi',         // Yi models (01.AI)
          'BaichuanAI',      // Baichuan (China)
          'ZhipuAI',         // Zhipu/GLM models (China)
          'Kimi_Moonshot',   // Moonshot AI / Kimi (China)
          'arcee_ai',        // Arcee AI - model merging/fine-tuning
          'ElevenLabs',      // ElevenLabs - voice AI
          'thinkymachines',  // Thinking Machines Lab
          'lossfunk',        // Loss Funk
          'runwayml',        // Runway - generative video
          'Aleph__Alpha',    // Aleph Alpha (Germany)
          'fal',             // Fal - inference platform
          'MiniMax_AI',      // MiniMax (China)
        ],
      },
    },
    {
      name: 'AI Lab Blogs',
      type: 'TECH_BLOG' as const,
      url: 'https://mistral.ai/news',
      fetchConfig: {
        feeds: [
          { name: 'Mistral AI', url: 'https://mistral.ai/feed/rss.xml' },
          { name: 'DeepSeek', url: 'https://api-docs.deepseek.com/news/rss.xml' },
          { name: 'Cohere', url: 'https://cohere.com/blog/rss.xml' },
          { name: 'AI21 Labs', url: 'https://www.ai21.com/blog/rss.xml' },
          { name: 'Stability AI', url: 'https://stability.ai/news/rss.xml' },
          { name: 'xAI', url: 'https://x.ai/blog/rss.xml' },
          { name: 'Nous Research', url: 'https://nousresearch.com/blog/rss.xml' },
          { name: 'Together AI', url: 'https://www.together.ai/blog/rss.xml' },
          { name: 'Groq', url: 'https://groq.com/blog/feed/' },
        ],
      },
    },
    {
      name: 'X/Twitter - Evals & Benchmarks',
      type: 'TWITTER' as const,
      url: 'https://api.x.com/2',
      fetchConfig: {
        accounts: [
          'lmsysorg',        // LMSYS - Chatbot Arena
          'ArtificialAnlys', // Artificial Analysis - model benchmarks
          'ScaleAI',         // Scale AI - data & evals
        ],
      },
    },
    {
      name: 'X/Twitter - Agents & Memory',
      type: 'TWITTER' as const,
      url: 'https://api.x.com/2',
      fetchConfig: {
        accounts: [
          'mem0ai',          // Mem0 - agentic memory platform
          'supermemory',     // SuperMemory - agentic memory
          'DhravyaShah',     // Dhravya Shah - SuperMemory founder
          'Letta_AI',        // Letta (formerly MemGPT) - agent memory
          'LangChain_AI',    // LangChain - agent framework
          'crewAIInc',       // CrewAI - multi-agent orchestration
          'AutoGenAI',       // AutoGen - Microsoft agent framework
          'composio',        // Composio - agent tool integration
          'e2bdev',          // E2B - code sandboxes for agents
          'PrimeIntellect',  // Prime Intellect - decentralized AI training
          'NousResearch',    // Nous Research - Hermes, open source models
          'arcprize',        // ARC Prize - ARC-AGI benchmark
        ],
      },
    },
  ];

  for (const source of sources) {
    await prisma.source.upsert({
      where: {
        id: source.name.toLowerCase().replace(/\s+/g, '-'),
      },
      update: source,
      create: {
        id: source.name.toLowerCase().replace(/\s+/g, '-'),
        ...source,
      },
    });
    console.log(`  Seeded: ${source.name}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
