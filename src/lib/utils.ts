import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date, withTime?: boolean) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  let result = `${day}/${month}/${year}`;
  if (withTime) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    result += ` ${hours}:${minutes}`;
  }   
  return result;
}

