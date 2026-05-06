const locks = new Map<string, Promise<void>>();

export async function withFileLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  let release: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  locks.set(key, previous.then(() => current));

  try {
    await previous;
    return await task();
  } finally {
    release!();
    if (locks.get(key) === current) {
      locks.delete(key);
    }
  }
}
