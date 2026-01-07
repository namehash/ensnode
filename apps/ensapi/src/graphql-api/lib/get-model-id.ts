/**
 * Simple type-safe accessor for *.id for use with Dataloader.
 */
export const getModelId = <ID, T extends { id: ID }>(model: T): ID => model.id;
