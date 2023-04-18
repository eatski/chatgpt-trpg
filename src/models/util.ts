import { collection, DocumentData, DocumentReference, QueryDocumentSnapshot, SnapshotOptions } from "@firebase/firestore";
import { z, ZodSchema } from "zod";

class ZodSchemaConverter<S extends ZodSchema<DocumentData>> {
    constructor(private schema: S) {}
  
    toFirestore(data: z.infer<S>) {
      return this.schema.parse(data);
    }
  
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions) {
      const data = snapshot.data(options);
      return this.schema.parse(data);
    }
}
type MappedItem = {
    document: z.ZodSchema<DocumentData>;
    collections?: Record<string, MappedItem>;
};
  
export type StorePathMap = Record<string, MappedItem>;
type StorePathIncludesNotString<M extends StorePathMap> = keyof M | StorePathRecur<M, keyof M>;
type StorePathRecur<M extends StorePathMap, K extends keyof M> = K extends string
  ? M[K]['collections'] extends StorePathMap
    ? StorePathIncludesNotString<M[K]['collections']> extends string ? `${K}/${string}/${StorePathIncludesNotString<M[K]['collections']>}` : never
    : never
  : never;

type StorePath<M extends StorePathMap> = StorePathIncludesNotString<M> extends string ? StorePathIncludesNotString<M> : never;

type ExtractFirstKey<P, M extends StorePathMap> = P extends `${infer K extends (keyof M) & string}/${string}/${string}` ? K : P;

type ExtractRestPath<P, K extends string, M extends StorePathMap> = P extends `${K}/${string}/${infer Rest}` ? Rest extends StorePath<Exclude<M[K]['collections'], undefined>> ? Rest : never : never;

export type ExtractZodSchema<M extends StorePathMap, P extends StorePath<M>> = P extends keyof M
  ? M[P]['document']
  : ExtractZodSchemaHelper<M, P, ExtractFirstKey<P, M>>;

type ExtractZodSchemaHelper<M extends StorePathMap, P extends StorePath<M>, K extends keyof M> =
  K extends keyof M & string
    ? M[K]['collections'] extends StorePathMap
      ? ExtractZodSchema<Exclude<M[K]['collections'], undefined>, ExtractRestPath<P, K, M>>
      : never
    : never;

export const createCollectionRefFactory = <M extends StorePathMap>(root: DocumentReference,map: M) => <P extends StorePath<M>>(path: P) => {
  
  const pathSegments = path.split("/");

  const zodSchema = pathSegments.reduce<{type: "item",value?: MappedItem} | {type: "map", value?: StorePathMap}>((prev, segment) => {
    if(prev.type === "map"){
      return {
        type: "item",
        value: prev.value?.[segment]
      }
    }
    return {
      type: "map",
      value: prev.value?.collections
    }
  }, {
    type:"map",
    value: map
  });
  
  if(zodSchema.type === "map" || !zodSchema.value){
    throw new Error()
  }

  const converter = new ZodSchemaConverter(zodSchema.value.document);
  return collection(root,path).withConverter<z.infer<ExtractZodSchema<M,P>>>(converter as never);
}

 