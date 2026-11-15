import { describe, expect, it } from "vitest";
import { explainPasswordError, linkError, mayChangePassword, passwordProblem } from "./account";

describe("passwordProblem", () => {
  it("refuses fewer than 8 characters", () => {
    expect(passwordProblem("short", "short")).toBe("account.tooShort");
  });
  it("refuses two different entries", () => {
    expect(passwordProblem("long enough", "long enougH")).toBe("setup.passMismatch");
  });
  it("accepts a matching password of 8 or more", () => {
    expect(passwordProblem("12345678", "12345678")).toBeNull();
  });
});

describe("explainPasswordError", () => {
  it("names the cases the owner can act on", () => {
    expect(explainPasswordError({ code: "same_password", message: "" })).toBe(
      "account.samePassword",
    );
    expect(explainPasswordError({ code: "weak_password", message: "" })).toBe(
      "account.weakPassword",
    );
    expect(explainPasswordError({ code: "reauthentication_needed", message: "" })).toBe(
      "account.signInAgain",
    );
    expect(explainPasswordError({ code: "invalid_credentials", message: "" })).toBe(
      "account.wrongCurrent",
    );
  });
  it("recognises a wrong current password said in words only", () => {
    expect(
      explainPasswordError({ message: "Current password required when setting new password." }),
    ).toBe("account.wrongCurrent");
  });
  it("leaves anything else to the raw message", () => {
    expect(explainPasswordError({ code: "unexpected_failure", message: "boom" })).toBeNull();
  });
});

describe("linkError", () => {
  it("reads Supabase's error from the link", () => {
    expect(linkError("#error=access_denied&error_code=otp_expired&error_description=x")).toBe(
      "otp_expired",
    );
  });
  it("is null for a good link", () => {
    expect(linkError("#access_token=abc&type=recovery")).toBeNull();
  });
});

describe("mayChangePassword", () => {
  it("lets every admin change it on a real shop", () => {
    expect(mayChangePassword(false, "staff")).toBe(true);
    expect(mayChangePassword(false, "owner")).toBe(true);
  });
  it("lets only the owner change it on the demo", () => {
    expect(mayChangePassword(true, "owner")).toBe(true);
    expect(mayChangePassword(true, "staff")).toBe(false);
    expect(mayChangePassword(true, null)).toBe(false);
  });
});
