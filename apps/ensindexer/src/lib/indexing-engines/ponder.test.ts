import type { Context, EventNames } from "ponder:registry";
import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import type { IndexingEngineContext, IndexingEngineEvent } from "./ponder";

const { mockPonderOn } = vi.hoisted(() => ({ mockPonderOn: vi.fn() }));

const mockWaitForEnsRainbow = vi.hoisted(() => vi.fn());

vi.mock("ponder:registry", () => ({
  ponder: {
    on: (...args: unknown[]) => mockPonderOn(...args),
  },
}));

vi.mock("ponder:schema", () => ({
  ensIndexerSchema: {},
}));

vi.mock("@/lib/ensrainbow/singleton", () => ({
  waitForEnsRainbowToBeReady: mockWaitForEnsRainbow,
}));

describe("addOnchainEventListener", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockWaitForEnsRainbow.mockResolvedValue(undefined);
    // Reset module state to test idempotent behavior correctly
    vi.resetModules();
  });

  // Helper to get fresh module reference after resetModules()
  async function getPonderModule() {
    return await import("./ponder");
  }

  // Helper to extract the callback registered with ponder.on
  function getRegisteredCallback(
    callIndex = 0,
  ): (args: {
    context: Context<EventNames>;
    event: IndexingEngineEvent<EventNames>;
  }) => Promise<void> {
    return mockPonderOn.mock.calls[callIndex]![1] as ReturnType<typeof getRegisteredCallback>;
  }

  describe("handler registration", () => {
    it("registers the event name and handler with ponder.on", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const handler = vi.fn();

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, handler);

      expect(mockPonderOn).toHaveBeenCalledWith("Resolver:AddrChanged", expect.any(Function));
    });

    it("returns the subscription object from ponder.on", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const mockSubscription = { unsubscribe: vi.fn() };
      mockPonderOn.mockReturnValue(mockSubscription);
      const handler = vi.fn();

      const result = addOnchainEventListener("Resolver:AddrChanged" as EventNames, handler);

      expect(result).toBe(mockSubscription);
    });
  });

  describe("context transformation", () => {
    it("adds ensDb as an alias to the Ponder db", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const handler = vi.fn();
      const mockDb = vi.fn();
      const mockContext = { db: mockDb } as unknown as Context<EventNames>;

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, handler);
      await getRegisteredCallback()({
        context: mockContext,
        event: {} as IndexingEngineEvent<EventNames>,
      });

      const receivedContext = handler.mock.calls[0]![0].context;
      expect(receivedContext.ensDb).toBe(mockDb);
      expect(receivedContext.ensDb).toBe(receivedContext.db);
    });

    it("preserves all other Ponder context properties", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const handler = vi.fn().mockResolvedValue(undefined);
      const mockDb = vi.fn();
      const mockContext = {
        db: mockDb,
        chain: { id: 1 },
        block: { number: 100n },
        client: { request: vi.fn() },
      } as unknown as Context<EventNames>;
      const mockEvent = { args: { node: "0x123" } } as unknown as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, handler);
      await getRegisteredCallback()({ context: mockContext, event: mockEvent });

      expect(handler).toHaveBeenCalledWith({
        context: expect.objectContaining({
          db: mockDb,
          ensDb: mockDb,
          chain: { id: 1 },
          block: { number: 100n },
          client: expect.any(Object),
        }),
        event: mockEvent,
      });
    });
  });

  describe("event forwarding", () => {
    it("passes the original event to the handler unchanged", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const handler = vi.fn().mockResolvedValue(undefined);
      const mockDb = vi.fn();
      const mockEvent = {
        args: { node: "0x123", label: "0x456", owner: "0x789" },
        block: { number: 100n },
        transaction: { hash: "0xabc" },
      } as unknown as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("Registry:Transfer" as EventNames, handler);
      await getRegisteredCallback()({
        context: { db: mockDb } as unknown as Context<EventNames>,
        event: mockEvent,
      });

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ event: mockEvent }));
    });

    it("supports multiple independent event registrations", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const handler1 = vi.fn().mockResolvedValue(undefined);
      const handler2 = vi.fn().mockResolvedValue(undefined);

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, handler1);
      addOnchainEventListener("Resolver:NameChanged" as EventNames, handler2);

      expect(mockPonderOn).toHaveBeenCalledTimes(2);

      // Trigger first handler
      await getRegisteredCallback(0)({
        context: { db: vi.fn() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();

      // Trigger second handler
      await getRegisteredCallback(1)({
        context: { db: vi.fn() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe("handler types", () => {
    it("supports async handlers", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const asyncHandler = vi.fn().mockResolvedValue(undefined);

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, asyncHandler);
      await getRegisteredCallback()({
        context: { db: vi.fn() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });

      expect(asyncHandler).toHaveBeenCalled();
    });

    it("supports sync handlers", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const syncHandler = vi.fn();

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, syncHandler);
      await getRegisteredCallback()({
        context: { db: vi.fn() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });

      expect(syncHandler).toHaveBeenCalled();
    });
  });

  describe("error propagation", () => {
    it("re-throws errors from sync handlers", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const error = new Error("Sync handler failed");
      const failingHandler = vi.fn(() => {
        throw error;
      });

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, failingHandler);

      await expect(
        getRegisteredCallback()({
          context: { db: vi.fn() } as unknown as Context<EventNames>,
          event: {} as IndexingEngineEvent<EventNames>,
        }),
      ).rejects.toThrow("Sync handler failed");
    });

    it("re-throws errors from async handlers", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const error = new Error("Async handler failed");
      const failingHandler = vi.fn().mockRejectedValue(error);

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, failingHandler);

      await expect(
        getRegisteredCallback()({
          context: { db: vi.fn() } as unknown as Context<EventNames>,
          event: {} as IndexingEngineEvent<EventNames>,
        }),
      ).rejects.toThrow("Async handler failed");
    });
  });

  describe("ENSRainbow preconditions (onchain events)", () => {
    it("waits for ENSRainbow before executing the handler", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const handler = vi.fn().mockResolvedValue(undefined);

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, handler);
      await getRegisteredCallback()({
        context: { db: vi.fn() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });

      expect(mockWaitForEnsRainbow).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalled();
    });

    it("prevents handler execution if ENSRainbow is not ready", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const handler = vi.fn().mockResolvedValue(undefined);
      mockWaitForEnsRainbow.mockRejectedValue(new Error("ENSRainbow not ready"));

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, handler);

      await expect(
        getRegisteredCallback()({
          context: { db: vi.fn() } as unknown as Context<EventNames>,
          event: {} as IndexingEngineEvent<EventNames>,
        }),
      ).rejects.toThrow("ENSRainbow not ready");

      expect(handler).not.toHaveBeenCalled();
    });

    it("calls waitForEnsRainbowToBeReady only once across multiple onchain events (idempotent)", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const handler1 = vi.fn().mockResolvedValue(undefined);
      const handler2 = vi.fn().mockResolvedValue(undefined);

      // Register two different onchain event listeners
      addOnchainEventListener("Resolver:AddrChanged" as EventNames, handler1);
      addOnchainEventListener("Registry:Transfer" as EventNames, handler2);

      // Trigger the first event handler
      await getRegisteredCallback(0)({
        context: { db: vi.fn() } as unknown as Context<EventNames>,
        event: { args: { a: "1" } } as unknown as IndexingEngineEvent<EventNames>,
      });
      expect(mockWaitForEnsRainbow).toHaveBeenCalledTimes(1);

      // Trigger the second event handler
      await getRegisteredCallback(1)({
        context: { db: vi.fn() } as unknown as Context<EventNames>,
        event: { args: { a: "2" } } as unknown as IndexingEngineEvent<EventNames>,
      });

      // Should still only have been called once (idempotent behavior)
      expect(mockWaitForEnsRainbow).toHaveBeenCalledTimes(1);
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("calls waitForEnsRainbowToBeReady only once when two onchain callbacks fire concurrently before the readiness promise resolves", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const handler1 = vi.fn().mockResolvedValue(undefined);
      const handler2 = vi.fn().mockResolvedValue(undefined);
      let resolveReadiness: (() => void) | undefined;

      // Create a promise that won't resolve until we manually trigger it
      mockWaitForEnsRainbow.mockImplementation(() => {
        return new Promise<void>((resolve) => {
          resolveReadiness = resolve;
        });
      });

      // Register two different onchain event listeners
      addOnchainEventListener("Resolver:AddrChanged" as EventNames, handler1);
      addOnchainEventListener("Registry:Transfer" as EventNames, handler2);

      // Fire both handlers concurrently - neither should complete yet
      const promise1 = getRegisteredCallback(0)({
        context: { db: vi.fn() } as unknown as Context<EventNames>,
        event: { args: { a: "1" } } as unknown as IndexingEngineEvent<EventNames>,
      });
      const promise2 = getRegisteredCallback(1)({
        context: { db: vi.fn() } as unknown as Context<EventNames>,
        event: { args: { a: "2" } } as unknown as IndexingEngineEvent<EventNames>,
      });

      // Should only have been called once despite concurrent execution
      expect(mockWaitForEnsRainbow).toHaveBeenCalledTimes(1);

      // Neither handler should have executed yet
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();

      // Now resolve the readiness promise
      resolveReadiness!();

      // Wait for both handlers to complete
      await Promise.all([promise1, promise2]);

      // Both handlers should have executed after resolution
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("resolves ENSRainbow before calling the handler", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const handler = vi.fn().mockResolvedValue(undefined);
      let preconditionResolved = false;

      mockWaitForEnsRainbow.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        preconditionResolved = true;
      });

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, handler);
      await getRegisteredCallback()({
        context: { db: vi.fn() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });

      expect(preconditionResolved).toBe(true);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("setup events (no preconditions)", () => {
    it("skips ENSRainbow wait for :setup events", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const handler = vi.fn().mockResolvedValue(undefined);

      addOnchainEventListener("Registry:setup" as EventNames, handler);
      await getRegisteredCallback()({
        context: { db: vi.fn() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });

      expect(mockWaitForEnsRainbow).not.toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });

    it("handles various setup event name formats", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const handler = vi.fn().mockResolvedValue(undefined);
      const setupEvents = [
        "Registry:setup",
        "PublicResolver:setup",
        "ETHRegistrarController:setup",
      ];

      for (const eventName of setupEvents) {
        vi.clearAllMocks();
        handler.mockClear();

        addOnchainEventListener(eventName as EventNames, handler);
        await getRegisteredCallback()({
          context: { db: vi.fn() } as unknown as Context<EventNames>,
          event: {} as IndexingEngineEvent<EventNames>,
        });

        expect(mockWaitForEnsRainbow).not.toHaveBeenCalled();
        expect(handler).toHaveBeenCalled();
      }
    });
  });

  describe("event type detection", () => {
    it("treats :setup suffix as setup event type", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const setupHandler = vi.fn().mockResolvedValue(undefined);
      const onchainHandler = vi.fn().mockResolvedValue(undefined);

      addOnchainEventListener("PublicResolver:setup" as EventNames, setupHandler);
      addOnchainEventListener("PublicResolver:AddrChanged" as EventNames, onchainHandler);

      // Setup event - no ENSRainbow wait
      await getRegisteredCallback(0)({
        context: { db: vi.fn() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });
      expect(mockWaitForEnsRainbow).not.toHaveBeenCalled();
      expect(setupHandler).toHaveBeenCalled();

      // Onchain event - ENSRainbow wait required
      await getRegisteredCallback(1)({
        context: { db: vi.fn() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });
      expect(mockWaitForEnsRainbow).toHaveBeenCalledTimes(1);
      expect(onchainHandler).toHaveBeenCalled();
    });

    it("treats all non-:setup events as onchain events", async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const onchainEvents = [
        "Resolver:AddrChanged",
        "Registry:Transfer",
        "ETHRegistry:NewResolver",
        "BaseRegistrar:NameRegistered",
      ];

      for (const eventName of onchainEvents) {
        vi.clearAllMocks();
        vi.resetModules();
        const { addOnchainEventListener: freshAddOnchainEventListener } = await getPonderModule();
        handler.mockClear();

        freshAddOnchainEventListener(eventName as EventNames, handler);
        await getRegisteredCallback()({
          context: { db: vi.fn() } as unknown as Context<EventNames>,
          event: {} as IndexingEngineEvent<EventNames>,
        });

        expect(mockWaitForEnsRainbow).toHaveBeenCalled();
        expect(handler).toHaveBeenCalled();
      }
    });
  });
});

describe("IndexingEngineContext type", () => {
  it("exposes ensDb matching the Ponder db type", () => {
    expectTypeOf<IndexingEngineContext["ensDb"]>().toEqualTypeOf<Context<EventNames>["db"]>();
  });
});
