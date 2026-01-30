// Auth configuration - will be implemented in Phase 2
import NextAuth from "next-auth";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // Configuration will be added in Phase 2
  providers: [],
});
