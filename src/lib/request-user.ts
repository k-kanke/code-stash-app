export function getRequestUserId() {
  const userId =
    process.env.NEXT_PUBLIC_MOCK_USER_ID ??
    process.env.NEXT_PUBLIC_USER_ID ??
    process.env.USER_ID;

  if (!userId) {
    throw new Error("NEXT_PUBLIC_MOCK_USER_ID is not set");
  }

  return userId;
}
