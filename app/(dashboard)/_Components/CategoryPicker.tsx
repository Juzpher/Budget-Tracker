"use client";

import { TransactionType } from "@/app/types/transaction";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
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
import { Check } from "lucide-react";
import React, { useState } from "react";
import CreateCategoryDialog from "./CreateCategoryDialog";
interface Props {
  type: TransactionType;
}
function CategoryPicker({ type }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  // get categories
  const categoriesQuery = useQuery({
    queryKey: ["categories", type],
    queryFn: async () => {
      const res = await fetch(`/api/categories?type=${type}`);
      return res.json();
    },
  });
  // handle category selection
  const selectedCategory = categoriesQuery.data?.find((category: Category) => {
    category.name === value;
  });
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
          <CreateCategoryDialog type={type} />
          <CommandList>
            <CommandEmpty>No categories found.</CommandEmpty>
            {categoriesQuery.data?.map((category: Category) => (
              <CommandItem
                key={category.id}
                value={category.name}
                onSelect={() => {
                  setValue(category.name);
                }}
              >
                <CategoryRow category={category} />
              </CommandItem>
            ))}
          </CommandList>
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
