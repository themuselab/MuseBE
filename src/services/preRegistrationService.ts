import * as preRegistrationRepository from "../repositories/preRegistrationRepository";
import { preRegistrationErrors } from "../errors/preRegistrationErrors";
import { sendReleaseNotificationEmail } from "./emailService";
import {
  notifyPreRegistrationSuccess,
  notifyPreRegistrationError,
} from "./discordNotifier";

type SubmitInput = {
  email: string;
  phone?: string;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
  source?: "signup_waitlist" | "landing_cta";
};

export const submit = async (input: SubmitInput) => {
  const existing = await preRegistrationRepository.findByEmail(input.email);
  if (existing) {
    throw preRegistrationErrors.emailExists();
  }

  const source = input.source ?? "signup_waitlist";

  let created;
  try {
    created = await preRegistrationRepository.create({ ...input, source });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB 저장 실패";
    void notifyPreRegistrationError({
      email: input.email,
      stage: "db",
      errorMessage: message,
    });
    throw err;
  }

  // 부가 작업: 디스코드 + 이메일. 어느 쪽 실패도 사용자 응답을 깨뜨리지 않음.
  void notifyPreRegistrationSuccess({
    email: created.email,
    source: created.source,
    id: created.id,
  });

  const emailResult = await sendReleaseNotificationEmail(created.email);
  if (!emailResult.ok) {
    void notifyPreRegistrationError({
      email: created.email,
      stage: "email",
      errorMessage: emailResult.error ?? "알 수 없는 오류",
    });
  }

  return {
    id: created.id,
    email: created.email,
    createdAt: created.createdAt,
  };
};
