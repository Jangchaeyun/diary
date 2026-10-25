import { AsyncLocalStorage } from "node:async_hooks";

const storage = new AsyncLocalStorage<string>();

export function currentUserId() {
  const id = storage.getStore();
  if (!id) throw new Error("사용자 없이 일기에 접근했습니다.");
  return id;
}

export function withUser<T>(userId: string, fn: () => T) {
  return storage.run(userId, fn);
}
