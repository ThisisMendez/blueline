export const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;

export function isValidNewPassword(password: string): boolean {
  return [...password].length >= PASSWORD_MIN_LENGTH
    && new TextEncoder().encode(password).length <= PASSWORD_MAX_BYTES;
}
