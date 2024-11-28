import { Input } from "@/components/ui/input";
import { useEffect } from "react";

export default function URLInput({value, setValue}) {
    useEffect(() => {
        console.log(value)
    }, [value])
  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id="input-11"
          className="peer ps-16"
          placeholder="google.com"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value.replace("https://", ""))}
        />
        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground peer-disabled:opacity-50">
          https://
        </span>
      </div>
    </div>
  );
}
