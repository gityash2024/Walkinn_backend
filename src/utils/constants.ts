
export const APP_CONSTANTS = {
    ROLES: {
      ADMIN: 'admin',
      USER: 'user',
      AGENT: 'agent',
      SCANNER: 'scanner'
    },
    
    PAYMENT_STATUS: {
      PENDING: 'pending',
      COMPLETED: 'completed',
      FAILED: 'failed',
      REFUNDED: 'refunded'
    },
    
    EVENT_STATUS: {
      DRAFT: 'draft',
      PUBLISHED: 'published',
      CANCELLED: 'cancelled',
      COMPLETED: 'completed'
    },
  
    EVENT_TYPES: {
      ONLINE: 'online',
      OFFLINE: 'offline',
      HYBRID: 'hybrid'
    },
  
    TICKET_STATUS: {
      ACTIVE: 'active',
      USED: 'used',
      CANCELLED: 'cancelled',
      EXPIRED: 'expired'
    },
  
    TICKET_TYPES: {
      SINGLE: 'single',
      COUPLE: 'couple',
      GROUP: 'group'
    },
  
    FILE_TYPES: {
      IMAGE: ['image/jpeg', 'image/png', 'image/gif'],
      DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      AVATAR: ['image/jpeg', 'image/png']
    },
  
    FILE_SIZES: {
      IMAGE: 5 * 1024 * 1024, // 5MB
      DOCUMENT: 10 * 1024 * 1024, // 10MB
      AVATAR: 2 * 1024 * 1024 // 2MB
    },
  
    PAGINATION: {
      DEFAULT_PAGE: 1,
      DEFAULT_LIMIT: 10
    },
  
    TIME: {
      OTP_EXPIRY: 10 * 60, // 10 minutes in seconds
      RESET_PASSWORD_EXPIRY: 30 * 60, // 30 minutes in seconds
      TOKEN_EXPIRY: '1h',
      REFRESH_TOKEN_EXPIRY: '7d'
    }
  };
  