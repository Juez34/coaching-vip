import RoleNavigation from "../../components/RoleNavigation";

export default function ClientLayout({ children }) {
  return (
    <>
      <RoleNavigation role="student" />
      {children}
    </>
  );
}
