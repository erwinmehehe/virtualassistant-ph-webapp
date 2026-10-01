import Link from "next/link";

type RecruiterOperationsView = "today" | "tasks" | "week" | "notifications";

export function RecruiterOperationsNav({
  current,
  taskCount = 0,
  notificationCount = 0,
}: {
  current: RecruiterOperationsView;
  taskCount?: number;
  notificationCount?: number;
}) {
  const items = [
    ["today", "Today", "/workspace/recruiter/today"],
    ["tasks", taskCount ? `Tasks (${taskCount})` : "Tasks", "/workspace/recruiter/tasks"],
    ["week", "This Week", "/workspace/recruiter/agenda"],
    ["notifications", notificationCount ? `Inbox (${notificationCount})` : "Inbox", "/workspace/recruiter/notifications"],
  ] as const;

  return (
    <nav className="role-filter-tabs" aria-label="My Day views">
      {items.map(([key, label, href]) => (
        <Link key={key} href={href} className={current === key ? "active" : ""} aria-current={current === key ? "page" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
