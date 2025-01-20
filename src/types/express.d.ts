// src/types/express.d.ts

import { IUser } from '../interfaces';

declare global {
  namespace Express {
    export interface Request {
      user?: IUser;
    }
  }
}
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        email: string;
        role: string;
        stripeCustomerId?: string;
      };
    }
  }
}
