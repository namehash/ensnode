export interface IntrospectionTypeRef {
  readonly kind: string;
  readonly name?: string;
  readonly ofType?: IntrospectionTypeRef | null;
}

export interface IntrospectionField {
  readonly name: string;
  readonly type: IntrospectionTypeRef;
}

export interface IntrospectionType {
  readonly kind: string;
  readonly name: string;
  readonly fields?: readonly IntrospectionField[] | null;
}

export interface IntrospectionSchema {
  readonly __schema: {
    readonly types: readonly IntrospectionType[];
  };
}

export function unwrapType(type: IntrospectionTypeRef): IntrospectionTypeRef {
  return type.ofType ? unwrapType(type.ofType) : type;
}
