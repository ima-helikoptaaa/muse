'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIdea, promoteIdea } from '@/lib/api';
import type { ContentCascade, SourceAttribution } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  FileText,
  Youtube,
  Linkedin,
  Twitter,
  Image,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

const TABS = [
  { key: 'article', label: 'Article', icon: FileText },
  { key: 'youtubeScript', label: 'YouTube', icon: Youtube },
  { key: 'linkedinPost', label: 'LinkedIn', icon: Linkedin },
  { key: 'twitterThread', label: 'X Thread', icon: Twitter },
  { key: 'instagramCarousel', label: 'Instagram', icon: Image },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('article');

  const { data: idea, isLoading } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => getIdea(id),
  });

  const promoteMutation = useMutation({
    mutationFn: () => promoteIdea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', id] });
      router.push('/content');
    },
  });

  if (isLoading) return <p className="text-[var(--muted-foreground)]">Loading...</p>;
  if (!idea) return <p>Idea not found</p>;

  const researchSteps = idea.researchSteps as string[];
  const talkingPoints = idea.talkingPoints as string[];
  const cascade = idea.cascade as ContentCascade | null;
  const sourceArticles = idea.sourceArticles as SourceAttribution[] | null;
  const hasCascade = cascade && Object.keys(cascade).length > 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/ideas" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{idea.title}</h1>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--primary)]/20 text-[var(--primary)] font-medium">
              P{idea.priority}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
              Est: {idea.estimatedEffort}
            </span>
            {!hasCascade && (
              <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                {idea.format.replace(/_/g, ' ')} · {idea.targetPlatform}
              </span>
            )}
          </div>
        </div>
        {!idea.contentPiece && (
          <button
            onClick={() => promoteMutation.mutate()}
            disabled={promoteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            Promote to Content <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* Description & Angle */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <p className="text-sm text-[var(--muted-foreground)]">{idea.description}</p>
        {idea.angle && (
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">Angle</h3>
            <p className="text-sm">{idea.angle}</p>
          </div>
        )}
      </div>

      {/* Content Cascade */}
      {hasCascade && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="flex border-b border-[var(--border)] overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => {
              const hasContent = cascade[key];
              if (!hasContent) return null;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === key
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="p-5">
            {activeTab === 'article' && cascade.article && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">{cascade.article.headline}</h3>
                <div className="prose prose-invert prose-sm max-w-none text-[var(--muted-foreground)] whitespace-pre-wrap">
                  {cascade.article.body}
                </div>
              </div>
            )}

            {activeTab === 'youtubeScript' && cascade.youtubeScript && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">Hook (first 15s)</h3>
                  <p className="text-sm bg-[var(--muted)] rounded-lg p-3">{cascade.youtubeScript.hook}</p>
                </div>
                {cascade.youtubeScript.sections.map((section, i) => (
                  <div key={i}>
                    <h4 className="font-medium text-sm">{section.title}</h4>
                    <ul className="mt-1 space-y-1">
                      {section.talkingPoints.map((tp, j) => (
                        <li key={j} className="text-sm text-[var(--muted-foreground)] flex items-start gap-2">
                          <span className="text-[var(--primary)]">•</span> {tp}
                        </li>
                      ))}
                    </ul>
                    {section.visualNotes && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-1 italic">[Visual: {section.visualNotes}]</p>
                    )}
                  </div>
                ))}
                <div>
                  <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">CTA</h3>
                  <p className="text-sm">{cascade.youtubeScript.cta}</p>
                </div>
              </div>
            )}

            {activeTab === 'linkedinPost' && cascade.linkedinPost && (
              <div className="text-sm whitespace-pre-wrap">{cascade.linkedinPost.body}</div>
            )}

            {activeTab === 'twitterThread' && cascade.twitterThread && (
              <div className="space-y-3">
                {cascade.twitterThread.tweets.map((tweet, i) => (
                  <div
                    key={i}
                    className="bg-[var(--muted)] rounded-lg p-3 text-sm"
                  >
                    <span className="text-xs text-[var(--muted-foreground)] font-mono mr-2">{i + 1}/{cascade.twitterThread!.tweets.length}</span>
                    {tweet}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'instagramCarousel' && cascade.instagramCarousel && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {cascade.instagramCarousel.slides.map((slide, i) => (
                    <div
                      key={i}
                      className="bg-[var(--muted)] rounded-lg p-3 aspect-square flex flex-col justify-between"
                    >
                      <p className="text-xs font-medium">{slide.text}</p>
                      <p className="text-[10px] text-[var(--muted-foreground)] italic mt-auto">{slide.visualDescription}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">Caption</h3>
                  <p className="text-sm">{cascade.instagramCarousel.caption}</p>
                </div>
                {cascade.instagramCarousel.styleNotes && (
                  <p className="text-xs text-[var(--muted-foreground)] italic">{cascade.instagramCarousel.styleNotes}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Source Articles */}
      {sourceArticles && sourceArticles.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <BookOpen size={16} /> Source Articles
          </h2>
          <div className="space-y-2">
            {sourceArticles.map((src, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="text-[var(--muted-foreground)] font-mono text-xs mt-0.5 shrink-0">{i + 1}.</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{src.title}</span>
                    {src.url && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {src.source} · {src.relevance}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Research Steps (legacy + new) */}
      {researchSteps?.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-semibold mb-3">Research Steps</h2>
          <ol className="space-y-2">
            {researchSteps.map((step: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[var(--muted-foreground)]">
                <span className="text-[var(--primary)] font-mono text-xs mt-0.5">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Talking Points (legacy + new) */}
      {talkingPoints?.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-semibold mb-3">Talking Points</h2>
          <ul className="space-y-2">
            {talkingPoints.map((point: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[var(--muted-foreground)]">
                <CheckCircle size={14} className="text-green-400 mt-0.5 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
