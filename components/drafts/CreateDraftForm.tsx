'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

interface CollaboratorOption {
  id: string;
  name: string;
}

interface CreateDraftFormProps {
  collaborators: CollaboratorOption[];
}

export default function CreateDraftForm({ collaborators }: CreateDraftFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("Untitled draft");
  const [visibility, setVisibility] = useState<"private" | "shared" | "public">("private");
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSharedWriter = (writerId: string) => {
    setSharedWith((current) => {
      if (current.includes(writerId)) {
        return current.filter((id) => id !== writerId);
      }
      return [...current, writerId];
    });
  };

  const reset = () => {
    setTitle("Untitled draft");
    setVisibility("private");
    setSharedWith([]);
  };

  const submit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const body = {
        title,
        visibility,
        sharedWith: visibility === "shared" ? sharedWith : [],
      };
      const response = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error("Failed to create draft");
      }
      const data = await response.json();
      reset();
      router.refresh();
      router.push(`/drafts/${data.draft.id}`);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Unable to create draft");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Start a new draft</h2>
      <div className="mt-4 space-y-4">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Visibility</legend>
          <div className="flex flex-wrap gap-3 text-sm text-neutral-600 dark:text-neutral-400">
            {([
              { value: "private", label: "Private" },
              { value: "shared", label: "Shared" },
              { value: "public", label: "Public" },
            ] as const).map((option) => (
              <label key={option.value} className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="draft-visibility"
                  value={option.value}
                  checked={visibility === option.value}
                  onChange={() => setVisibility(option.value)}
                  className="h-4 w-4 text-emerald-500 focus:ring-emerald-400"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {visibility === "shared" ? (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Share with collaborators
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              {collaborators.map((collaborator) => (
                <label
                  key={collaborator.id}
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
                >
                  <input
                    type="checkbox"
                    checked={sharedWith.includes(collaborator.id)}
                    onChange={() => toggleSharedWriter(collaborator.id)}
                    className="h-4 w-4 text-emerald-500 focus:ring-emerald-400"
                  />
                  <span>{collaborator.name}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={submit}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-wait disabled:bg-emerald-400"
        >
          {isSubmitting ? "Creating..." : "Create draft"}
        </button>
        {error ? <p className="text-xs text-rose-500">{error}</p> : null}
      </div>
    </div>
  );
}
