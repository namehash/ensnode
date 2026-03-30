import type { Context, EventNames } from "ponder:registry";
import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import {
  addOnchainEventListener,
  type IndexingEngineContext,
  type IndexingEngineEvent,
} from "./ponder";

const { mockPonderOn } = vi.hoisted(() => ({ mockPonderOn: vi.fn() }));

vi.mock("ponder:registry", () => ({
  ponder: {
    on: (...args: unknown[]) => mockPonderOn(...args),
  },
}));

vi.mock("ponder:schema", () => ({
  ensIndexerSchema: {},
}));

describe("addOnchainEventListener", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    it("adds ensDb property referencing the same object as db", () => {
      const testHandler = vi.fn();
      const mockDb = vi.fn();
      const mockContext = { db: mockDb } as unknown as Context<EventNames>;
      const mockEvent = {} as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, testHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      callback({ context: mockContext, event: mockEvent });

      const callArg = testHandler.mock.calls[0]?.[0];
      expect(callArg?.context.ensDb).toBe(callArg?.context.db);
    });

    it("preserves all other context properties", () => {
      const testHandler = vi.fn();
      const mockDb = vi.fn();
      const mockContext = {
        db: mockDb,
        chain: { id: 1 },
        block: { number: 100n },
      } as unknown as Context<EventNames>;
      const mockEvent = { args: { a: "0x123" } } as unknown as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, testHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      callback({ context: mockContext, event: mockEvent });

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
    it("supports multiple event names independently", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, handler1);
      addOnchainEventListener("Resolver:NameChanged" as EventNames, handler2);

      expect(mockPonderOn).toHaveBeenCalledTimes(2);

      const [, callback1] = mockPonderOn.mock.calls[0]!;
      const mockDb1 = vi.fn();
      const event1 = {} as IndexingEngineEvent<EventNames>;
      callback1({ context: { db: mockDb1 } as unknown as Context<EventNames>, event: event1 });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(0);

      const [, callback2] = mockPonderOn.mock.calls[1]!;
      const mockDb2 = vi.fn();
      const event2 = {} as IndexingEngineEvent<EventNames>;
      callback2({ context: { db: mockDb2 } as unknown as Context<EventNames>, event: event2 });

      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("passes the event argument through to the handler", () => {
      const testHandler = vi.fn();
      const mockDb = vi.fn();
      const mockEvent = {
        args: { node: "0x123", label: "0x456" },
      } as unknown as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, testHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      callback({ context: { db: mockDb } as unknown as Context<EventNames>, event: mockEvent });

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

    it("handles sync handlers", () => {
      const syncHandler = vi.fn();
      const mockDb = vi.fn();
      const mockContext = { db: mockDb } as unknown as Context<EventNames>;
      const mockEvent = {} as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, syncHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      callback({ context: mockContext, event: mockEvent });

      expect(syncHandler).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("propagates errors from sync handlers", () => {
      const error = new Error("Handler failed");
      const failingHandler = vi.fn(() => {
        throw error;
      });
      const mockDb = vi.fn();
      const mockContext = { db: mockDb } as unknown as Context<EventNames>;
      const mockEvent = {} as IndexingEngineEvent<EventNames>;

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, failingHandler);

      const [, callback] = mockPonderOn.mock.calls[0]!;
      expect(() => callback({ context: mockContext, event: mockEvent })).toThrow("Handler failed");
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
});

describe("IndexingEngineContext type", () => {
  it("exposes ensDb matching the Ponder db type", () => {
    expectTypeOf<IndexingEngineContext["ensDb"]>().toEqualTypeOf<Context<EventNames>["db"]>();
  });
});
