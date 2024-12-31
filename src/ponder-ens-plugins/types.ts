export interface PonderEnsModule {
  /**
   * Check if the module can be activated
   */
  get canActivate(): boolean;

  /**
   * Runs the module activation logic
   */
  activate(): Promise<void>;
}

export interface PonderEnsIndexingHandlerModule {
  /**
   * Attaches indexing handlers for the module
   */
  attachHandlers(): void;
}
