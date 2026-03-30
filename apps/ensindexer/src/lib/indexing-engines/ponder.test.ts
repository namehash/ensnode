import type { Context, EventNames } from "ponder:registry";
import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import {
  addOnchainEventListener,
  type IndexingEngineContext,
  type IndexingEngineEvent,
} from "./ponder";

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
  beforeEach(() => {
    vi.clearAllMocks();
    mockWaitForEnsRainbow.mockResolvedValue(undefined);
  });

  describe("registration", () => {
    it("registers the handler with the correct event name", () => {
      const testHandler = vi.fn();

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, testHandler);

      expect(mockPonderOn).toHaveBeenCalledWith("Resolver:AddrChanged", expect.any(Function));
    });

    it("returns the result from ponder.on", () => {
      const mockReturnValue = { unsubscribe: vi.fn() };
      mockPonderOn.mockReturnValue(mockReturnValue);
      const testHandler = vi.fn();

      const result = addOnchainEventListener("Resolver:AddrChanged" as EventNames, testHandler);

      expect(result).toBe(mockReturnValue);
    });
  });

  describe("context transformation", () => {
    it("adds ensDb property referencing the same object as db", async () => {
      const testHandler = vi.fn();
      const mockDb = vi.fn();
      const mockContext = { db: mockDb } as unknown as Context<EventNames>;
      const mockEvent = {} as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, testHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      await callback({ context: mockContext, event: mockEvent });

      const callArg = testHandler.mock.calls[0]?.[0];
      expect(callArg?.context.ensDb).toBe(callArg?.context.db);
    });

    it("preserves all other context properties", async () => {
      const testHandler = vi.fn().mockResolvedValue(undefined);
      const mockDb = vi.fn();
      const mockContext = {
        db: mockDb,
        chain: { id: 1 },
        block: { number: 100n },
      } as unknown as Context<EventNames>;
      const mockEvent = { args: { a: "0x123" } } as unknown as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, testHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      await callback({ context: mockContext, event: mockEvent });

      expect(testHandler).toHaveBeenCalledWith({
        context: expect.objectContaining({
          db: mockDb,
          ensDb: mockDb,
          chain: { id: 1 },
          block: { number: 100n },
        }),
        event: mockEvent,
      });
    });
  });

  describe("event handling", () => {
    it("supports multiple event names independently", async () => {
      const handler1 = vi.fn().mockResolvedValue(undefined);
      const handler2 = vi.fn().mockResolvedValue(undefined);

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, handler1);
      addOnchainEventListener("Resolver:NameChanged" as EventNames, handler2);

      expect(mockPonderOn).toHaveBeenCalledTimes(2);

      const [, callback1] = mockPonderOn.mock.calls[0]!;
      const mockDb1 = vi.fn();
      const event1 = {} as IndexingEngineEvent<EventNames>;
      await callback1({
        context: { db: mockDb1 } as unknown as Context<EventNames>,
        event: event1,
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(0);

      const [, callback2] = mockPonderOn.mock.calls[1]!;
      const mockDb2 = vi.fn();
      const event2 = {} as IndexingEngineEvent<EventNames>;
      await callback2({
        context: { db: mockDb2 } as unknown as Context<EventNames>,
        event: event2,
      });

      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("passes the event argument through to the handler", async () => {
      const testHandler = vi.fn().mockResolvedValue(undefined);
      const mockDb = vi.fn();
      const mockEvent = {
        args: { node: "0x123", label: "0x456" },
      } as unknown as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, testHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      await callback({
        context: { db: mockDb } as unknown as Context<EventNames>,
        event: mockEvent,
      });

      expect(testHandler).toHaveBeenCalledWith(expect.objectContaining({ event: mockEvent }));
    });
  });

  describe("handler types", () => {
    it("handles async handlers", async () => {
      const asyncHandler = vi.fn().mockResolvedValue(undefined);
      const mockDb = vi.fn();
      const mockContext = { db: mockDb } as unknown as Context<EventNames>;
      const mockEvent = {} as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, asyncHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      await callback({ context: mockContext, event: mockEvent });

      expect(asyncHandler).toHaveBeenCalled();
    });

    it("handles sync handlers", async () => {
      const syncHandler = vi.fn();
      const mockDb = vi.fn();
      const mockContext = { db: mockDb } as unknown as Context<EventNames>;
      const mockEvent = {} as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, syncHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      await callback({ context: mockContext, event: mockEvent });

      expect(syncHandler).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("propagates errors from sync handlers", async () => {
      const error = new Error("Handler failed");
      const failingHandler = vi.fn(() => {
        throw error;
      });
      const mockDb = vi.fn();
      const mockContext = { db: mockDb } as unknown as Context<EventNames>;
      const mockEvent = {} as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, failingHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      await expect(callback({ context: mockContext, event: mockEvent })).rejects.toThrow(
        "Handler failed",
      );
    });

    it("propagates errors from async handlers", async () => {
      const error = new Error("Async handler failed");
      const failingHandler = vi.fn().mockRejectedValue(error);
      const mockDb = vi.fn();
      const mockContext = { db: mockDb } as unknown as Context<EventNames>;
      const mockEvent = {} as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, failingHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      await expect(callback({ context: mockContext, event: mockEvent })).rejects.toThrow(
        "Async handler failed",
      );
    });
  });

  describe("preconditions", () => {
    it("waits for ENSRainbow to be ready before executing onchain event handlers", async () => {
      const testHandler = vi.fn().mockResolvedValue(undefined);
      const mockDb = vi.fn();
      const mockContext = { db: mockDb } as unknown as Context<EventNames>;
      const mockEvent = {} as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, testHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      await callback({ context: mockContext, event: mockEvent });

      expect(mockWaitForEnsRainbow).toHaveBeenCalled();
      expect(testHandler).toHaveBeenCalled();
    });

    it("does not execute handler if ENSRainbow precondition fails", async () => {
      const testHandler = vi.fn().mockResolvedValue(undefined);
      const mockDb = vi.fn();
      const mockContext = { db: mockDb } as unknown as Context<EventNames>;
      const mockEvent = {} as IndexingEngineEvent<EventNames>;
      const preconditionError = new Error("ENSRainbow not ready");

      mockWaitForEnsRainbow.mockRejectedValue(preconditionError);

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, testHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      await expect(callback({ context: mockContext, event: mockEvent })).rejects.toThrow(
        "ENSRainbow not ready",
      );
      expect(testHandler).not.toHaveBeenCalled();
    });

    it("does not throw error for setup events - they have no preconditions", async () => {
      const testHandler = vi.fn().mockResolvedValue(undefined);
      const mockDb = vi.fn();
      const mockContext = { db: mockDb } as unknown as Context<EventNames>;
      const mockEvent = {} as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("Registry:setup" as EventNames, testHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      // Should not throw and should call handler without waiting for ENSRainbow
      await expect(callback({ context: mockContext, event: mockEvent })).resolves.toBeUndefined();
      expect(testHandler).toHaveBeenCalled();
      expect(mockWaitForEnsRainbow).not.toHaveBeenCalled();
    });

    it("resolves ENSRainbow precondition before calling handler", async () => {
      const testHandler = vi.fn().mockResolvedValue(undefined);
      const mockDb = vi.fn();
      const mockContext = { db: mockDb } as unknown as Context<EventNames>;
      const mockEvent = {} as IndexingEngineEvent<EventNames>;

      let preconditionResolved = false;
      mockWaitForEnsRainbow.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        preconditionResolved = true;
      });

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, testHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      await callback({ context: mockContext, event: mockEvent });

      expect(preconditionResolved).toBe(true);
      expect(testHandler).toHaveBeenCalled();
    });
  });

  describe("event type detection", () => {
    it("correctly identifies onchain events by name", async () => {
      const onchainHandler = vi.fn().mockResolvedValue(undefined);
      const mockDb = vi.fn();
      const mockContext = { db: mockDb } as unknown as Context<EventNames>;
      const mockEvent = {} as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("ETHRegistry:NewOwner" as EventNames, onchainHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      await callback({ context: mockContext, event: mockEvent });

      expect(mockWaitForEnsRainbow).toHaveBeenCalled();
      expect(onchainHandler).toHaveBeenCalled();
    });

    it("correctly identifies setup events by :setup suffix and skips preconditions", async () => {
      const setupHandler = vi.fn().mockResolvedValue(undefined);
      const mockDb = vi.fn();
      const mockContext = { db: mockDb } as unknown as Context<EventNames>;
      const mockEvent = {} as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("PublicResolver:setup" as EventNames, setupHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      await callback({ context: mockContext, event: mockEvent });

      // Setup events should not call ENSRainbow preconditions
      expect(mockWaitForEnsRainbow).not.toHaveBeenCalled();
      expect(setupHandler).toHaveBeenCalled();
    });

    it("handles various onchain event name formats", async () => {
      const testHandler = vi.fn().mockResolvedValue(undefined);
      const mockDb = vi.fn();
      const mockContext = { db: mockDb } as unknown as Context<EventNames>;
      const mockEvent = {} as IndexingEngineEvent<EventNames>;

      const onchainEvents = [
        "Resolver:AddrChanged",
        "Registry:Transfer",
        "ETHRegistry:NewResolver",
        "BaseRegistrar:NameRegistered",
      ];

      for (const eventName of onchainEvents) {
        vi.clearAllMocks();
        addOnchainEventListener(eventName as EventNames, testHandler);

        const [, callback] = mockPonderOn.mock.calls[0]!;
        await callback({ context: mockContext, event: mockEvent });

        expect(mockWaitForEnsRainbow).toHaveBeenCalled();
        expect(testHandler).toHaveBeenCalled();
      }
    });
  });
});

describe("IndexingEngineContext type", () => {
  it("exposes ensDb matching the Ponder db type", () => {
    expectTypeOf<IndexingEngineContext["ensDb"]>().toEqualTypeOf<Context<EventNames>["db"]>();
  });
});
