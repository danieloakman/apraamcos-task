export type Result<T, E = Error> =
  | {
      ok: true;
      value: T;
      error?: never;
    }
  | {
      ok: false;
      error: E;
      value?: never;
    };
