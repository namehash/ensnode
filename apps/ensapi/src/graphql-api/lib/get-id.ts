export const getModelId = <ID, T extends { id: ID }>(model: T): ID => model.id;
