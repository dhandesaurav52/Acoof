'use client';
import { DashboardLayout as NewDashboardLayout } from '@/components/DashboardLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NewDashboardLayout>{children}</NewDashboardLayout>;
}
