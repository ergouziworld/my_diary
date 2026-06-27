import Core from "@alicloud/pop-core";

function getClient() {
  return new Core({
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET!,
    endpoint: "https://dypns.aliyuncs.com",
    apiVersion: "2017-05-25",
  });
}

export async function sendSmsCode(phone: string, code: string): Promise<void> {
  await getClient().request(
    "SendSmsVerificationCode",
    {
      PhoneNumbers: phone,
      SignName: process.env.ALIYUN_SMS_SIGN_NAME ?? "速通互联验证码",
      TemplateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE ?? "100001",
      TemplateParam: JSON.stringify({ code, min: "5" }),
    },
    { method: "POST" }
  );
}
