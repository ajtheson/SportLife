type SendSmsInput = {
  to: string;
  text: string;
};

function normalizeVnPhone(phone: string) {
  const trimmed = phone.trim();

  if (trimmed.startsWith("+")) {
    return trimmed.slice(1);
  }

  if (trimmed.startsWith("0")) {
    return `84${trimmed.slice(1)}`;
  }

  return trimmed;
}

async function sendEsmsSms(input: SendSmsInput) {
  const apiKey = process.env.ESMS_API_KEY;
  const secretKey = process.env.ESMS_SECRET_KEY;
  const brandname = process.env.ESMS_BRANDNAME;

  if (!apiKey || !secretKey) {
    throw new Error("eSMS provider requires ESMS_API_KEY and ESMS_SECRET_KEY.");
  }

  // SmsType 2 = Brandname OTP (requires registered brandname)
  // SmsType 8 = Random number OTP (no brandname needed, suitable for personal projects)
  const useBrandname = !!brandname;

  const response = await fetch("https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ApiKey: apiKey,
      SecretKey: secretKey,
      ...(useBrandname ? { Brandname: brandname } : {}),
      SmsType: useBrandname ? "2" : "8",
      Phone: normalizeVnPhone(input.to),
      Content: input.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`eSMS request failed with HTTP ${response.status}.`);
  }

  const result = (await response.json()) as { CodeResult?: string; ErrorMessage?: string };

  if (result.CodeResult !== "100") {
    throw new Error(`eSMS send failed: ${result.CodeResult ?? "unknown"} ${result.ErrorMessage ?? ""}`.trim());
  }
}

async function sendSpeedSms(input: SendSmsInput) {
  const accessToken = process.env.SPEEDSMS_ACCESS_TOKEN;
  const sender = process.env.SPEEDSMS_SENDER;

  if (!accessToken || !sender) {
    throw new Error("SpeedSMS provider requires SPEEDSMS_ACCESS_TOKEN and SPEEDSMS_SENDER.");
  }

  const auth = Buffer.from(`${accessToken}:x`, "utf8").toString("base64");

  const response = await fetch("https://api.speedsms.vn/index.php/sms/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      to: [normalizeVnPhone(input.to)],
      content: input.text,
      sms_type: 2,
      sender,
    }),
  });

  if (!response.ok) {
    throw new Error(`SpeedSMS request failed with HTTP ${response.status}.`);
  }

  const result = (await response.json()) as { status?: string; message?: string };

  if (result.status !== "success") {
    throw new Error(`SpeedSMS send failed: ${result.message ?? "unknown error"}`);
  }
}

export async function sendSms(input: SendSmsInput) {
  const provider = process.env.SMS_PROVIDER;

  if (!provider || provider === "console") {
    console.info("[sms:console]", input);
    return;
  }

  if (provider === "esms") {
    await sendEsmsSms(input);
    return;
  }

  if (provider === "speedsms") {
    await sendSpeedSms(input);
    return;
  }

  throw new Error("Selected SMS provider is not implemented yet.");
}
