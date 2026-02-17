"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function SearchBar({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search papers, authors, topics..."
        className="flex-1"
      />
      <Button type="submit">Search</Button>
    </form>
  );
}
