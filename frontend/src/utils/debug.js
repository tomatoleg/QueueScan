export const debug = (...args) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};
