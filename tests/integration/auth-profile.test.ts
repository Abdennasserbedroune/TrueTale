import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as registerPost } from "@/app/api/auth/register/route";
import { GET as profileGet, PATCH as profilePatch } from "@/app/api/profile/route";
import { authConfig } from "@/lib/auth/config";
import { hashPassword } from "@/lib/password";

interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProfileRecord {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  avatarUrl: string | null;
  genres: string[];
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mockDb: { users: UserRecord[]; profiles: ProfileRecord[] } = {
  users: [],
  profiles: [],
};

afterEach(() => {
  mockAuth.mockReset();
});

beforeEach(() => {
  mockDb.users.splice(0, mockDb.users.length);
  mockDb.profiles.splice(0, mockDb.profiles.length);
  prismaMock.user.findUnique.mockClear();
  prismaMock.user.create.mockClear();
  prismaMock.user.update.mockClear();
  prismaMock.profile.findUnique.mockClear();
  prismaMock.profile.create.mockClear();
  prismaMock.profile.upsert.mockClear();
});

function buildUserResponse(user: UserRecord, includeProfile?: boolean) {
  const profile = mockDb.profiles.find((p) => p.userId === user.id) ?? null;
  const response = { ...user } as UserRecord & { profile?: ProfileRecord | null };
  if (includeProfile) {
    response.profile = profile ? { ...profile } : null;
  }
  return response;
}

const prismaMock = {
  user: {
    findUnique: vi.fn(async (args: { where: { id?: string; email?: string }; include?: { profile?: boolean } }) => {
      const { where, include } = args;
      let user: UserRecord | undefined;
      if (where.email) {
        user = mockDb.users.find((record) => record.email === where.email);
      }
      if (!user && where.id) {
        user = mockDb.users.find((record) => record.id === where.id);
      }
      if (!user) {
        return null;
      }
      return buildUserResponse(user, include?.profile ?? false);
    }),
    create: vi.fn(async ({ data }: { data: any }) => {
      const id = data.id ?? `user_${mockDb.users.length + 1}`;
      const now = new Date();
      const user: UserRecord = {
        id,
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        createdAt: now,
        updatedAt: now,
      };
      mockDb.users.push(user);

      if (data.profile?.create) {
        const profileData = data.profile.create;
        const profile: ProfileRecord = {
          id: profileData.id ?? `profile_${mockDb.profiles.length + 1}`,
          userId: user.id,
          displayName: profileData.displayName,
          bio: profileData.bio ?? null,
          location: profileData.location ?? null,
          website: profileData.website ?? null,
          avatarUrl: profileData.avatarUrl ?? null,
          genres: profileData.genres ?? [],
          isOnboarded: profileData.isOnboarded ?? false,
          createdAt: now,
          updatedAt: now,
        };
        mockDb.profiles.push(profile);
      }

      return buildUserResponse(user, Boolean(data?.include?.profile));
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: any }) => {
      const user = mockDb.users.find((record) => record.id === where.id);
      if (!user) {
        throw new Error("User not found");
      }
      if (data.name !== undefined) {
        user.name = data.name;
      }
      user.updatedAt = new Date();
      return buildUserResponse(user, Boolean(data?.include?.profile));
    }),
  },
  profile: {
    findUnique: vi.fn(async ({ where }: { where: { id?: string; userId?: string } }) => {
      let profile: ProfileRecord | undefined;
      if (where.userId) {
        profile = mockDb.profiles.find((record) => record.userId === where.userId);
      }
      if (!profile && where.id) {
        profile = mockDb.profiles.find((record) => record.id === where.id);
      }
      return profile ? { ...profile } : null;
    }),
    create: vi.fn(async ({ data }: { data: any }) => {
      const now = new Date();
      const profile: ProfileRecord = {
        id: data.id ?? `profile_${mockDb.profiles.length + 1}`,
        userId: data.userId,
        displayName: data.displayName,
        bio: data.bio ?? null,
        location: data.location ?? null,
        website: data.website ?? null,
        avatarUrl: data.avatarUrl ?? null,
        genres: data.genres ?? [],
        isOnboarded: data.isOnboarded ?? false,
        createdAt: now,
        updatedAt: now,
      };
      mockDb.profiles.push(profile);
      return { ...profile };
    }),
    upsert: vi.fn(async ({ where, create, update }: { where: { userId: string }; create: any; update: any }) => {
      const existing = mockDb.profiles.find((record) => record.userId === where.userId);
      const now = new Date();
      if (existing) {
        existing.displayName = update.displayName ?? existing.displayName;
        existing.bio = update.bio ?? null;
        existing.location = update.location ?? null;
        existing.website = update.website ?? null;
        existing.avatarUrl = update.avatarUrl ?? null;
        existing.genres = update.genres ?? [];
        existing.isOnboarded = update.isOnboarded ?? existing.isOnboarded;
        existing.updatedAt = now;
        return { ...existing };
      }

      const profile: ProfileRecord = {
        id: create.id ?? `profile_${mockDb.profiles.length + 1}`,
        userId: where.userId,
        displayName: create.displayName,
        bio: create.bio ?? null,
        location: create.location ?? null,
        website: create.website ?? null,
        avatarUrl: create.avatarUrl ?? null,
        genres: create.genres ?? [],
        isOnboarded: create.isOnboarded ?? false,
        createdAt: now,
        updatedAt: now,
      };
      mockDb.profiles.push(profile);
      return { ...profile };
    }),
  },
} as const;

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

const mockAuth = vi.fn();

vi.mock("@/auth", async () => {
  const actual = await vi.importActual<typeof import("@/auth")>("@/auth");
  return {
    ...actual,
    auth: mockAuth,
  };
});

describe("Authentication flows", () => {
  it("registers a new user and profile", async () => {
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "supersecure",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await registerPost(request);
    expect(response.status).toBe(201);
    expect(mockDb.users).toHaveLength(1);
    expect(mockDb.profiles).toHaveLength(1);
    const profile = mockDb.profiles[0];
    expect(profile.displayName).toBe("Ada Lovelace");
    expect(profile.isOnboarded).toBe(false);
  });

  it("prevents duplicate registrations for the same email", async () => {
    const now = new Date();
    mockDb.users.push({
      id: "user_existing",
      email: "duplicate@example.com",
      name: "Existing Writer",
      passwordHash: "hash",
      createdAt: now,
      updatedAt: now,
    });

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "New Writer",
        email: "duplicate@example.com",
        password: "anotherpass",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await registerPost(request);
    expect(response.status).toBe(409);
    expect(mockDb.users).toHaveLength(1);
  });

  it("authorizes valid credentials", async () => {
    const passwordHash = await hashPassword("valid-password");
    const now = new Date();
    mockDb.users.push({
      id: "user_auth",
      email: "author@example.com",
      name: "Author",
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });
    mockDb.profiles.push({
      id: "profile_auth",
      userId: "user_auth",
      displayName: "Author",
      bio: null,
      location: null,
      website: null,
      avatarUrl: null,
      genres: [],
      isOnboarded: true,
      createdAt: now,
      updatedAt: now,
    });

    const credentialsProvider: any = authConfig.providers?.[0];
    const result = await credentialsProvider.authorize({
      email: "author@example.com",
      password: "valid-password",
    });

    expect(result).toBeTruthy();
    expect(result).toMatchObject({ id: "user_auth", email: "author@example.com" });
  });

  it("rejects invalid password attempts", async () => {
    const passwordHash = await hashPassword("valid-password");
    const now = new Date();
    mockDb.users.push({
      id: "user_invalid",
      email: "nope@example.com",
      name: "Wrong",
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    const credentialsProvider: any = authConfig.providers?.[0];
    const result = await credentialsProvider.authorize({
      email: "nope@example.com",
      password: "wrong-password",
    });

    expect(result).toBeNull();
  });
});

describe("Profile APIs", () => {
  const session = {
    user: {
      id: "user_profile",
      email: "profile@example.com",
      name: "Profiled",
      profileComplete: true,
    },
  } as const;

  beforeEach(() => {
    mockAuth.mockResolvedValue(session);
  });

  it("returns the current profile", async () => {
    const now = new Date();
    mockDb.users.push({
      id: "user_profile",
      email: "profile@example.com",
      name: "Profiled",
      passwordHash: "hash",
      createdAt: now,
      updatedAt: now,
    });
    mockDb.profiles.push({
      id: "profile_profile",
      userId: "user_profile",
      displayName: "Profiled",
      bio: "Writer",
      location: "NYC",
      website: "https://example.com",
      avatarUrl: null,
      genres: ["Essays"],
      isOnboarded: true,
      createdAt: now,
      updatedAt: now,
    });

    const response = await profileGet();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.profile.displayName).toBe("Profiled");
    expect(prismaMock.profile.findUnique).toHaveBeenCalledWith({ where: { userId: "user_profile" } });
  });

  it("updates profile details and marks onboarding complete", async () => {
    const now = new Date();
    mockDb.users.push({
      id: "user_profile",
      email: "profile@example.com",
      name: "Old Name",
      passwordHash: "hash",
      createdAt: now,
      updatedAt: now,
    });
    mockDb.profiles.push({
      id: "profile_profile",
      userId: "user_profile",
      displayName: "Old Name",
      bio: null,
      location: null,
      website: null,
      avatarUrl: null,
      genres: [],
      isOnboarded: false,
      createdAt: now,
      updatedAt: now,
    });

    const patchRequest = new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({
        displayName: "New Name",
        bio: "I write speculative fiction.",
        location: "Berlin",
        website: "https://fiction.example",
        genres: ["Speculative", "Fiction"],
        avatarUrl: "/uploads/avatar.png",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await profilePatch(patchRequest);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.profile.displayName).toBe("New Name");
    expect(body.profile.isOnboarded).toBe(true);

    const updatedProfile = mockDb.profiles.find((p) => p.userId === "user_profile");
    expect(updatedProfile?.displayName).toBe("New Name");
    expect(updatedProfile?.isOnboarded).toBe(true);

    const updatedUser = mockDb.users.find((u) => u.id === "user_profile");
    expect(updatedUser?.name).toBe("New Name");
  });
});
