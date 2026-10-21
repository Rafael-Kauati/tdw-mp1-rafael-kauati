import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";

const { mockGetAllPosts, mockDraftMode } = vi.hoisted(() => ({
  mockGetAllPosts: vi.fn(),
  mockDraftMode: vi.fn(),
}));

vi.mock("next/headers", () => ({
  draftMode: mockDraftMode,
}));

vi.mock("@/lib/api", () => ({
  getAllPosts: mockGetAllPosts,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("../app/date", () => ({
  default: ({ dateString }: { dateString: string }) => (
    <time>{dateString}</time>
  ),
}));

vi.mock("../app/cover-image", () => ({
  default: ({ title }: { title: string }) => <div>Cover: {title}</div>,
}));

vi.mock("../app/avatar", () => ({
  default: ({ name }: { name: string }) => <div>Author: {name}</div>,
}));

vi.mock("../app/more-stories", () => ({
  default: ({
    morePosts,
  }: {
    morePosts: Array<{ title: string; slug: string }>;
  }) => (
    <div data-testid="more-stories">
      {morePosts.map((post) => (
        <span key={post.slug}>{post.title}</span>
      ))}
    </div>
  ),
}));

import Page from "../app/page";

const posts = [
  {
    title: "First post",
    slug: "first-post",
    excerpt: "This is the featured post.",
    date: "2026-10-20",
    coverImage: { url: "https://example.com/first.jpg" },
    author: {
      name: "Test Author",
      picture: { url: "https://example.com/author.jpg" },
    },
  },
  {
    title: "Second post",
    slug: "second-post",
    excerpt: "This is another post.",
    date: "2026-10-19",
    coverImage: { url: "https://example.com/second.jpg" },
    author: null,
  },
];

async function renderPage() {
  return renderToStaticMarkup(await Page());
}

describe("Home page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDraftMode.mockResolvedValue({ isEnabled: false });
    mockGetAllPosts.mockResolvedValue([]);
  });

  it("displays a message when no posts are found", async () => {
    const html = await renderPage();

    expect(html).toContain("No posts found!!!");
    expect(html).toContain("Please check your Contentful configuration.");
    expect(mockGetAllPosts).toHaveBeenCalledWith(false);
  });

  it("displays the first post as the featured post", async () => {
    mockGetAllPosts.mockResolvedValue(posts);

    const html = await renderPage();

    expect(html).toContain("First post");
    expect(html).toContain("This is the featured post.");
    expect(html).toContain("Test Author");
    expect(html).toContain('href="/posts/first-post"');
    expect(html).toContain("2026-10-20");
  });

  it("passes the remaining posts to MoreStories and respects draft mode", async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: true });
    mockGetAllPosts.mockResolvedValue(posts);

    const html = await renderPage();

    expect(mockGetAllPosts).toHaveBeenCalledWith(true);
    expect(html).toContain("Second post");
    expect(html).not.toContain('href="/posts/second-post"');
  });
});
