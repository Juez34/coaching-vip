import RoleNavigation from "../../components/RoleNavigation";

export default function CoachLayout({ children }) {
  return (
    <>
      <RoleNavigation role="coach" />
      {children}
    </>
  );
}
