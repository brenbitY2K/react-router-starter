import { createId } from "@paralleldrive/cuid2";

export function generateMockCuid() {
  return createId();
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export function mergeDeep(target: any, source: any): any {
  if (typeof source !== "object" || source === null) {
    return source;
  }

  if (source instanceof Date) {
    return new Date(source);
  }

  const output = { ...target };

  Object.keys(source).forEach((key) => {
    if (typeof source[key] === "object" && source[key] !== null) {
      if (!(key in target)) {
        Object.assign(output, { [key]: source[key] });
      } else {
        output[key] = mergeDeep(target[key], source[key]);
      }
    } else {
      Object.assign(output, { [key]: source[key] });
    }
  });

  return output;
}
