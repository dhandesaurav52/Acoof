
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // This layout no longer provides any specific UI.
    // The main Header and Footer are now controlled by the root layout (src/app/layout.tsx)
    // to ensure a consistent look and feel across the entire application.
    return <>{children}</>;
}
