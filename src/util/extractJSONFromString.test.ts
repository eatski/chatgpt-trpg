import { expect, test, describe } from "vitest";
import { extractJSONFromString } from "./extractJSONFromString";

describe("extractJSONFromString", () => {
  test("extract", () => {
    expect(
      extractJSONFromString(
        `鍋Bにはアボカドが入っています。 {"responses":[{"content": "鍋Bの中身を見ました。","visibility": "public"},{”type”:”image”,”promptToGenerate”:”A pot filled with avocado.”,"visibility": "private"}]}`,
      ),
    ).toBe(
      `{"responses":[{"content": "鍋Bの中身を見ました。","visibility": "public"},{”type”:”image”,”promptToGenerate”:”A pot filled with avocado.”,"visibility": "private"}]}`,
    );
  });
});
