
const ITERATIONS = 100_000;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

async function hashPassword(
  password: string,
  saltHex: string
): Promise<string> {
  const salt = Uint8Array.from(
    saltHex.match(/.{2}/g) ?? [],
    pair => parseInt(pair, 16)
  );

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    key,
    256
  );

  return toHex(new Uint8Array(bits));
}

export async function createDemoVerifier(password: string) {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));

  return {
    salt,
    passwordHash: await hashPassword(password, salt)
  };
}

export async function verifyDemoPassword(
  password: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  return (await hashPassword(password, salt)) === expectedHash;
}
