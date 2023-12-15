import { get, set } from "idb-keyval";

/**
 *
 * @template T
 * @param {string} key
 * @returns {import('../..').Store<T>}
 */
export default function createStore(key) {
  return {
    async get() {
      return get(key);
    },
    async set(value) {
      return set(key, value);
    },
  };
}
