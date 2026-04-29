import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const PREFIX = "enc:";

function getKey(): Buffer | null {
    const raw = process.env.ENCRYPTION_KEY;
    if (!raw) return null;
    // Accept 64-char hex string (32 bytes) or raw string padded/trimmed to 32 bytes
    if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
        return Buffer.from(raw, "hex");
    }
    const padded = raw.padEnd(32, "0").slice(0, 32);
    return Buffer.from(padded);
}

export function encryptValue(text: string): string {
    if (!text) return text;
    if (text.startsWith(PREFIX)) return text; // already encrypted
    const key = getKey();
    if (!key) {
        console.warn("ENCRYPTION_KEY not set — storing API key in plaintext. Add ENCRYPTION_KEY to .env for encryption.");
        return text;
    }
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptValue(text: string): string {
    if (!text || !text.startsWith(PREFIX)) return text; // not encrypted, return as-is
    const key = getKey();
    if (!key) return ""; // can't decrypt without key
    try {
        const [ivHex, tagHex, dataHex] = text.slice(PREFIX.length).split(":");
        const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
        decipher.setAuthTag(Buffer.from(tagHex, "hex"));
        return Buffer.concat([
            decipher.update(Buffer.from(dataHex, "hex")),
            decipher.final(),
        ]).toString("utf8");
    } catch {
        return "";
    }
}
