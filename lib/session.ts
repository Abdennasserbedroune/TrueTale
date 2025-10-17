import { writers } from "@/data/sampleData";

export const currentUserId = "writer-aria";

export const currentUser = writers.find((writer) => writer.id === currentUserId)!;
