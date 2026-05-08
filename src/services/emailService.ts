import { resend } from "../lib/emailClient";

const releaseNotificationTemplate = () => `<!doctype html>
<html lang="ko">
  <body style="margin:0;padding:0;background:#fafafa;font-family:'Pretendard','Apple SD Gothic Neo',sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
            <tr>
              <td style="background:linear-gradient(135deg,#FFD1E3 0%,#DFBAE3 100%);padding:48px 40px;text-align:center;">
                <div style="font-family:'Gmarket Sans',sans-serif;font-weight:700;font-size:32px;color:#A63EB1;letter-spacing:-0.02em;">muse.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <h1 style="margin:0 0 16px;font-size:24px;line-height:1.4;color:#1a1a1a;">알림 신청이 완료되었어요 🎉</h1>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#525252;">
                  muse 출시 알림을 신청해주셔서 감사합니다.<br />
                  서비스가 출시되면 가장 먼저 알려드릴게요.
                </p>
                <p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:#525252;">
                  20만 장의 인상 데이터로 만드는 AI 광고 모델,<br />
                  곧 만나뵐 수 있도록 준비하고 있어요.
                </p>
                <div style="border-top:1px solid #eeeeee;padding-top:24px;font-size:13px;color:#a3a3a3;line-height:1.6;">
                  본 메일은 발신 전용입니다. 문의는 themuselab.kr로 부탁드립니다.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const sendReleaseNotificationEmail = async (
  to: string,
): Promise<{ ok: boolean; error?: string }> => {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY 미설정, 발송 생략", { to });
    return { ok: false, error: "RESEND_API_KEY 미설정" };
  }

  const from = process.env.EMAIL_FROM ?? "muse <onboarding@resend.dev>";

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject: "muse 출시 알림 신청이 완료되었습니다",
      html: releaseNotificationTemplate(),
    });
    if (result.error) {
      console.error("[email] 발송 실패", { to, error: result.error });
      return { ok: false, error: result.error.message };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    console.error("[email] 발송 예외", { to, message });
    return { ok: false, error: message };
  }
};
