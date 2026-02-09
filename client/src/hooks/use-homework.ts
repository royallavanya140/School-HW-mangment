import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertHomework } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useHomework(filters: { date?: string; class?: string }) {
  // Only fetch if date is present or we want strict filtering
  // For teacher view (usually strict date), for admin view (date + class)
  
  const queryKey = [api.homework.list.path, filters.date, filters.class];

  return useQuery({
    queryKey,
    queryFn: async () => {
      // Build query params
      const params = new URLSearchParams();
      if (filters.date) params.append("date", filters.date);
      if (filters.class) params.append("class", filters.class);
      
      const url = `${api.homework.list.path}?${params.toString()}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch homework");
      return api.homework.list.responses[200].parse(await res.json());
    },
    enabled: true // Always enabled, filters are optional in API
  });
}

export function useCreateHomework() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertHomework) => {
      const res = await fetch(api.homework.create.path, {
        method: api.homework.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.homework.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create homework");
      }
      return api.homework.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.homework.list.path] });
      toast({ title: "Success", description: "Homework entry added to diary." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useUpdateHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertHomework> }) => {
      const url = buildUrl(api.homework.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to update homework");
      }
      return api.homework.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.homework.list.path] });
    },
    onError: (error) => {
      console.error("Update error:", error.message);
    }
  });
}

export function useDeleteHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.homework.delete.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete homework");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.homework.list.path] });
    }
  });
}
