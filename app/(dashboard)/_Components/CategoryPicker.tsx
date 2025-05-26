"use client";

import { TransactionType } from "@/app/types/transaction";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Category } from "@/lib/generated/prisma";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Check, CheckIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import CreateCategoryDialog from "./CreateCategoryDialog";
interface Props {
  type: TransactionType;
  onChange: (value: string) => void;
}
function CategoryPicker({ type, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!value) return;
    onChange(value);
  }, [onChange, value]);

  // get categories
  const categoriesQuery = useQuery({
    queryKey: ["categories", type],
    queryFn: async () => {
      const res = await fetch(`/api/categories?type=${type}`);
      return res.json();
    },
  });
  // handle category selection
  const selectedCategory = categoriesQuery.data?.find(
    (category: Category) => category.name === value
  );

  const successCallback = React.useCallback(
    (category: Category) => {
      setValue(category.name);
      setOpen((prev) => !prev);
    },
    [setValue, setOpen]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between cursor-pointer"
        >
          {selectedCategory ? (
            <CategoryRow category={selectedCategory} />
          ) : (
            "Select a category"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          <CommandInput placeholder="Search categories..." />
          <CreateCategoryDialog type={type} successCallback={successCallback} />
          <Command>
            <CommandEmpty>
              <p>Category not found</p>
              <p className="text-xs text-muted-foreground">
                Tip: <span className="font-bold">Create new</span> category
              </p>
            </CommandEmpty>
            <CommandGroup>
              <CommandList>
                {categoriesQuery.data?.map((category: Category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    className="cursor-pointer"
                    onSelect={() => {
                      setValue(category.name);
                      setOpen((prev) => !prev);
                    }}
                  >
                    <CategoryRow category={category} />
                    <CheckIcon
                      className={cn(
                        "ml-auto w-4 h-4 opacity-0 p-0.5 border rounded-full bg-foreground text-background",
                        value === category.name && "opacity-100"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandList>
            </CommandGroup>
          </Command>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default CategoryPicker;

function CategoryRow({ category }: { category: Category }) {
  return (
    <div className="flex items-center gap-2">
      <span role="img">{category.icon}</span>
      <span>{category.name}</span>
    </div>
  );
}

export { CategoryPicker };
