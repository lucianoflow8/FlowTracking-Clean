// Layout mínimo para /login: fija un revalidate válido para static export
export const revalidate = false; // ✅ tiene que ser número >= 0 o false

export default function LoginLayout({ children }) {
  return children;
}