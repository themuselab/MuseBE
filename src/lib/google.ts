import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL ?? "http://localhost:4000/auth/google/callback";

const oAuth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
);

type GoogleUserInfo = {
  email: string;
  googleId: string;
};

export const getGoogleAuthUrl = (state: string): string => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["email", "profile"],
    state,
    prompt: "consent",
  });
  return url;
};

export const exchangeGoogleCode = async (code: string): Promise<GoogleUserInfo> => {
  const { tokens } = await oAuth2Client.getToken(code);
  const idToken = tokens.id_token;

  if (!idToken) {
    throw new Error("Google ID token not received");
  }

  const ticket = await oAuth2Client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email || !payload.sub) {
    throw new Error("Invalid Google token payload");
  }

  return {
    email: payload.email,
    googleId: payload.sub,
  };
};
