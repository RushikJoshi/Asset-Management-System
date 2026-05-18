import crypto from "crypto";

const getSecret = () => process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET || "joho-asset-management-dev-secret";

const base64Url = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

const sign = (payload) =>
  crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");

export const createToken = (user) => {
  const header = base64Url({ alg: "HS256", typ: "JWT" });
  const body = base64Url({
    sub: String(user._id),
    role: user.role,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  });
  const signature = sign(`${header}.${body}`);

  return `${header}.${body}.${signature}`;
};

export const verifyToken = (token) => {
  if (!token) return null;

  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) return null;

  const expectedSignature = sign(`${header}.${body}`);
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );

  if (!isValid) return null;

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
};
