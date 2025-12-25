export enum PageStatus {
  PASSWORD_CHANGE_FAILED = -3,
  OTP_ERROR = -2,
  EMAIL_ERROR = -1,
  BASE_PAGE = 0,
  EMAIL_SENT = 1,
  OTP_VERIFIED = 2,
  PASSWORD_CHANGED = 3,
  ERROR = -100
};

export enum EmailStatus {
  NO_ERROR = 0,
  USER_NOT_FOUND = 1,
  USER_HAS_NO_EMAIL = 2,
  ACCOUNT_ALREADY_EXISTS = 3,
  OTHER = 4
}

export enum OtpStatus {
  NO_ERROR = 0,
  OTP_INVALID = 1,
  OTP_EXPIRED = 2,
  NO_REQUEST = 3,
  BAD_REQUEST = 4,
  OTHER = 5
}

export enum SignInError {
  USER_DOESNT_EXIST = "User with the specified ID doesn't exist",
  ACCOUNT_NOT_INITIALIZED = "User account not yet created. Please create a new account with this ID and set a password to continue",
  INCORRECT_PASSWORD = "Incorrect Password",
  UNKNOWN_ERROR = "An unknown error has occurred. Please check your internet connection and try again later"
}