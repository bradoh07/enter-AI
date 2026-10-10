import { AuthShell } from "../auth/AuthShell";
import { SetPasswordForm } from "../auth/SetPasswordForm";

/**
 * Landing screen for the recovery email. Reaching it without a session shows a
 * clear route back to sign-in instead of a broken form.
 */
const ResetPasswordPage = () => (
  <AuthShell>
    <SetPasswordForm />
  </AuthShell>
);

export default ResetPasswordPage;
