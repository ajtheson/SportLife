type SendSmsInput = {
  to: string;
  text: string;
};

/**
 * Normalize a Vietnamese phone number to E.164 format (+84XXXXXXXXX).
 * UniMatrix requires E.164 format.
 */
function normalizeVnPhoneE164(phone: string) {
  const trimmed = phone.trim();

  if (trimmed.startsWith("+84")) {
    return trimmed;
  }

  if (trimmed.startsWith("84")) {
    return `+${trimmed}`;
  }

  if (trimmed.startsWith("0")) {
    return `+84${trimmed.slice(1)}`;
  }

  return `+${trimmed}`;
}

/**
 * Send SMS via UniMatrix (unimtx.com) REST API.
 *
 * API: POST https://api.unimtx.com/?action=sms.message.send&accessKeyId=...
 * Docs: https://www.unimtx.com/docs/api/send
 * Reference: D:\PRN222_Group5_ApartmentManagement\...\UniMatrixHelper.cs
 *
 * Only requires UNIMTX_ACCESS_KEY_ID (Simple Mode).
 * Optionally uses UNIMTX_ACCESS_KEY_SECRET for HMAC signing.
 */
async function sendUnimtxSms(input: SendSmsInput) {
  const accessKeyId = process.env.UNIMTX_ACCESS_KEY_ID;

  if (!accessKeyId) {
    throw new Error("UniMatrix provider requires UNIMTX_ACCESS_KEY_ID.");
  }

  const url = new URL("https://api.unimtx.com/");
  url.searchParams.set("action", "sms.message.send");
  url.searchParams.set("accessKeyId", accessKeyId);

  // Parse 6-digit OTP code to support public templates on trial/unverified accounts.
  const otpMatch = input.text.match(/\b\d{6}\b/);
  const otpCode = otpMatch ? otpMatch[0] : null;

  const requestBody = otpCode
    ? {
        to: normalizeVnPhoneE164(input.to),
        templateId: "pub_verif_en_basic2",
        templateData: {
          code: otpCode,
        },
      }
    : {
        to: normalizeVnPhoneE164(input.to),
        text: input.text,
      };

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`UniMatrix request failed with HTTP ${response.status}. Response: ${errorText}`);
  }

  const result = (await response.json()) as {
    code?: string;
    message?: string;
  };

  // code "0" = success (same as C# reference: resp.Code == "0")
  if (result.code !== "0") {
    throw new Error(
      `UniMatrix send failed: [${result.code ?? "unknown"}] ${result.message ?? ""}`.trim()
    );
  }
}

export async function sendSms(input: SendSmsInput) {
  const provider = process.env.SMS_PROVIDER;

  if (!provider || provider === "console") {
    console.info("[sms:console]", input);
    return;
  }

  if (provider === "unimtx") {
    await sendUnimtxSms(input);
    return;
  }

  throw new Error(
    `SMS provider "${provider}" is not configured. Set SMS_PROVIDER=unimtx or SMS_PROVIDER=console.`
  );
}

