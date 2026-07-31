import Core from "@alicloud/pop-core";

const requiredEnvironmentVariables = [
  "ALIYUN_ACCESS_KEY_ID",
  "ALIYUN_ACCESS_KEY_SECRET",
  "ALIYUN_SMS_SIGN_NAME",
  "ALIYUN_SMS_TEMPLATE_CODE",
] as const;

function getSmsConfig() {
  const missing = requiredEnvironmentVariables.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`SMS configuration is missing: ${missing.join(", ")}`);
  }

  return {
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET!,
    signName: process.env.ALIYUN_SMS_SIGN_NAME!,
    templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE!,
  };
}

function getClient() {
  const config = getSmsConfig();
  return new Core({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    endpoint: "https://dysmsapi.aliyuncs.com",
    apiVersion: "2017-05-25",
  });
}

export async function sendSmsCode(phone: string, code: string): Promise<void> {
  const config = getSmsConfig();
  const response = await getClient().request(
    "SendSms",
    {
      PhoneNumbers: phone,
      SignName: config.signName,
      TemplateCode: config.templateCode,
      TemplateParam: JSON.stringify({ code }),
    },
    { method: "POST" }
  ) as { Code?: string; Message?: string; RequestId?: string };

  if (response.Code !== "OK") {
    throw new Error(
      `Aliyun SMS rejected the request: ${response.Code ?? "UNKNOWN"} ${response.Message ?? ""}`.trim(),
    );
  }
}
