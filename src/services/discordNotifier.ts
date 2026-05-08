type DiscordEmbed = {
  title: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
};

const post = async (payload: { embeds: DiscordEmbed[] }): Promise<void> => {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    console.warn("[discord] DISCORD_WEBHOOK_URL 미설정, 알림 생략");
    return;
  }
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("[discord] 웹훅 응답 비정상", {
        status: res.status,
        statusText: res.statusText,
      });
    }
  } catch (err) {
    console.error("[discord] 웹훅 전송 실패", err);
  }
};

export const notifyPreRegistrationSuccess = (input: {
  email: string;
  source: string;
  id: string;
}): Promise<void> =>
  post({
    embeds: [
      {
        title: "🎉 새로운 사전 알림 신청",
        color: 0xf5cae1,
        fields: [
          { name: "이메일", value: input.email, inline: true },
          { name: "유입", value: input.source, inline: true },
        ],
        footer: { text: `id: ${input.id}` },
        timestamp: new Date().toISOString(),
      },
    ],
  });

export const notifyPreRegistrationError = (input: {
  email?: string;
  stage: "db" | "email";
  errorCode?: string;
  errorMessage: string;
}): Promise<void> =>
  post({
    embeds: [
      {
        title: "🚨 사전 알림 처리 실패",
        color: 0xe53935,
        fields: [
          { name: "단계", value: input.stage, inline: true },
          { name: "이메일", value: input.email ?? "(없음)", inline: true },
          {
            name: "에러",
            value: `${input.errorCode ?? "-"}: ${input.errorMessage}`,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  });
