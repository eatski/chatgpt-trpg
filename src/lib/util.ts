export const never = (msg: string): never => {
  throw new Error(msg);
};
