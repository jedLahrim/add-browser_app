export class Constant {
  static resetRandomCodeString = Math.random().toString(36).substring(36);
  static JWTSecret: string = "jedJlxSecret2023";

  static randomCodeString = function(length = 6) {
    return Math.random().toString(20).substr(2, length);
  };

  static randomString = Constant.randomCodeString(7);

  static ResetCodeString = function(length = 6) {
    return Math.random().toString(20).substr(2, length);
  };
  static randomCode: any = Math.floor(Math.random() * 100000 + 1);
  static resetRandomCode: any = Math.floor(Math.random() * 100000 + 1);

  static resetString = Constant.ResetCodeString(7);
}
