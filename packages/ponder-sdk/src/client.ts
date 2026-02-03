import { type PonderStatusResponse, parsePonderStatusResponse } from "./ponder-status";

export class PonderClient {
  constructor(private baseUrl: URL) {}

  /**
   * Get Ponder Status
   *
   * @returns Validated Ponder Status response
   * @throws Error if the response is invalid
   */
  async status(): Promise<PonderStatusResponse> {
    const requestUrl = new URL("/status", this.baseUrl);
    const response = await fetch(requestUrl);
    const data = await response.json();

    return parsePonderStatusResponse(data);
  }
}
