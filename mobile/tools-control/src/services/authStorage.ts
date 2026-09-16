export function setUser(user: any) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser() {
  if (typeof window === "undefined") return null;

  const data = localStorage.getItem("user");
  return data ? JSON.parse(data) : null;
}

export function logout() {
  localStorage.removeItem("user");
}