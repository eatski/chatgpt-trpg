import { QueryDocumentSnapshot, SnapshotOptions } from "@firebase/firestore";
import { z } from "zod";

export class ZodSchemaConverter<T> {
  constructor(private schema: z.ZodSchema<T>) {}

  toFirestore(data: T) {
    return this.schema.parse(data);
  }

  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions) {
    const data = snapshot.data(options);
    return this.schema.parse(data);
  }
}
