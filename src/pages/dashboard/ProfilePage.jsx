import { useEffect, useRef, useState } from "react";
import { FiCamera, FiEdit3, FiLink, FiTwitter, FiUpload } from "react-icons/fi";
import { userService } from "../../api/services/userService.js";
import { Avatar } from "../../components/ui/Avatar.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Input, Textarea } from "../../components/ui/Input.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTaskStatsQuery } from "../../hooks/api/useTasks.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const statsQuery = useTaskStatsQuery();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  usePageTitle("Profile");

  const stats = Array.isArray(statsQuery.data?.data?.stats) ? statsQuery.data.data.stats : [];
  const getStatValue = (pattern) => Number(stats.find((item) => new RegExp(pattern, "i").test(item.label || ""))?.value || 0);

  const freelancerStats = user?.role === "freelancer"
    ? {
        assigned: getStatValue("assigned"),
        completed: getStatValue("completed"),
      }
    : null;
  const adminStats = user?.role === "admin"
    ? {
        total: getStatValue("total tasks"),
        completed: getStatValue("completed"),
      }
    : null;

  const throughputPercent = user?.role === "freelancer"
    ? freelancerStats && freelancerStats.assigned > 0
      ? Math.min(100, Math.round((freelancerStats.completed / freelancerStats.assigned) * 100))
      : 75
    : adminStats && adminStats.total > 0
      ? Math.min(100, Math.round((adminStats.completed / adminStats.total) * 100))
      : 75;

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    if (!avatarFile) setAvatarPreview(user?.avatar || "");
  }, [user, avatarFile]);

  useEffect(() => {
    if (!avatarFile) return undefined;
    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile]);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    setError("");
    setSuccess("");

    if (!file) return;
    if (!AVATAR_TYPES.has(file.type)) {
      setAvatarFile(null);
      setError("Choose a PNG, JPG, WEBP, or GIF image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarFile(null);
      setError("Profile photo must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    setAvatarFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }

    setIsSaving(true);
    try {
      let avatar = user?.avatar || "";
      let latestUser = user;

      if (avatarFile) {
        const uploadRes = await userService.uploadAvatar(avatarFile);
        avatar = uploadRes?.data?.avatar || avatar;
        latestUser = uploadRes?.data?.user || latestUser;
      }

      const profileRes = await userService.updateProfile({ name: name.trim(), avatar });
      latestUser = profileRes?.data?.user || latestUser;

      const nextUser = {
        ...(user || {}),
        ...(latestUser || {}),
        name: name.trim(),
        avatar: latestUser?.avatar ?? avatar ?? user?.avatar ?? "",
      };

      setUser(nextUser);
      setAvatarFile(null);
      setAvatarPreview(nextUser?.avatar || "");
      setSuccess("Profile updated.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message || "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <Avatar src={avatarPreview || user?.avatar} name={name || user?.name} size="lg" />
        <h2 className="mt-4 text-xl font-semibold">{name || user?.name}</h2>
        <p className="mt-1 text-sm capitalize text-ink-500">{user?.role} account</p>
        <p className="mt-4 text-sm leading-6 text-ink-600 dark:text-ink-300">
          Product-minded operator focused on fast, well-scoped work and clear handoffs.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["React", "Design systems", "Research", "SaaS"].map((skill) => <Badge key={skill}>{skill}</Badge>)}
        </div>

        {user?.role === "freelancer" || user?.role === "admin" ? (
          <div className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-900/50 dark:bg-brand-950/30">
            <p className="text-sm font-semibold text-brand-700 dark:text-brand-200">Platform throughput</p>
            <p className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{throughputPercent}%</p>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
              {user?.role === "freelancer"
                ? `${freelancerStats?.completed || 0} completed • ${freelancerStats?.assigned || 0} assigned`
                : `${adminStats?.completed || 0} completed • ${adminStats?.total || 0} total tasks`}
            </p>
            {user?.role === "admin" ? <p className="mt-2 text-xs text-brand-700 dark:text-brand-200">Admin overview</p> : null}
          </div>
        ) : null}

        <div className="mt-5 flex gap-2 text-sm text-brand-700 dark:text-brand-200">
          <FiLink /> portfolio.example.com <FiTwitter />
        </div>
      </Card>
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">Edit profile</h2>
            <Button icon={FiEdit3} disabled={isSaving}>{isSaving ? "Saving..." : "Save changes"}</Button>
          </div>

          <div className="mb-5 flex flex-col gap-4 rounded-md border border-ink-200 p-4 dark:border-ink-700 sm:flex-row sm:items-center">
            <Avatar src={avatarPreview} name={name || user?.name} size="xl" />
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-white">Profile photo</p>
                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">PNG, JPG, WEBP, or GIF up to 5MB.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" icon={FiUpload} onClick={() => fileInputRef.current?.click()}>
                  Upload photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  className="sr-only"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>
            <FiCamera className="hidden h-5 w-5 text-ink-400 lg:block" aria-hidden="true" />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} />
            <Input label="Email" value={email} onChange={(event) => setEmail(event.target.value)} disabled />
            <Input label="Portfolio" defaultValue="https://portfolio.example.com" />
            <Input label="Social link" defaultValue="https://x.com/microtask" />
            <div className="md:col-span-2"><Textarea label="Bio" defaultValue="I help teams turn small tasks into shipped outcomes with sharp communication and reliable delivery." /></div>
          </div>

          {error ? <p className="mt-4 text-sm font-medium text-coral-700 dark:text-coral-300">{error}</p> : null}
          {success ? <p className="mt-4 text-sm font-medium text-brand-700 dark:text-brand-200">{success}</p> : null}
        </form>
      </Card>
    </div>
  );
}
