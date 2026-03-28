import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPonderOn = vi.fn();

vi.mock("ponder:registry", () => ({
  ponder: {
    on: mockPonderOn,
  },
}));

describe("addOnchainEventListener", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("should call ponder.on with the correct event name and handler", async () => {
    const { addOnchainEventListener } = await import("./add-onchain-event-listener");
    const testHandler = vi.fn();

    addOnchainEventListener("Resolver:AddrChanged", testHandler);

    expect(mockPonderOn).toHaveBeenCalledWith("Resolver:AddrChanged", testHandler);
  });
});
