// src/types/global.d.ts

declare global {
    namespace Express {
      interface Request {
        user?: {
          _id?: string;
          id?: string;
          email?: string;
          role?: string;
          stripeCustomerId?: string;
          firstName?: string;
          lastName?: string;
          username?: string;
        };
      }
    }
  }
  
  // Export an empty object to make this a module
  export {};