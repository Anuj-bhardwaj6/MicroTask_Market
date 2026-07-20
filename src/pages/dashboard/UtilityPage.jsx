import { Card } from "../../components/ui/Card.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { SkeletonLoader } from "../../components/ui/Skeleton.jsx";
import { adminUsers, tasks } from "../../data/sampleData.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";

export function UtilityPage({ title, type = "default" }) {
  usePageTitle(title);
  if (type === "empty") return <EmptyState title={title} message="This workspace view is ready for real backend data and currently has no queued records." action="Create sample" />;
  if (type === "loading") return <Card><SkeletonLoader /></Card>;

  return (
    <Card>
      <h2 className="mb-5 text-xl font-semibold">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-ink-500"><tr><th className="py-3">Name</th><th>Type</th><th>Status</th><th className="text-right">Value</th></tr></thead>
          <tbody className="divide-y">
            {(type === "users" ? adminUsers : tasks).map((item) => (
              <tr key={item.name || item.id}>
                <td className="py-3 font-medium">{item.name || item.title}</td>
                <td>{item.role || item.category}</td>
                <td>{item.status}</td>
                <td className="text-right font-semibold">{item.spend || `$${item.budget}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
