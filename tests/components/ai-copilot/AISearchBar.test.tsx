import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AISearchBar from "@/components/ai-copilot/AISearchBar";

const { pushMock, semanticSearchMock } = vi.hoisted(() => ({
    pushMock: vi.fn(),
    semanticSearchMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/contexts/AICopilotContext", () => ({
    useAICopilot: () => ({ role: "admin" }),
}));

vi.mock("@/services/aiService", () => ({
    aiService: {
        semanticSearch: semanticSearchMock,
    },
}));

describe("AISearchBar", () => {
    beforeEach(() => {
        pushMock.mockReset();
        semanticSearchMock.mockReset();
    });

    it("does not navigate when the AI payload contains a non-string href", async () => {
        semanticSearchMock.mockResolvedValue({
            data: {
                results: [
                    {
                        id: "bad-result",
                        type: "medicine",
                        title: "Bad result",
                        subtitle: "Invalid href should be ignored",
                        href: { path: "/admin/medicines" },
                    },
                ],
            },
        });

        render(<AISearchBar />);

        fireEvent.change(screen.getByPlaceholderText("Tìm kiếm với AI..."), {
            target: { value: "aspirin" },
        });

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 350));
        });

        await waitFor(() => expect(screen.getByText("Bad result")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Bad result"));

        expect(pushMock).not.toHaveBeenCalled();
    });
});
