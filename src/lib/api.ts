import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "./auth";
import { cherriesForCompletion, nextDueDate, todayStr } from "./dates";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Prefs = Database["public"]["Tables"]["preferences"]["Row"];

export const AREAS = [
  { key: "personal", label: "Personal" },
  { key: "work", label: "Work" },
  { key: "studies", label: "Studies" },
  { key: "creative", label: "Creative" },
] as const;

export const areaDot: Record<string, string> = {
  personal: "bg-area-personal",
  work: "bg-area-work",
  studies: "bg-area-studies",
  creative: "bg-area-creative",
};

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/* ---------- preferences ---------- */
export function usePrefs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["prefs", user?.id],
    enabled: !!user,
    queryFn: async () => check(await supabase.from("preferences").select("*").eq("user_id", user!.id).maybeSingle()),
  });
}

export function useSavePrefs() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patch: Partial<Prefs>) =>
      check(await supabase.from("preferences").upsert({ user_id: user!.id, ...patch }).select().single()),
    onSuccess: (data) => qc.setQueryData(["prefs", user?.id], data),
  });
}

/* ---------- tasks ---------- */
export function useTasks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tasks", user?.id],
    enabled: !!user,
    queryFn: async () =>
      check(
        await supabase
          .from("tasks")
          .select("*")
          .neq("status", "archived")
          .order("position")
          .order("created_at"),
      ),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["prefs"] });
  };
}

export function useAddTasks() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (rows: TaskInsert[]) => check(await supabase.from("tasks").insert(rows).select()),
    onSuccess: inv,
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Task> & { id: string }) =>
      check(await supabase.from("tasks").update(patch).eq("id", id).select().single()),
    onMutate: async ({ id, ...patch }) => {
      qc.setQueryData<Task[]>(["tasks", user?.id], (old) => old?.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => check(await supabase.from("tasks").delete().eq("id", id)),
    onSuccess: inv,
  });
}

/** Complete / un-complete a task. Handles recurrence and gentle cherry rewards. Returns cherries earned. */
export function useToggleTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: prefs } = usePrefs();
  return useMutation({
    mutationFn: async (task: Task) => {
      const done = task.status !== "done";
      const today = todayStr();
      if (!done) {
        check(await supabase.from("tasks").update({ status: "todo", completed_at: null }).eq("id", task.id));
        return 0;
      }
      check(await supabase.from("tasks").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", task.id));
      const next = nextDueDate(task.due_date, task.recurrence, today);
      if (next) {
        check(
          await supabase.from("tasks").insert({
            title: task.title,
            notes: task.notes,
            area: task.area,
            project_id: task.project_id,
            due_date: next,
            due_time: task.due_time,
            recurrence: task.recurrence,
            estimate_min: task.estimate_min,
          }),
        );
      }
      const tasks = qc.getQueryData<Task[]>(["tasks", user?.id]) ?? [];
      const doneToday = tasks.filter((t) => t.status === "done" && t.completed_at && t.completed_at.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
      const earned = cherriesForCompletion(doneToday, prefs?.rewards_enabled ?? true);
      if (earned && prefs) {
        check(await supabase.from("preferences").update({ cherries: prefs.cherries + earned }).eq("user_id", user!.id));
      }
      return earned;
    },
    onMutate: (task) => {
      qc.setQueryData<Task[]>(["tasks", user?.id], (old) =>
        old?.map((t) => (t.id === task.id ? { ...t, status: task.status === "done" ? "todo" : "done", completed_at: task.status === "done" ? null : new Date().toISOString() } : t)),
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["prefs"] });
    },
  });
}

/* ---------- projects ---------- */
export function useProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["projects", user?.id],
    enabled: !!user,
    queryFn: async () => check(await supabase.from("projects").select("*").order("created_at", { ascending: false })),
  });
}

export function useSaveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<Project> & { name: string }) =>
      p.id
        ? check(await supabase.from("projects").update(p).eq("id", p.id).select().single())
        : check(await supabase.from("projects").insert(p).select().single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => check(await supabase.from("projects").delete().eq("id", id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

/* ---------- check-ins ---------- */
export function useCheckIn(day: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["checkin", user?.id, day],
    enabled: !!user,
    queryFn: async () => check(await supabase.from("check_ins").select("*").eq("day", day).maybeSingle()),
  });
}

export function useSetCheckIn() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ day, energy }: { day: string; energy: string }) =>
      check(await supabase.from("check_ins").upsert({ user_id: user!.id, day, energy }, { onConflict: "user_id,day" }).select().single()),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["checkin", user?.id, v.day] }),
  });
}

/* ---------- rewards ---------- */
export function useRewards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["rewards", user?.id],
    enabled: !!user,
    queryFn: async () => check(await supabase.from("rewards").select("*")),
  });
}

export function useLogFocus() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: prefs } = usePrefs();
  return useMutation({
    mutationFn: async ({ taskId, minutes }: { taskId: string | null; minutes: number }) => {
      check(await supabase.from("focus_sessions").insert({ task_id: taskId, minutes }));
      if (prefs?.rewards_enabled && minutes > 0) {
        check(await supabase.from("preferences").update({ cherries: prefs.cherries + 2 }).eq("user_id", user!.id));
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prefs"] }),
  });
}

export function sortPicks(tasks: Task[]) {
  return tasks.filter((t) => t.is_pick && t.status === "todo" && !t.parent_id).sort((a, b) => a.position - b.position);
}
