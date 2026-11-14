/**
 * Where the sign-in page may send the owner afterwards: only the assistant
 * consent page or a photo upload link. Anything else is dropped, so a crafted
 * link cannot turn the sign-in form into a redirect to another site.
 */
const NEXT = /^\/(oauth\/consent\?[\w=&%.-]+|admin\/upload\/[0-9a-f-]{36})$/;

export function safeNext(value: unknown): string | undefined {
  return typeof value === "string" && NEXT.test(value) ? value : undefined;
}
