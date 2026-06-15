import { twMerge } from "tailwind-merge";

type ClassArray = ClassValue[];
type ClassDictionary = Record<string, boolean | null | undefined>;
type ClassValue =
  | ClassArray
  | ClassDictionary
  | false
  | null
  | string
  | undefined;

function normalizeClassValue(classValue: ClassValue): string {
  if (!classValue) {
    return "";
  }

  if (typeof classValue === "string") {
    return classValue;
  }

  if (Array.isArray(classValue)) {
    return classValue.map(normalizeClassValue).filter(Boolean).join(" ");
  }

  return Object.entries(classValue)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([className]) => className)
    .join(" ");
}

export function cn(...classes: ClassValue[]) {
  return twMerge(classes.map(normalizeClassValue).filter(Boolean).join(" "));
}
