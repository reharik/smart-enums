export class EnumRevivalError extends Error {
  public constructor(
    message: string,
    public readonly path: string,
    public readonly value: unknown,
  ) {
    super(message);
    this.name = 'EnumRevivalError';
  }
}
