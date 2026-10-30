export type PasswordRecoveryErrors = {
  email?: string;
  password?: string;
  password_confirmation?: string;
};

export function validatePasswordRecovery(
  form: { email: string; password: string; confirmation: string },
  reset: boolean,
): PasswordRecoveryErrors {
  const errors: PasswordRecoveryErrors = {};
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    errors.email = "Informe um e-mail válido.";
  }
  if (reset && form.password.length < 8) {
    errors.password = "A senha deve ter pelo menos 8 caracteres.";
  }
  if (reset && form.password !== form.confirmation) {
    errors.password_confirmation = "As senhas devem ser iguais.";
  }
  return errors;
}
