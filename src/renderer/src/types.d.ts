declare global {
  type Result = {
    pitch: number,
    rhythm: number,
    emotion: 1 | 2 | 3 | 4 | 5,
    total: number,
    content: string
  };

  type LoginRequest = {
    email: string,
    password: string
  };

  type LoginResponse = {
    token: string,
    email: string,
    userName: string
  }
}

export { }