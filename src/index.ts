import Realm from 'realm'
import { InvalidObjectTypeError } from "./errors";
import { ObjectSchema } from "realm";
import { IObjectMapper } from "./types";

export const load = (path: string): Promise<Realm> => new Promise((resolve, reject) => {
    return Realm.open({ readOnly: true, path: path }).then(resolve, reject);
});

const simpleObjectMapper: IObjectMapper = function(
  object: object,
  schema: ObjectSchema
): object {
  return Object.keys(schema.properties).reduce((acc, prop) => {
    acc[prop] = object[prop];
    return acc;
  }, {});
};

export const select = (
  objectType: string,
  objectMapper: IObjectMapper = simpleObjectMapper
) => (realm: Realm): Promise<IterableIterator<object>> =>
  new Promise((resolve, reject) => {
    const schema = realm.schema.find(schema => schema.name === objectType);

    if (!schema) {
      return reject(
        new InvalidObjectTypeError(
          `Could not find the schema for ${objectType} object type`
        )
      );
    }

    const objects = realm.objects(objectType).entries();
    const decoratedObjects = function*(): IterableIterator<object> {
      for (let [, object] of objects) {
        yield objectMapper(object, schema);
      }
    };

    return resolve(decoratedObjects());
  });