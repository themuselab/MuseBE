import * as preRegistrationRepository from "../repositories/preRegistrationRepository";
import { preRegistrationErrors } from "../errors/preRegistrationErrors";

type SubmitInput = {
  email: string;
  phone?: string;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
};

export const submit = async (input: SubmitInput) => {
  const existing = await preRegistrationRepository.findByEmail(input.email);
  if (existing) {
    throw preRegistrationErrors.emailExists();
  }

  const created = await preRegistrationRepository.create(input);
  return {
    id: created.id,
    email: created.email,
    createdAt: created.createdAt,
  };
};
