"use client";

import { useState, useCallback, useEffect, type FormEvent } from "react";
import { apiClient } from "@/services/api-client";
import type { NewsPostListItem, NewsPostDetail, NewsPostInput } from "@/types/news";

// ── Types ──────────────────────────────────────────────────────────

type AdminState =
  | { phase: "login" }
  | { phase: "list"; password: string; posts: NewsPostListItem[] }
  | {
      phase: "edit";
      password: string;
      post: NewsPostDetail | null;
      isNew: boolean;
    };

// ── Category / tag helpers ─────────────────────────────────────────

const CATEGORIES = ["guide", "tutorial", "news", "announcement"] as const;

function blankPost(): NewsPostInput {
  return {
    slug: "",
    title: "",
    summary: "",
    bodyMarkdown: "",
    category: "guide",
    tags: "",
    coverImageUrl: "",
    isPublished: false,
  };
}

// ── Component ──────────────────────────────────────────────────────

export default function AdminPage() {
  const [state, setState] = useState<AdminState>({ phase: "login" });

  // ── Login ────────────────────────────────────────────────────────
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const data = await apiClient.adminListNews(password, 1, 50, true);
      setState({ phase: "list", password, posts: data.items });
    } catch {
      setLoginError("Login failed. Check your password or try again later.");
    } finally {
      setLoggingIn(false);
    }
  }

  // ── List helpers ──────────────────────────────────────────────────

  const refreshList = useCallback(
    async (pw: string) => {
      try {
        const data = await apiClient.adminListNews(pw, 1, 50, true);
        setState((s) =>
          s.phase === "list" ? { ...s, posts: data.items } : s,
        );
      } catch {
        // session expired → back to login
        setState({ phase: "login" });
      }
    },
    [],
  );

  function openNew() {
    if (state.phase !== "list") return;
    setState({
      phase: "edit",
      password: state.password,
      post: null,
      isNew: true,
    });
  }

  async function openEdit(slug: string) {
    if (state.phase !== "list") return;
    try {
      const post = await apiClient.adminGetNews(slug, state.password);
      setState({ phase: "edit", password: state.password, post, isNew: false });
    } catch {
      alert("Failed to load post for editing.");
    }
  }

  async function handleDelete(slug: string, title: string) {
    if (state.phase !== "list") return;
    if (!confirm(`Delete "${title}"?\n\nThis cannot be undone.`)) return;
    try {
      await apiClient.adminDeleteNews(slug, state.password);
      await refreshList(state.password);
    } catch {
      alert("Failed to delete post.");
    }
  }

  // ── Edit helpers ──────────────────────────────────────────────────

  function backToList() {
    if (state.phase !== "edit") return;
    setState((s) =>
      s.phase === "edit"
        ? { phase: "list", password: s.password, posts: [] }
        : s,
    );
    // Refresh after returning
    if (state.phase === "edit") refreshList(state.password);
  }

  // ── Render ───────────────────────────────────────────────────────

  switch (state.phase) {
    case "login":
      return (
        <div className="mx-auto max-w-md px-4 py-16">
          <div className="rounded-lg border border-border bg-card p-6">
            <h1 className="text-xl font-semibold">Admin Login</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Content management dashboard. Enter the admin password to
              continue.
            </p>
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Admin Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Enter admin password"
                  autoFocus
                />
              </div>
              {loginError && (
                <p className="text-sm text-destructive">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={loggingIn || !password.trim()}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loggingIn ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      );

    case "list":
      return (
        <AdminList
          posts={state.posts}
          password={state.password}
          onNew={openNew}
          onEdit={openEdit}
          onDelete={handleDelete}
          onRefresh={() => refreshList(state.password)}
        />
      );

    case "edit":
      return (
        <AdminEdit
          password={state.password}
          post={state.post}
          isNew={state.isNew}
          onBack={backToList}
        />
      );
  }
}

// ── Admin List ─────────────────────────────────────────────────────

function AdminList({
  posts,
  password,
  onNew,
  onEdit,
  onDelete,
  onRefresh,
}: {
  posts: NewsPostListItem[];
  password: string;
  onNew: () => void;
  onEdit: (slug: string) => void;
  onDelete: (slug: string, title: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Content Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {posts.length} posts total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={onNew}
            className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + New Post
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                Category
              </th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                Status
              </th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                Date
              </th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No posts yet. Click &ldquo;+ New Post&rdquo; to create one.
                </td>
              </tr>
            )}
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5">
                  <span className="font-medium line-clamp-1">{p.title}</span>
                  <span className="text-xs text-muted-foreground block">
                    /{p.slug}
                  </span>
                </td>
                <td className="px-4 py-2.5 hidden sm:table-cell">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted">
                    {p.category}
                  </span>
                </td>
                <td className="px-4 py-2.5 hidden sm:table-cell">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.publishedAt
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {p.publishedAt ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                  {p.publishedAt
                    ? new Date(p.publishedAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onEdit(p.slug)}
                      className="rounded px-2 py-1 text-xs font-medium hover:bg-accent transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(p.slug, p.title)}
                      className="rounded px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Del
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Admin Edit / Create ────────────────────────────────────────────

function AdminEdit({
  password,
  post,
  isNew,
  onBack,
}: {
  password: string;
  post: NewsPostDetail | null;
  isNew: boolean;
  onBack: () => void;
}) {
  const [form, setForm] = useState<NewsPostInput>(
    post
      ? {
          slug: post.slug,
          title: post.title,
          summary: post.summary,
          bodyMarkdown: post.bodyMarkdown,
          category: post.category,
          tags: post.tags,
          coverImageUrl: post.coverImageUrl,
          isPublished: post.isPublished,
        }
      : blankPost(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function updateField(field: keyof NewsPostInput, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (!form.title.trim() || !form.slug.trim() || !form.bodyMarkdown.trim()) {
      setError("Title, slug, and body are required.");
      setSaving(false);
      return;
    }

    // Validate slug format: lowercase, alphanumeric + hyphens
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      setError("Slug must be lowercase alphanumeric with hyphens (e.g. my-guide-post).");
      setSaving(false);
      return;
    }

    try {
      if (isNew) {
        await apiClient.adminCreateNews(form, password);
      } else {
        await apiClient.adminUpdateNews(form.slug, form, password);
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish() {
    const newState = !form.isPublished;
    setForm((prev) => ({ ...prev, isPublished: newState }));

    if (!isNew) {
      try {
        await apiClient.adminUpdateNews(
          form.slug,
          { isPublished: newState },
          password,
        );
        setSaved(true);
      } catch {
        setForm((prev) => ({ ...prev, isPublished: !newState }));
        setError("Failed to toggle publish state.");
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {isNew ? "New Post" : `Edit: ${post?.title}`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isNew ? "Create a new article" : `Slug: /${form.slug}`}
          </p>
        </div>
        <button
          onClick={onBack}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Slug (disabled for existing posts) */}
        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            disabled={!isNew}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            placeholder="my-article-slug"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Article title"
          />
        </div>

        {/* Summary */}
        <div>
          <label className="block text-sm font-medium mb-1">Summary</label>
          <textarea
            value={form.summary}
            onChange={(e) => updateField("summary", e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
            placeholder="Brief summary (shown in cards and SEO description)"
          />
        </div>

        {/* Category + Tags (side by side on desktop) */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => updateField("tags", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="llm, vram, guide"
            />
          </div>
        </div>

        {/* Body (Markdown) */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Body (Markdown)
          </label>
          <textarea
            value={form.bodyMarkdown}
            onChange={(e) => updateField("bodyMarkdown", e.target.value)}
            rows={20}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
            placeholder="Write your article in Markdown..."
          />
        </div>

        {/* Cover image URL */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Cover Image URL (optional)
          </label>
          <input
            type="text"
            value={form.coverImageUrl}
            onChange={(e) => updateField("coverImageUrl", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Error / Saved */}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Saved successfully.
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Save Again" : "Save"}
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={handleTogglePublish}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                form.isPublished
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
              }`}
            >
              {form.isPublished ? "Unpublish" : "Publish"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
