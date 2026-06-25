const KEY_BYTES = 32;
const KEY_PREFIX = "reg_";

function encodeBase58(buffer: Buffer): string {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = BigInt("0x" + buffer.toString("hex"));
  let encoded = "";
  while (num > BigInt(0)) {
    const remainder = Number(num % BigInt(58));
    encoded = alphabet[remainder] + encoded;
    num = num / BigInt(58);
  }
  while (encoded.length < 43) {
    encoded = "1" + encoded;
  }
  return encoded;
}

export async function generateRegistrationKey(): Promise<string> {
  const { randomBytes } = await import("crypto");
  return KEY_PREFIX + encodeBase58(randomBytes(KEY_BYTES));
}

export function buildRegistrationUrl(churchSlug: string, key: string): string {
  return `/join/${churchSlug}?k=${encodeURIComponent(key)}`;
}
