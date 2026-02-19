import { z } from "zod";

export const enumFromConst = <T extends Record<string, string>>(obj: T, message?: string) => {
   const values = Object.values(obj) as [T[keyof T], ...T[keyof T][]];
   return z.enum(values, message ? { error: message } : undefined);
};
