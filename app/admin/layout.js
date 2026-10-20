import RoleNavigation from "../../components/RoleNavigation";

export default function AdminLayout({ children }) {
  return (
    <>
      <RoleNavigation role="admin" />
      {children}
    </>
  );
}
