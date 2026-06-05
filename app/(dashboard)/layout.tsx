import { Sidebar } from "@/components/layout/Sidebar"
import { GroupProvider } from "@/components/providers/GroupProvider"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <GroupProvider>
      <div className="flex min-h-dvh items-start">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>
    </GroupProvider>
  )
}
