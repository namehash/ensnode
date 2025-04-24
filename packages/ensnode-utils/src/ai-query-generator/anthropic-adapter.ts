import Anthropic, { type ClientOptions } from "@anthropic-ai/sdk";
import { Adapter, type AdapterResponse } from "@gqlpt/adapter-base";

export interface AdapterAnthropicOptions extends ClientOptions {
  /** The Anthropic model to use */
  model?: Model;

  /** The system prompt to use */
  systemPrompt?: string;
}

export enum Model {
  Claude35Sonnet = "claude-3-5-sonnet-20241022",
  Claude37Sonnet = "claude-3-7-sonnet-20250219",
}

/**
 * Adapter for Anthropic with selectable model and system prompt.
 *
 * Based on https://github.com/rocket-connect/gqlpt/blob/18af9c9/packages/adapter-anthropic/src/index.ts
 */
export class AdapterAnthropic extends Adapter {
  /** Anthropic client */
  private anthropic: Anthropic;

  /** The Anthropic model to use */
  private model: Model;

  /** The system prompt to use */
  private systemPrompt: string;

  private messageHistory: Map<string, Array<Anthropic.MessageParam>> = new Map();

  constructor(options: AdapterAnthropicOptions) {
    super();
    this.anthropic = new Anthropic(options);
    this.model = options.model ?? Model.Claude37Sonnet;
    this.systemPrompt = options.systemPrompt ?? "";
  }

  /**
   * Connect to Anthropic
   *
   * Based on https://github.com/rocket-connect/gqlpt/blob/18af9c9/packages/adapter-anthropic/src/index.ts#L18-L30
   */
  async connect() {
    const response = await this.anthropic.messages.create({
      system:
        "You are to test the connection to the Anthropic API. Respond with 'Pong' when you see 'Ping'.",
      messages: [{ role: "user", content: "Ping" }],
      model: this.model,
      max_tokens: 1024,
    });

    if ((response.content[0] as any).text !== "Pong") {
      throw new Error("Cannot connect to Anthropic");
    }
  }

  /**
   * Send a text message to Anthropic
   *
   * Based on https://github.com/rocket-connect/gqlpt/blob/18af9c9/packages/adapter-anthropic/src/index.ts#L32-L61
   */
  async sendText(text: string, conversationId?: string): Promise<AdapterResponse> {
    let messages: Array<Anthropic.MessageParam> = [{ role: "user", content: text }];

    if (conversationId && this.messageHistory.has(conversationId)) {
      messages = [...this.messageHistory.get(conversationId)!, ...messages];
    }

    const response = await this.anthropic.messages.create({
      // add system prompt if it was provided
      system: this.systemPrompt,
      messages,
      // use the selected model
      model: this.model,
      // set a default max tokens
      max_tokens: 1024,
    });

    const content = (response.content[0] as any).text;
    const newId = response.id;

    this.messageHistory.set(newId, [
      ...(conversationId ? this.messageHistory.get(conversationId) || [] : []),
      { role: "user" as const, content: text },
      { role: "assistant" as const, content },
    ]);

    return {
      content,
      conversationId: newId,
    };
  }
}
