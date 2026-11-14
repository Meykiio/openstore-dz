import { describe, expect, it } from "vitest";
import { explainPasswordError, passwordProblem } from "./account";

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
