import type { Account, Hex } from "../types";

export interface AccountsApi {
  getAccount(address: Hex): Promise<Account | null>;
}
