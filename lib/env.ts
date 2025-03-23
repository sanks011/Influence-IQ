// Environment variables validation
export function validateEnv() {
  const requiredEnvVars = [
    "YOUTUBE_API_KEY",
    "NEWS_API_KEY",
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  ]

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

  if (missingEnvVars.length > 0) {
    console.warn(`Missing required environment variables: ${missingEnvVars.join(", ")}`)
  }

  // Optional but recommended
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set. AI analysis features will be limited.")
  }

  return missingEnvVars.length === 0
}

// Get environment variables with fallbacks
export function getEnv() {
  return {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || "",
    NEWS_API_KEY: process.env.NEWS_API_KEY || "",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
    FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  }
}

