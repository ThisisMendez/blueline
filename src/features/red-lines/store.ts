export interface RedLineStore {
  read(signerId: string): Promise<readonly string[]>;
  save(signerId: string, lines: readonly string[]): Promise<void>;
}
