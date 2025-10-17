"use client";

import { useState, type FormEvent, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { profileUpdateSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";

interface ProfileFormProps {
  initialData?: {
    displayName: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    avatarUrl: string | null;
    genres: string[] | null;
  };
  mode?: "onboarding" | "edit";
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function ProfileForm({ initialData, mode = "edit" }: ProfileFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [displayName, setDisplayName] = useState(initialData?.displayName ?? "");
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [website, setWebsite] = useState(initialData?.website ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatarUrl ?? "");
  const [genresInput, setGenresInput] = useState((initialData?.genres ?? []).join(", "));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const genres = useMemo(
    () =>
      genresInput
        .split(",")
        .map((genre) => genre.trim())
        .filter(Boolean),
    [genresInput],
  );

  const handleAvatarUpload = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError("Avatar must be smaller than 5MB");
      return;
    }

    setError(null);
    setIsUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });

    setIsUploading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.message ?? "Avatar upload failed");
      return;
    }

    const data = (await response.json()) as { url: string };
    setAvatarUrl(data.url);
    setSuccess("Avatar updated successfully");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      displayName,
      bio,
      location,
      website,
      genres,
      avatarUrl,
    };

    const parsed = profileUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid profile details");
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.message ?? "Unable to update profile");
      return;
    }

    setSuccess(mode === "onboarding" ? "Profile completed!" : "Profile updated");
    await update();

    if (mode === "onboarding") {
      router.push("/dashboard");
    } else {
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl || "/avatar-placeholder.svg"}
            alt="Avatar preview"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Profile avatar</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="mt-1 text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleAvatarUpload(file);
              }
            }}
          />
          <p className="mt-1 text-xs text-slate-500">PNG, JPG, or WebP up to 5MB.</p>
        </div>
      </div>

      <div>
        <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-slate-700">
          Display name
        </label>
        <Input
          id="displayName"
          name="displayName"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium text-slate-700">
          Bio
        </label>
        <TextArea
          id="bio"
          name="bio"
          value={bio}
          rows={4}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Share what drives your writing and the narratives you explore."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="location" className="mb-1 block text-sm font-medium text-slate-700">
            Location
          </label>
          <Input
            id="location"
            name="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="City, Country"
          />
        </div>
        <div>
          <label htmlFor="website" className="mb-1 block text-sm font-medium text-slate-700">
            Website
          </label>
          <Input
            id="website"
            name="website"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="genres" className="mb-1 block text-sm font-medium text-slate-700">
          Genres or themes
        </label>
        <Input
          id="genres"
          name="genres"
          value={genresInput}
          onChange={(event) => setGenresInput(event.target.value)}
          placeholder="Fantasy, Narrative Non-fiction, Essays"
        />
        <p className="mt-1 text-xs text-slate-500">Separate genres with commas.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting || isUploading}>
          {isSubmitting ? "Saving..." : "Save profile"}
        </Button>
        {isUploading && <span className="text-sm text-slate-500">Uploading avatar...</span>}
      </div>
    </form>
  );
}
