import type { Context, EventNames } from "ponder:registry";
import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import { OmnichainIndexingStatusIds } from "@ensnode/ensnode-sdk";

import type { IndexingEngineContext, IndexingEngineEvent } from "./ponder";

const { mockPonderOn } = vi.hoisted(() => ({ mockPonderOn: vi.fn() }));

const mockWaitForEnsRainbow = vi.hoisted(() => vi.fn());

const mockGetEnsRainbowPublicConfig = vi.hoisted(() => vi.fn());
const mockGetIndexingStatusSnapshot = vi.hoisted(() => vi.fn());
const mockUpsertEnsRainbowPublicConfig = vi.hoisted(() => vi.fn());

const mockEnsRainbowClientConfig = vi.hoisted(() => vi.fn());

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
  ensRainbowClient: {
    config: mockEnsRainbowClientConfig,
  },
}));

vi.mock("@/lib/ensdb/singleton", () => ({
  ensDbClient: {
    getEnsRainbowPublicConfig: mockGetEnsRainbowPublicConfig,
    getIndexingStatusSnapshot: mockGetIndexingStatusSnapshot,
    upsertEnsRainbowPublicConfig: mockUpsertEnsRainbowPublicConfig,
  },
}));

vi.mock("p-retry", () => ({
  default: (fn: () => Promise<unknown>) => fn(),
}));

describe("addOnchainEventListener", () => {
  // Test fixtures
  const createMockDb = () => vi.fn();
  const createMockContext = (db = createMockDb()) =>
    ({
      db,
      chain: { id: 1 },
      block: { number: 100n },
      client: { request: vi.fn() },
    }) as unknown as Context<EventNames>;
  const createMockEvent = () =>
    ({ args: { node: "0x123" } }) as unknown as IndexingEngineEvent<EventNames>;
  const createHandler = () => vi.fn().mockResolvedValue(undefined);

  // ENSRainbow config factories
  const createEnsRainbowConfig = (labelSetId = "test-label-set", version = 1) => ({
    labelSet: { labelSetId, highestLabelSetVersion: version },
  });

  const createUnstartedIndexingStatus = () => ({
    omnichainSnapshot: { omnichainStatus: OmnichainIndexingStatusIds.Unstarted },
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    // Default mocks for successful ENSRainbow connection
    mockGetEnsRainbowPublicConfig.mockResolvedValue(createEnsRainbowConfig());
    mockGetIndexingStatusSnapshot.mockResolvedValue(createUnstartedIndexingStatus());
    mockUpsertEnsRainbowPublicConfig.mockResolvedValue(undefined);
    mockEnsRainbowClientConfig.mockResolvedValue(createEnsRainbowConfig());
    mockWaitForEnsRainbow.mockResolvedValue(undefined);
    vi.resetModules();
  });

  async function getPonderModule() {
    return await import("./ponder");
  }

  function getRegisteredCallback(
    callIndex = 0,
  ): (args: {
    context: Context<EventNames>;
    event: IndexingEngineEvent<EventNames>;
  }) => Promise<void> {
    return mockPonderOn.mock.calls[callIndex]![1] as ReturnType<typeof getRegisteredCallback>;
  }

  async function registerAndExecuteHandler(
    eventName: EventNames,
    handler: ReturnType<typeof createHandler>,
    context?: Context<EventNames>,
    event?: IndexingEngineEvent<EventNames>,
  ) {
    const { addOnchainEventListener } = await getPonderModule();
    addOnchainEventListener(eventName, handler);
    await getRegisteredCallback()({
      context: context ?? ({ db: createMockDb() } as unknown as Context<EventNames>),
      event: event ?? ({} as IndexingEngineEvent<EventNames>),
    });
    return handler;
  }

  async function expectHandlerThrows(setupFn: () => Promise<void>, expectedError: string | RegExp) {
    await expect(setupFn()).rejects.toThrow(expectedError);
  }

  describe("handler registration", () => {
    it("registers the event name and handler with ponder.on", async () => {
      const { addOnchainEventListener } = await getPonderModule();

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, createHandler());

      expect(mockPonderOn).toHaveBeenCalledWith("Resolver:AddrChanged", expect.any(Function));
    });

    it("returns the subscription object from ponder.on", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const mockSubscription = { unsubscribe: vi.fn() };
      mockPonderOn.mockReturnValue(mockSubscription);

      const result = addOnchainEventListener("Resolver:AddrChanged" as EventNames, createHandler());

      expect(result).toBe(mockSubscription);
    });
  });

  describe("context transformation", () => {
    it("adds ensDb as an alias to the Ponder db", async () => {
      const mockDb = createMockDb();
      const handler = await registerAndExecuteHandler(
        "Resolver:AddrChanged" as EventNames,
        createHandler(),
        { db: mockDb } as unknown as Context<EventNames>,
      );

      const receivedContext = handler.mock.calls[0]![0].context;
      expect(receivedContext.ensDb).toBe(mockDb);
      expect(receivedContext.ensDb).toBe(receivedContext.db);
    });

    it("preserves all other Ponder context properties", async () => {
      const mockContext = createMockContext();
      const mockEvent = createMockEvent();
      const handler = await registerAndExecuteHandler(
        "Resolver:AddrChanged" as EventNames,
        createHandler(),
        mockContext,
        mockEvent,
      );

      expect(handler).toHaveBeenCalledWith({
        context: expect.objectContaining({
          db: mockContext.db,
          ensDb: mockContext.db,
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
      const mockEvent = {
        args: { node: "0x123", label: "0x456", owner: "0x789" },
        block: { number: 100n },
        transaction: { hash: "0xabc" },
      } as unknown as IndexingEngineEvent<EventNames>;
      const handler = await registerAndExecuteHandler(
        "Registry:Transfer" as EventNames,
        createHandler(),
        { db: createMockDb() } as unknown as Context<EventNames>,
        mockEvent,
      );

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ event: mockEvent }));
    });

    it("supports multiple independent event registrations", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const handler1 = createHandler();
      const handler2 = createHandler();

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, handler1);
      addOnchainEventListener("Resolver:NameChanged" as EventNames, handler2);

      expect(mockPonderOn).toHaveBeenCalledTimes(2);

      await getRegisteredCallback(0)({
        context: { db: createMockDb() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();

      await getRegisteredCallback(1)({
        context: { db: createMockDb() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe("handler types", () => {
    it("supports async handlers", async () => {
      const handler = await registerAndExecuteHandler(
        "Resolver:AddrChanged" as EventNames,
        createHandler(),
      );
      expect(handler).toHaveBeenCalled();
    });

    it("supports sync handlers", async () => {
      const syncHandler = vi.fn();
      await registerAndExecuteHandler("Resolver:AddrChanged" as EventNames, syncHandler);
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

      await expectHandlerThrows(
        async () =>
          getRegisteredCallback()({
            context: { db: createMockDb() } as unknown as Context<EventNames>,
            event: {} as IndexingEngineEvent<EventNames>,
          }),
        "Sync handler failed",
      );
    });

    it("re-throws errors from async handlers", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const error = new Error("Async handler failed");
      const failingHandler = vi.fn().mockRejectedValue(error);

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, failingHandler);

      await expectHandlerThrows(
        async () =>
          getRegisteredCallback()({
            context: { db: createMockDb() } as unknown as Context<EventNames>,
            event: {} as IndexingEngineEvent<EventNames>,
          }),
        "Async handler failed",
      );
    });
  });

  describe("ENSRainbow preconditions (onchain events)", () => {
    it("waits for ENSRainbow before executing the handler", async () => {
      const handler = await registerAndExecuteHandler(
        "Resolver:AddrChanged" as EventNames,
        createHandler(),
      );
      expect(mockWaitForEnsRainbow).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalled();
    });

    it("fetches ENSRainbow public config from ENSDb", async () => {
      await registerAndExecuteHandler("Resolver:AddrChanged" as EventNames, createHandler());
      expect(mockGetEnsRainbowPublicConfig).toHaveBeenCalledTimes(1);
    });

    it("fetches ENSRainbow public config from ENSRainbow API when not stored", async () => {
      mockGetEnsRainbowPublicConfig.mockResolvedValue(undefined);

      await registerAndExecuteHandler("Resolver:AddrChanged" as EventNames, createHandler());

      expect(mockEnsRainbowClientConfig).toHaveBeenCalledTimes(1);
    });

    it("validates indexing status is Unstarted when no config stored", async () => {
      mockGetEnsRainbowPublicConfig.mockResolvedValue(undefined);
      mockGetIndexingStatusSnapshot.mockResolvedValue(createUnstartedIndexingStatus());

      const handler = await registerAndExecuteHandler(
        "Resolver:AddrChanged" as EventNames,
        createHandler(),
      );

      expect(mockGetIndexingStatusSnapshot).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalled();
    });

    it("throws when indexing status is not Unstarted and no config stored", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      mockGetEnsRainbowPublicConfig.mockResolvedValue(undefined);
      mockGetIndexingStatusSnapshot.mockResolvedValue({
        omnichainSnapshot: { omnichainStatus: OmnichainIndexingStatusIds.Backfill },
      });

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, createHandler());

      await expectHandlerThrows(
        async () =>
          getRegisteredCallback()({
            context: { db: createMockDb() } as unknown as Context<EventNames>,
            event: {} as IndexingEngineEvent<EventNames>,
          }),
        `omnichain indexing status must be '${OmnichainIndexingStatusIds.Unstarted}'`,
      );
    });

    it("throws when indexing status snapshot is missing", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      mockGetEnsRainbowPublicConfig.mockResolvedValue(undefined);
      mockGetIndexingStatusSnapshot.mockResolvedValue(undefined);

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, createHandler());

      await expectHandlerThrows(
        async () =>
          getRegisteredCallback()({
            context: { db: createMockDb() } as unknown as Context<EventNames>,
            event: {} as IndexingEngineEvent<EventNames>,
          }),
        /.*/, // Any error is acceptable
      );
    });

    describe("config validation", () => {
      it("validates fetched config against stored config when config exists", async () => {
        const storedConfig = createEnsRainbowConfig("test-label-set", 1);
        const fetchedConfig = createEnsRainbowConfig("test-label-set", 1);
        mockGetEnsRainbowPublicConfig.mockResolvedValue(storedConfig);
        mockEnsRainbowClientConfig.mockResolvedValue(fetchedConfig);

        const handler = await registerAndExecuteHandler(
          "Resolver:AddrChanged" as EventNames,
          createHandler(),
        );

        expect(handler).toHaveBeenCalled();
        expect(mockUpsertEnsRainbowPublicConfig).toHaveBeenCalledWith(fetchedConfig);
      });

      it("throws when config validation fails due to labelSetId mismatch", async () => {
        const { addOnchainEventListener } = await getPonderModule();
        const storedConfig = createEnsRainbowConfig("stored-label-set", 1);
        const fetchedConfig = createEnsRainbowConfig("fetched-label-set", 1);
        mockGetEnsRainbowPublicConfig.mockResolvedValue(storedConfig);
        mockEnsRainbowClientConfig.mockResolvedValue(fetchedConfig);

        addOnchainEventListener("Resolver:AddrChanged" as EventNames, createHandler());

        await expectHandlerThrows(
          async () =>
            getRegisteredCallback()({
              context: { db: createMockDb() } as unknown as Context<EventNames>,
              event: {} as IndexingEngineEvent<EventNames>,
            }),
          /label set ID/i,
        );
      });

      it("throws when config validation fails due to version downgrade", async () => {
        const { addOnchainEventListener } = await getPonderModule();
        const storedConfig = createEnsRainbowConfig("test-label-set", 2);
        const fetchedConfig = createEnsRainbowConfig("test-label-set", 1);
        mockGetEnsRainbowPublicConfig.mockResolvedValue(storedConfig);
        mockEnsRainbowClientConfig.mockResolvedValue(fetchedConfig);

        addOnchainEventListener("Resolver:AddrChanged" as EventNames, createHandler());

        await expectHandlerThrows(
          async () =>
            getRegisteredCallback()({
              context: { db: createMockDb() } as unknown as Context<EventNames>,
              event: {} as IndexingEngineEvent<EventNames>,
            }),
          /highest label set version/i,
        );
      });
    });

    it("throws when ENSRainbow config is missing from API response", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      mockGetEnsRainbowPublicConfig.mockResolvedValue(undefined);
      mockGetIndexingStatusSnapshot.mockResolvedValue(createUnstartedIndexingStatus());
      mockEnsRainbowClientConfig.mockResolvedValue(undefined);

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, createHandler());

      await expectHandlerThrows(
        async () =>
          getRegisteredCallback()({
            context: { db: createMockDb() } as unknown as Context<EventNames>,
            event: {} as IndexingEngineEvent<EventNames>,
          }),
        "ENSRainbow Public Config is missing from the response",
      );
    });

    it("upserts validated ENSRainbow config to ENSDb", async () => {
      const fetchedConfig = createEnsRainbowConfig();
      mockGetEnsRainbowPublicConfig.mockResolvedValue(undefined);
      mockGetIndexingStatusSnapshot.mockResolvedValue(createUnstartedIndexingStatus());
      mockEnsRainbowClientConfig.mockResolvedValue(fetchedConfig);

      await registerAndExecuteHandler("Resolver:AddrChanged" as EventNames, createHandler());

      expect(mockUpsertEnsRainbowPublicConfig).toHaveBeenCalledWith(fetchedConfig);
    });

    it("prevents handler execution if ENSRainbow is not ready", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const handler = createHandler();
      mockGetEnsRainbowPublicConfig.mockResolvedValue(undefined);
      mockGetIndexingStatusSnapshot.mockResolvedValue(createUnstartedIndexingStatus());
      mockWaitForEnsRainbow.mockRejectedValue(new Error("ENSRainbow not ready"));

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, handler);

      await expectHandlerThrows(
        async () =>
          getRegisteredCallback()({
            context: { db: createMockDb() } as unknown as Context<EventNames>,
            event: {} as IndexingEngineEvent<EventNames>,
          }),
        "ENSRainbow not ready",
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it("calls waitForEnsRainbowToBeReady only once across multiple onchain events (idempotent)", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const handler1 = createHandler();
      const handler2 = createHandler();

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, handler1);
      addOnchainEventListener("Registry:Transfer" as EventNames, handler2);

      await getRegisteredCallback(0)({
        context: { db: createMockDb() } as unknown as Context<EventNames>,
        event: { args: { a: "1" } } as unknown as IndexingEngineEvent<EventNames>,
      });
      expect(mockWaitForEnsRainbow).toHaveBeenCalledTimes(1);

      await getRegisteredCallback(1)({
        context: { db: createMockDb() } as unknown as Context<EventNames>,
        event: { args: { a: "2" } } as unknown as IndexingEngineEvent<EventNames>,
      });

      expect(mockWaitForEnsRainbow).toHaveBeenCalledTimes(1);
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("resolves ENSRainbow before calling the handler", async () => {
      let preconditionResolved = false;

      mockGetEnsRainbowPublicConfig.mockResolvedValue(undefined);
      mockGetIndexingStatusSnapshot.mockResolvedValue(createUnstartedIndexingStatus());
      mockWaitForEnsRainbow.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        preconditionResolved = true;
      });

      const handler = await registerAndExecuteHandler(
        "Resolver:AddrChanged" as EventNames,
        createHandler(),
      );

      expect(preconditionResolved).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    it("propagates ENSRainbow connection errors with context", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      mockGetEnsRainbowPublicConfig.mockRejectedValue(new Error("Database connection failed"));

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, createHandler());

      await expectHandlerThrows(
        async () =>
          getRegisteredCallback()({
            context: { db: createMockDb() } as unknown as Context<EventNames>,
            event: {} as IndexingEngineEvent<EventNames>,
          }),
        /.*/,
      );
    });
  });

  describe("setup events (no preconditions)", () => {
    async function registerAndExecuteSetupEvent(
      eventName: string,
      handler: ReturnType<typeof createHandler>,
    ) {
      const { addOnchainEventListener } = await getPonderModule();
      addOnchainEventListener(eventName as EventNames, handler);
      await getRegisteredCallback()({
        context: { db: createMockDb() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });
      return handler;
    }

    it("skips ENSRainbow wait for :setup events", async () => {
      await registerAndExecuteSetupEvent("Registry:setup", createHandler());

      expect(mockWaitForEnsRainbow).not.toHaveBeenCalled();
      expect(mockGetEnsRainbowPublicConfig).not.toHaveBeenCalled();
      expect(mockGetIndexingStatusSnapshot).not.toHaveBeenCalled();
    });

    it("skips all ENSRainbow connection setup for :setup events", async () => {
      await registerAndExecuteSetupEvent("PublicResolver:setup", createHandler());

      expect(mockEnsRainbowClientConfig).not.toHaveBeenCalled();
      expect(mockUpsertEnsRainbowPublicConfig).not.toHaveBeenCalled();
    });

    it("handles various setup event name formats", async () => {
      const setupEvents = [
        "Registry:setup",
        "PublicResolver:setup",
        "ETHRegistrarController:setup",
      ];

      for (const eventName of setupEvents) {
        vi.clearAllMocks();
        const handler = createHandler();

        await registerAndExecuteSetupEvent(eventName, handler);

        expect(mockWaitForEnsRainbow).not.toHaveBeenCalled();
        expect(mockGetEnsRainbowPublicConfig).not.toHaveBeenCalled();
        expect(handler).toHaveBeenCalled();
      }
    });

    it("calls prepareIndexingSetup only once across multiple setup events", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const handler1 = createHandler();
      const handler2 = createHandler();

      addOnchainEventListener("Registry:setup" as EventNames, handler1);
      addOnchainEventListener("PublicResolver:setup" as EventNames, handler2);

      await getRegisteredCallback(0)({
        context: { db: createMockDb() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });
      await getRegisteredCallback(1)({
        context: { db: createMockDb() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe("event type detection", () => {
    it("treats :setup suffix as setup event type", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const setupHandler = createHandler();
      const onchainHandler = createHandler();

      addOnchainEventListener("PublicResolver:setup" as EventNames, setupHandler);
      addOnchainEventListener("PublicResolver:AddrChanged" as EventNames, onchainHandler);

      await getRegisteredCallback(0)({
        context: { db: createMockDb() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });
      expect(mockWaitForEnsRainbow).not.toHaveBeenCalled();
      expect(setupHandler).toHaveBeenCalled();

      await getRegisteredCallback(1)({
        context: { db: createMockDb() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });
      expect(mockWaitForEnsRainbow).toHaveBeenCalledTimes(1);
      expect(onchainHandler).toHaveBeenCalled();
    });

    it("treats all non-:setup events as onchain events", async () => {
      const handler = createHandler();
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
          context: { db: createMockDb() } as unknown as Context<EventNames>,
          event: {} as IndexingEngineEvent<EventNames>,
        });

        expect(mockWaitForEnsRainbow).toHaveBeenCalled();
        expect(handler).toHaveBeenCalled();
      }
    });
  });

  describe("prepareIndexingActivation error handling", () => {
    it("throws when ensureValidEnsRainbowConnection fails", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      mockGetEnsRainbowPublicConfig.mockRejectedValue(new Error("Connection failed"));

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, createHandler());

      await expectHandlerThrows(
        async () =>
          getRegisteredCallback()({
            context: { db: createMockDb() } as unknown as Context<EventNames>,
            event: {} as IndexingEngineEvent<EventNames>,
          }),
        "Connection failed",
      );
    });

    it("throws error with cause when connection fails", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const originalError = new Error("Original connection error");
      mockGetEnsRainbowPublicConfig.mockRejectedValue(originalError);

      addOnchainEventListener("Resolver:AddrChanged" as EventNames, createHandler());

      try {
        await getRegisteredCallback()({
          context: { db: createMockDb() } as unknown as Context<EventNames>,
          event: {} as IndexingEngineEvent<EventNames>,
        });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBe(originalError);
      }
    });
  });

  describe("integration: setup followed by onchain events", () => {
    it("handles setup event then onchain event correctly", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const setupHandler = createHandler();
      const onchainHandler = createHandler();

      addOnchainEventListener("Registry:setup" as EventNames, setupHandler);
      addOnchainEventListener("Registry:Transfer" as EventNames, onchainHandler);

      await getRegisteredCallback(0)({
        context: { db: createMockDb() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });
      expect(setupHandler).toHaveBeenCalledTimes(1);
      expect(mockGetEnsRainbowPublicConfig).not.toHaveBeenCalled();

      await getRegisteredCallback(1)({
        context: { db: createMockDb() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });
      expect(onchainHandler).toHaveBeenCalledTimes(1);
      expect(mockGetEnsRainbowPublicConfig).toHaveBeenCalledTimes(1);
    });

    it("handles multiple setup events before first onchain event", async () => {
      const { addOnchainEventListener } = await getPonderModule();
      const setupHandler1 = createHandler();
      const setupHandler2 = createHandler();
      const onchainHandler = createHandler();

      addOnchainEventListener("Registry:setup" as EventNames, setupHandler1);
      addOnchainEventListener("Resolver:setup" as EventNames, setupHandler2);
      addOnchainEventListener("Registry:Transfer" as EventNames, onchainHandler);

      await getRegisteredCallback(0)({
        context: { db: createMockDb() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });
      await getRegisteredCallback(1)({
        context: { db: createMockDb() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });

      expect(setupHandler1).toHaveBeenCalledTimes(1);
      expect(setupHandler2).toHaveBeenCalledTimes(1);
      expect(mockGetEnsRainbowPublicConfig).not.toHaveBeenCalled();

      await getRegisteredCallback(2)({
        context: { db: createMockDb() } as unknown as Context<EventNames>,
        event: {} as IndexingEngineEvent<EventNames>,
      });

      expect(onchainHandler).toHaveBeenCalledTimes(1);
      expect(mockGetEnsRainbowPublicConfig).toHaveBeenCalledTimes(1);
    });
  });
});

describe("IndexingEngineContext type", () => {
  it("exposes ensDb matching the Ponder db type", () => {
    expectTypeOf<IndexingEngineContext["ensDb"]>().toEqualTypeOf<Context<EventNames>["db"]>();
  });
});
