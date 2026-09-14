import type { RawParsedDocument } from "../types";

export interface DocumentParser {
  parse(buffer: Buffer): Promise<RawParsedDocument>;
}
