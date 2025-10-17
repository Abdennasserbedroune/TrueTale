import { render, screen } from "@testing-library/react";
import DraftCommentsPanel from "@/components/drafts/DraftCommentsPanel";
import type { DraftWorkspaceComment } from "@/types";

describe("DraftCommentsPanel", () => {
  const authors = {
    "writer-aria": "Aria Sullivan",
    "writer-jules": "Jules Fern",
  };

  const comments: DraftWorkspaceComment[] = [
    {
      id: "comment-inline",
      draftId: "draft-test",
      authorId: "writer-aria",
      body: "Consider adding more sensory detail here.",
      createdAt: "2024-10-12T10:00:00.000Z",
      placement: "inline",
      quote: "The ember drifted closer",
    },
    {
      id: "comment-sidebar",
      draftId: "draft-test",
      authorId: "writer-jules",
      body: "Let's outline the next act before revising the intro.",
      createdAt: "2024-10-12T11:30:00.000Z",
      placement: "sidebar",
    },
  ];

  it("renders inline and sidebar comments in separate sections", () => {
    render(<DraftCommentsPanel comments={comments} authors={authors} />);

    const inlineSection = screen.getByTestId("comments-section-inline");
    const sidebarSection = screen.getByTestId("comments-section-sidebar");

    expect(inlineSection).toHaveTextContent("Aria Sullivan");
    expect(inlineSection).toHaveTextContent("The ember drifted closer");
    expect(sidebarSection).toHaveTextContent("Jules Fern");
  });

  it("shows helpful empty states when there are no comments", () => {
    render(<DraftCommentsPanel comments={[]} authors={authors} />);

    expect(screen.getByText("No inline comments yet")).toBeInTheDocument();
    expect(screen.getByText("No sidebar comments yet")).toBeInTheDocument();
  });
});
