import { Card } from "../../components/ui/Card.jsx";
import { Input, Select } from "../../components/ui/Input.jsx";
import { SectionHeader } from "../../components/ui/SectionHeader.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";

export function SettingsPage() {
  usePageTitle("Settings");
  return (
    <Card className="max-w-4xl">
      <SectionHeader title="Workspace settings" />
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="Workspace name" defaultValue="Northstar Marketplace" />
        <Select label="Notification preference"><option>Every important action</option><option>Daily digest</option><option>Only payment events</option></Select>
        <label className="flex items-center justify-between rounded-md border p-4 md:col-span-2">
          <span><strong className="block">Require approval before payout</strong><span className="text-sm text-ink-500">Hold funds until final review is complete.</span></span>
          <input type="checkbox" defaultChecked className="h-5 w-5 accent-brand-600" />
        </label>
      </div>
    </Card>
  );
}
