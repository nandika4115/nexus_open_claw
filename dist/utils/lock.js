const locks = new Map();
export async function withFileLock(key, task) {
    const previous = locks.get(key) ?? Promise.resolve();
    let release;
    const current = new Promise((resolve) => {
        release = resolve;
    });
    locks.set(key, previous.then(() => current));
    try {
        await previous;
        return await task();
    }
    finally {
        release();
        if (locks.get(key) === current) {
            locks.delete(key);
        }
    }
}
