export class JitFormError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'JitFormError';
  }
}
